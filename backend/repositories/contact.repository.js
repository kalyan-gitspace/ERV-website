import db from '../config/db.js';

/**
 * Contact Repository - Encapsulates all SQL queries for the contact_messages table.
 */
export const contactRepository = {
  /**
   * Insert a new contact inquiry
   */
  async create(contactData) {
    const { name, email, phone, message } = contactData;
    const query = `
      INSERT INTO contact_messages (name, email, phone, message)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const result = await db.query(query, [name, email, phone, message]);
    return result.rows[0];
  },

  /**
   * Find all contact messages
   */
  async findAll(options = {}) {
    const { is_read, limit = 20, offset = 0 } = options;
    const params = [];
    let paramCount = 1;

    let query = `
      SELECT * FROM contact_messages
    `;

    if (is_read !== undefined) {
      query += ` WHERE is_read = $${paramCount}`;
      params.push(is_read);
      paramCount++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);
    return result.rows;
  },

  /**
   * Count total contact messages matching filters
   */
  async count(options = {}) {
    const { is_read } = options;
    const params = [];
    let paramCount = 1;

    let query = `
      SELECT COUNT(id) as total FROM contact_messages
    `;

    if (is_read !== undefined) {
      query += ` WHERE is_read = $${paramCount}`;
      params.push(is_read);
      paramCount++;
    }

    const result = await db.query(query, params);
    return parseInt(result.rows[0].total, 10);
  },

  /**
   * Find a contact message by ID
   */
  async findById(id) {
    const query = 'SELECT * FROM contact_messages WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  },

  /**
   * Mark a message as read
   */
  async markAsRead(id) {
    const query = `
      UPDATE contact_messages
      SET is_read = TRUE, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  },

  /**
   * Delete a contact message
   */
  async delete(id) {
    const query = 'DELETE FROM contact_messages WHERE id = $1 RETURNING id';
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }
};
