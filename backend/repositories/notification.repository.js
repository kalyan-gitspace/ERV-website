import db from '../config/db.js';

/**
 * Notification Repository - Encapsulates all SQL queries for the notifications table.
 */
export const notificationRepository = {
  /**
   * Create a new system notification
   */
  async create(notificationData) {
    const { title, message, type, recipientType = 'admin', recipientId = null, relatedId = null } = notificationData;
    const query = `
      INSERT INTO notifications (title, message, type, recipient_type, recipient_id, related_id, is_read)
      VALUES ($1, $2, $3, $4, $5, $6, FALSE)
      ON CONFLICT DO NOTHING
      RETURNING *
    `;
    const result = await db.query(query, [title, message, type, recipientType, recipientId, relatedId]);
    return result.rows[0];
  },

  /**
   * Find all notifications
   * @param {Object} options - Filter options (e.g., is_read, limit)
   */
  async findAll(options = {}) {
    const { is_read, limit = 20, recipientType, recipientId } = options;
    const params = [];
    let paramCount = 1;

    let query = `
      SELECT * FROM notifications
    `;

    if (recipientType) { query += ` WHERE recipient_type = $${paramCount}`; params.push(recipientType); paramCount++; }
    if (recipientId) { query += `${params.length ? ' AND' : ' WHERE'} recipient_id = $${paramCount}`; params.push(recipientId); paramCount++; }
    if (is_read !== undefined) {
      query += `${params.length ? ' AND' : ' WHERE'} is_read = $${paramCount}`;
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
  },

  async pendingUnreadLeaveCount() {
    const result = await db.query(`
      SELECT COUNT(*)::int AS count
      FROM notifications n
      JOIN leave_requests r ON r.id = n.related_id
      WHERE n.type = 'leave_request'
        AND n.recipient_type = 'admin'
        AND n.is_read = FALSE
        AND r.status = 'Pending'
    `);
    return result.rows[0]?.count || 0;
  },

  async markUnreadLeaveRequestsAsRead() {
    const result = await db.query(`
      UPDATE notifications n
      SET is_read = TRUE, updated_at = CURRENT_TIMESTAMP
      FROM leave_requests r
      WHERE r.id = n.related_id
        AND n.type = 'leave_request'
        AND n.recipient_type = 'admin'
        AND n.is_read = FALSE
        AND r.status = 'Pending'
      RETURNING n.id
    `);
    return result.rows;
  },

  async removeForLeaveRequest(leaveRequestId) {
    await db.query(`DELETE FROM notifications WHERE type = 'leave_request' AND related_id = $1`, [leaveRequestId]);
  }
};
