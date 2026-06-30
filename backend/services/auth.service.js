import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { adminRepository } from '../repositories/admin.repository.js';
import logger from '../config/logger.js';

const JWT_SECRET = process.env.JWT_SECRET || 'erv_default_jwt_secret_key_2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m'; // e.g. 15m

/**
 * Helper to generate a SHA-256 hash of a string
 */
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export const authService = {
  /**
   * Authenticate an administrator and issue tokens
   * @param {string} email - Admin email
   * @param {string} password - Admin password
   * @param {boolean} rememberMe - Toggle for 30-day session vs 7-day session
   * @param {Object} deviceData - IP, Browser, Platform metadata
   */
  async login(email, password, rememberMe = false, deviceData = {}) {
    const admin = await adminRepository.findByEmail(email);
    if (!admin) {
      logger.warn(`LOGIN_FAILURE: Email ${email} not found.`, { ip: deviceData.ip_address });
      return null;
    }

    if (!admin.is_active) {
      logger.warn(`LOGIN_FAILURE: Account ${email} is inactive/disabled.`, { ip: deviceData.ip_address });
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password_hash);
    if (!isPasswordValid) {
      logger.warn(`LOGIN_FAILURE: Invalid password for ${email}.`, { ip: deviceData.ip_address });
      return null;
    }

    // Generate Tokens
    const accessToken = this.generateAccessToken(admin);
    const refreshToken = this.generateRefreshToken();

    // Determine refresh token lifetime (Remember Me: 30 days, Default: 7 days)
    const tokenLifetimeDays = rememberMe ? 30 : 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + tokenLifetimeDays);
    
    const tokenHash = hashToken(refreshToken);
    
    // Save to database with device session details
    await adminRepository.saveRefreshToken(admin.id, tokenHash, expiresAt, deviceData);

    logger.info(`LOGIN_SUCCESS: Admin ${email} authenticated. RememberMe: ${rememberMe}`, {
      adminId: admin.id,
      ip: deviceData.ip_address,
      browser: deviceData.browser
    });
    
    return {
      admin: {
        id: admin.id,
        email: admin.email,
        fullName: admin.full_name,
        roleName: admin.role_name
      },
      accessToken,
      refreshToken,
      cookieMaxAge: tokenLifetimeDays * 24 * 60 * 60 * 1000 // lifetime in ms
    };
  },

  /**
   * Rotate refresh token: verify old refresh token, revoke it, and issue a new pair
   * @param {string} refreshToken - Raw refresh token string
   * @param {Object} deviceData - Device metadata for the new session log
   */
  async rotateToken(refreshToken, deviceData = {}) {
    const tokenHash = hashToken(refreshToken);
    const tokenRecord = await adminRepository.findRefreshToken(tokenHash);
    
    if (!tokenRecord) {
      logger.warn('TOKEN_REFRESH_FAILURE: Refresh token is invalid, expired, or revoked.');
      return null;
    }

    // Fetch the admin associated with this token
    const admin = await adminRepository.findById(tokenRecord.admin_id);
    if (!admin || !admin.is_active) {
      logger.warn(`TOKEN_REFRESH_FAILURE: Admin account is missing or inactive.`);
      return null;
    }

    // Revoke the old refresh token
    await adminRepository.revokeRefreshToken(refreshToken);

    // Generate new pair
    const newAccessToken = this.generateAccessToken(admin);
    const newRefreshToken = this.generateRefreshToken();

    // Preserve the original "Remember Me" session length (check if lifespan was > 15 days)
    const oldExpires = new Date(tokenRecord.expires_at).getTime();
    const oldCreated = new Date(tokenRecord.created_at).getTime();
    const lifespanDays = Math.round((oldExpires - oldCreated) / (1000 * 60 * 60 * 24));
    const tokenLifetimeDays = lifespanDays > 15 ? 30 : 7;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + tokenLifetimeDays);
    const newTokenHash = hashToken(newRefreshToken);
    
    // Save new refresh token with updated device metadata
    await adminRepository.saveRefreshToken(admin.id, newTokenHash, expiresAt, deviceData);

    logger.info(`TOKEN_REFRESH: Session rotated for ${admin.email}.`, {
      adminId: admin.id,
      ip: deviceData.ip_address
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      cookieMaxAge: tokenLifetimeDays * 24 * 60 * 60 * 1000,
      admin: {
        id: admin.id,
        email: admin.email,
        fullName: admin.full_name,
        roleName: admin.role_name
      }
    };
  },

  /**
   * Logout: Revoke the active refresh token
   */
  async logout(refreshToken) {
    const tokenHash = hashToken(refreshToken);
    await adminRepository.revokeRefreshToken(tokenHash);
    logger.info('LOGOUT: Session ended and refresh token revoked.');
    return true;
  },

  /**
   * Revoke all other active sessions for an admin except the current one (security reset)
   * @param {string} adminId - ID of the admin
   * @param {string} currentRefreshToken - The current active refresh token to keep
   */
  async revokeOtherSessions(adminId, currentRefreshToken) {
    const currentTokenHash = hashToken(currentRefreshToken);
    await adminRepository.revokeAllOtherRefreshTokens(adminId, currentTokenHash);
    logger.info(`REVOKE_OTHER_SESSIONS: Revoked all other active sessions for admin ID: ${adminId}`);
    return true;
  },

  /**
   * Revoke all sessions for an admin (e.g., account lock / full logout)
   */
  async logoutAllDevices(adminId) {
    await adminRepository.revokeAllRefreshTokensForAdmin(adminId);
    logger.info(`REVOKE_ALL_SESSIONS: Revoked all sessions for admin ID: ${adminId}`);
    return true;
  },

  /**
   * Generate short-lived JWT Access Token
   */
  generateAccessToken(admin) {
    const payload = {
      sub: admin.id,
      email: admin.email,
      name: admin.full_name,
      role: admin.role_name
    };
    
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  },

  /**
   * Generate secure cryptographically strong random Refresh Token string
   */
  generateRefreshToken() {
    return crypto.randomBytes(40).toString('hex');
  },

  /**
   * Verify an access token
   */
  verifyAccessToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return null;
    }
  }
};
