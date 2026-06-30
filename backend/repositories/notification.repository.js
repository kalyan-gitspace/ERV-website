import db from '../config/db.js';

/**
 * Notification Repository - Encapsulates all SQL queries for the notifications table.
 */
export const notificationRepository = {
  /**
   * Create a new system notification
   */
  async create(notificationData) {
    const { title, message, type } = notificationData;
    const query = `
      INSERT INTO notifications (title, message, type, is_read)
      VALUES ($1, $2, $3, FALSE)
      RETURNING *
    `;
    const result = await db.query(query, [title, message, type]);
    return result.rows[0];
  },

  /**
   * Find all notifications
   * @param {Object} options - Filter options (e.g., is_read, limit)
   */
  async findAll(options = {}) {
    const { is_read, limit = 20 } = options;
    const params = [];
    let paramCount = 1;

    let query = `
      SELECT * FROM notifications
    `;

    if (is_read !== undefined) {
      query += ` WHERE is_read = $${paramCount}`;
      params.push(is_read);
      paramCount++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount}`;
    params.push(limit);

    const result = await db.query(query, params);
    return result.rows;
  },

  /**
   * Mark a notification as read
   */
  async markAsRead(id) {
    const query = `
      UPDATE notifications
      SET is_read = TRUE, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead() {
    const query = `
      UPDATE notifications
      SET is_read = TRUE, updated_at = CURRENT_TIMESTAMP
      WHERE is_read = FALSE
      RETURNING id
    `;
    const result = await db.query(query);
    return result.rows;
  }
};
