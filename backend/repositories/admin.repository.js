import db from '../config/db.js';

/**
 * Admin Repository - Encapsulates all SQL queries for admins, roles, and refresh_tokens tables.
 */
export const adminRepository = {
  // =========================================================================
  // ADMIN ACCOUNT OPERATIONS
  // =========================================================================

  /**
   * Find an admin by email (and join their role name)
   */
  async findByEmail(email) {
    const query = `
      SELECT a.*, r.name as role_name
      FROM admins a
      JOIN roles r ON a.role_id = r.id
      WHERE a.email = $1 AND a.is_deleted = FALSE
    `;
    const result = await db.query(query, [email]);
    return result.rows[0] || null;
  },

  /**
   * Find an admin by ID
   */
  async findById(id) {
    const query = `
      SELECT a.*, r.name as role_name
      FROM admins a
      JOIN roles r ON a.role_id = r.id
      WHERE a.id = $1 AND a.is_deleted = FALSE
    `;
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  },

  /**
   * Find all admins (excluding soft-deleted)
   */
  async findAll() {
    const query = `
      SELECT a.id, a.email, a.full_name, a.is_active, a.created_at, r.name as role_name
      FROM admins a
      JOIN roles r ON a.role_id = r.id
      WHERE a.is_deleted = FALSE
      ORDER BY a.created_at DESC
    `;
    const result = await db.query(query);
    return result.rows;
  },

  /**
   * Create an admin
   */
  async create(adminData) {
    const { role_id, email, password_hash, full_name } = adminData;
    const query = `
      INSERT INTO admins (role_id, email, password_hash, full_name, is_active)
      VALUES ($1, $2, $3, $4, TRUE)
      RETURNING id, role_id, email, full_name, is_active, created_at
    `;
    const params = [role_id, email, password_hash, full_name];
    const result = await db.query(query, params);
    return result.rows[0];
  },

  /**
   * Update admin profile
   */
  async update(id, adminData) {
    const { full_name, email, role_id, is_active } = adminData;
    const query = `
      UPDATE admins
      SET full_name = $1, email = $2, role_id = $3, is_active = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $5 AND is_deleted = FALSE
      RETURNING id, role_id, email, full_name, is_active, updated_at
    `;
    const params = [full_name, email, role_id, is_active, id];
    const result = await db.query(query, params);
    return result.rows[0] || null;
  },

  /**
   * Update admin password
   */
  async updatePassword(id, passwordHash) {
    const query = `
      UPDATE admins
      SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND is_deleted = FALSE
      RETURNING id
    `;
    const result = await db.query(query, [passwordHash, id]);
    return result.rows[0] || null;
  },

  /**
   * Soft-delete an admin
   */
  async delete(id) {
    const query = `
      UPDATE admins
      SET is_deleted = TRUE, deleted_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND is_deleted = FALSE
      RETURNING id
    `;
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  },

  // =========================================================================
  // REFRESH TOKEN OPERATIONS
  // =========================================================================

  /**
   * Save a refresh token hash with device metadata
   */
  async saveRefreshToken(adminId, tokenHash, expiresAt, deviceData = {}) {
    const { device_name, browser, platform, ip_address } = deviceData;
    const query = `
      INSERT INTO refresh_tokens (
        admin_id, token_hash, expires_at, device_name, browser, platform, ip_address
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const params = [
      adminId, tokenHash, expiresAt,
      device_name || null, browser || null, platform || null, ip_address || null
    ];
    const result = await db.query(query, params);
    return result.rows[0];
  },

  /**
   * Revoke all refresh tokens for an admin EXCEPT the current active one (on password change)
   */
  async revokeAllOtherRefreshTokens(adminId, currentTokenHash) {
    const query = `
      UPDATE refresh_tokens
      SET revoked_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE admin_id = $1 AND token_hash != $2 AND revoked_at IS NULL
    `;
    await db.query(query, [adminId, currentTokenHash]);
  },

  /**
   * Find an active, unrevoked refresh token
   */
  async findRefreshToken(tokenHash) {
    const query = `
      SELECT * FROM refresh_tokens
      WHERE token_hash = $1 
        AND revoked_at IS NULL 
        AND expires_at > CURRENT_TIMESTAMP
    `;
    const result = await db.query(query, [tokenHash]);
    return result.rows[0] || null;
  },

  /**
   * Revoke a specific refresh token (e.g. on logout)
   */
  async revokeRefreshToken(tokenHash) {
    const query = `
      UPDATE refresh_tokens
      SET revoked_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE token_hash = $1 AND revoked_at IS NULL
      RETURNING id
    `;
    const result = await db.query(query, [tokenHash]);
    return result.rows[0] || null;
  },

  /**
   * Revoke all refresh tokens for an admin (e.g. on password change/security breach)
   */
  async revokeAllRefreshTokensForAdmin(adminId) {
    const query = `
      UPDATE refresh_tokens
      SET revoked_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE admin_id = $1 AND revoked_at IS NULL
    `;
    await db.query(query, [adminId]);
  },

  /**
   * Delete expired/revoked refresh tokens (system cleanup)
   */
  async deleteExpiredRefreshTokens() {
    const query = `
      DELETE FROM refresh_tokens
      WHERE expires_at <= CURRENT_TIMESTAMP OR revoked_at IS NOT NULL
    `;
    const result = await db.query(query);
    return result.rowCount;
  }
};
