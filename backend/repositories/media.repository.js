import db from '../config/db.js';

/**
 * Media Repository - Encapsulates all SQL queries for the media_library table.
 */
export const mediaRepository = {
  /**
   * Find all media assets
   * @param {Object} options - Search/filter options
   */
  async findAll(options = {}) {
    const { file_type, search, limit = 20, offset = 0 } = options;
    const params = [];
    let paramCount = 1;

    let query = `
      SELECT m.*, a.full_name as uploaded_by_name
      FROM media_library m
      LEFT JOIN admins a ON m.uploaded_by = a.id
      WHERE m.is_deleted = FALSE
    `;

    if (file_type) {
      query += ` AND m.file_type = $${paramCount}`;
      params.push(file_type);
      paramCount++;
    }

    if (search) {
      query += ` AND m.filename ILIKE $${paramCount}`;
      params.push(`%${search}%`);
      paramCount++;
    }

    query += ` ORDER BY m.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);
    return result.rows;
  },

  /**
   * Count total media assets matching filters
   */
  async count(options = {}) {
    const { file_type, search } = options;
    const params = [];
    let paramCount = 1;

    let query = `
      SELECT COUNT(id) as total
      FROM media_library
      WHERE is_deleted = FALSE
    `;

    if (file_type) {
      query += ` AND file_type = $${paramCount}`;
      params.push(file_type);
      paramCount++;
    }

    if (search) {
      query += ` AND filename ILIKE $${paramCount}`;
      params.push(`%${search}%`);
      paramCount++;
    }

    const result = await db.query(query, params);
    return parseInt(result.rows[0].total, 10);
  },

  /**
   * Find a media asset by ID
   */
  async findById(id) {
    const query = `
      SELECT m.*, a.full_name as uploaded_by_name
      FROM media_library m
      LEFT JOIN admins a ON m.uploaded_by = a.id
      WHERE m.id = $1 AND m.is_deleted = FALSE
    `;
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  },

  /**
   * Insert a new media record
   */
  async create(mediaData) {
    const { filename, url, public_id, file_type, file_size, uploaded_by } = mediaData;
    const query = `
      INSERT INTO media_library (filename, url, public_id, file_type, file_size, uploaded_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const params = [filename, url, public_id, file_type, file_size, uploaded_by];
    const result = await db.query(query, params);
    return result.rows[0];
  },

  /**
   * Soft-delete a media record
   */
  async delete(id) {
    const query = `
      UPDATE media_library
      SET is_deleted = TRUE, deleted_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND is_deleted = FALSE
      RETURNING *
    `;
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }
};
