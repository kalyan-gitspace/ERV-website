import { authService } from '../services/auth.service.js';
import { adminRepository } from '../repositories/admin.repository.js';
import { dashboardService } from '../services/dashboard.service.js';
import { parseUserAgent } from '../utils/ua.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const REFRESH_COOKIE_NAME = 'erv_refresh_token';

/**
 * Build device metadata from a request
 */
function getDeviceData(req) {
  const ua = parseUserAgent(req.headers['user-agent']);
  return {
    ...ua,
    ip_address: req.ip
  };
}

/**
 * Set the refresh token in a secure HttpOnly cookie
 */
function setRefreshTokenCookie(res, token, maxAge) {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production',
    sameSite: process.env.COOKIE_SAMESITE || 'lax',
    maxAge,
    path: '/api/v1/auth',
  });
}

export const authController = {
  /**
   * Admin Login
   */
  async login(req, res, next) {
    try {
      const { email, password, rememberMe } = req.body;

      if (!email || !password) {
        return res.error(400, 'Email and password are required.');
      }

      const deviceData = getDeviceData(req);
      const result = await authService.login(email, password, !!rememberMe, deviceData);

      if (!result) {
        await dashboardService.logAdminActivity(null, 'LOGIN_FAILURE', { email }, req.ip);
        return res.error(401, 'Invalid email or password.');
      }

      const { admin, accessToken, refreshToken, cookieMaxAge } = result;

      // Set refresh token in HttpOnly cookie
      setRefreshTokenCookie(res, refreshToken, cookieMaxAge);

      // Log the login activity
      await dashboardService.logAdminActivity(admin.id, 'LOGIN_SUCCESS', {
        email: admin.email,
        browser: deviceData.browser,
        platform: deviceData.platform
      }, req.ip);

      return res.ok({ accessToken, admin }, 'Login successful.');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Rotate Access & Refresh Tokens
   */
  async refresh(req, res, next) {
    try {
      const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME] || req.body.refreshToken;

      if (!refreshToken) {
        return res.error(401, 'Refresh token is missing.');
      }

      const deviceData = getDeviceData(req);
      const result = await authService.rotateToken(refreshToken, deviceData);

      if (!result) {
        return res.error(401, 'Invalid or expired session. Please log in again.');
      }

      const { accessToken, refreshToken: newRefreshToken, cookieMaxAge, admin } = result;

      // Set new refresh token in cookie
      setRefreshTokenCookie(res, newRefreshToken, cookieMaxAge);

      return res.ok({ accessToken, admin });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Admin Logout
   */
  async logout(req, res, next) {
    try {
      const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME] || req.body.refreshToken;

      if (refreshToken) {
        await authService.logout(refreshToken);
      }

      // Clear the cookie
      res.clearCookie(REFRESH_COOKIE_NAME, {
        httpOnly: true,
        secure: process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production',
        sameSite: process.env.COOKIE_SAMESITE || 'lax',
        path: '/api/v1/auth',
      });

      if (req.admin) {
        await dashboardService.logAdminActivity(req.admin.sub, 'LOGOUT', { email: req.admin.email }, req.ip);
      }

      return res.ok(null, 'Logout successful.');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get Current Authenticated Admin Profile
   */
  async getProfile(req, res, next) {
    try {
      const admin = await adminRepository.findById(req.admin.sub);
      if (!admin) {
        return res.error(404, 'Admin profile not found.');
      }

      return res.ok({
        id: admin.id,
        email: admin.email,
        fullName: admin.full_name,
        roleName: admin.role_name,
        isActive: admin.is_active
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Change Password — revokes all OTHER sessions, keeps the current one alive
   */
  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      const adminId = req.admin.sub;

      if (!currentPassword || !newPassword) {
        return res.error(400, 'Current and new passwords are required.');
      }

      if (newPassword.length < 8) {
        return res.error(400, 'New password must be at least 8 characters long.');
      }

      const admin = await adminRepository.findById(adminId);
      if (!admin) {
        return res.error(404, 'Admin not found.');
      }

      const isPasswordValid = await bcrypt.compare(currentPassword, admin.password_hash);
      if (!isPasswordValid) {
        return res.error(400, 'Incorrect current password.');
      }

      // Hash and update new password
      const newPasswordHash = await bcrypt.hash(newPassword, 10);
      await adminRepository.updatePassword(adminId, newPasswordHash);

      // Revoke all other sessions, keep current alive
      const currentRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
      if (currentRefreshToken) {
        await authService.revokeOtherSessions(adminId, currentRefreshToken);
      } else {
        // If no cookie (API-only flow), revoke all
        await authService.logoutAllDevices(adminId);
      }

      // Log activity
      await dashboardService.logAdminActivity(adminId, 'PASSWORD_CHANGED', { email: admin.email }, req.ip);

      return res.ok(null, 'Password updated successfully. Other sessions revoked.');
    } catch (error) {
      next(error);
    }
  }
};
