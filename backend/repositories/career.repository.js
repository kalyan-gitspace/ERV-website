import db from '../config/db.js';

/**
 * Career Repository - Encapsulates all SQL queries for the careers table.
 */
export const careerRepository = {
  /**
   * Find all careers (excluding soft-deleted ones)
   * @param {Object} filters - Filter options (e.g. status, department)
   */
  async findAll(filters = {}) {
    const { status, department } = filters;
    const params = [];
    let paramCount = 1;

    let query = `
      SELECT * FROM careers
      WHERE is_deleted = FALSE
    `;

    if (status) {
      query += ` AND status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (department) {
      query += ` AND department = $${paramCount}`;
      params.push(department);
      paramCount++;
    }

    query += ` ORDER BY created_at DESC`;

    const result = await db.query(query, params);
    return result.rows;
  },

  /**
   * Find a career by ID
   */
  async findById(id) {
    const query = `
      SELECT * FROM careers
      WHERE id = $1 AND is_deleted = FALSE
    `;
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  },

  /**
   * Create a new career vacancy
   */
  async create(careerData) {
    const {
      title, department, experience, location, employment_type,
      description, responsibilities, requirements, status
    } = careerData;

    const query = `
      INSERT INTO careers (
        title, department, experience, location, employment_type,
        description, responsibilities, requirements, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const params = [
      title, department, experience, location, employment_type,
      description, responsibilities || [], requirements || [], status || 'Open'
    ];

    const result = await db.query(query, params);
    return result.rows[0];
  },

  /**
   * Update an existing career vacancy
   */
  async update(id, careerData) {
    const {
      title, department, experience, location, employment_type,
      description, responsibilities, requirements, status
    } = careerData;

    const query = `
      UPDATE careers SET
        title = $1,
        department = $2,
        experience = $3,
        location = $4,
        employment_type = $5,
        description = $6,
        responsibilities = $7,
        requirements = $8,
        status = $9,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $10 AND is_deleted = FALSE
      RETURNING *
    `;

    const params = [
      title, department, experience, location, employment_type,
      description, responsibilities || [], requirements || [], status || 'Open',
      id
    ];

    const result = await db.query(query, params);
    return result.rows[0] || null;
  },

  /**
   * Soft-delete a career vacancy
   */
  async delete(id) {
    const query = `
      UPDATE careers
      SET is_deleted = TRUE, deleted_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND is_deleted = FALSE
      RETURNING id
    `;
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  },

  /**
   * Update status of a career vacancy (Open/Closed)
   */
  async updateStatus(id, status) {
    const query = `
      UPDATE careers
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND is_deleted = FALSE
      RETURNING *
    `;
    const result = await db.query(query, [status, id]);
    return result.rows[0] || null;
  },

  /**
   * Perform Full-Text Search on careers
   */
  async search(searchQuery) {
    const query = `
      SELECT *,
             ts_rank(to_tsvector('english', title || ' ' || department || ' ' || location || ' ' || description), websearch_to_tsquery('english', $1)) as rank
      FROM careers
      WHERE is_deleted = FALSE
        AND to_tsvector('english', title || ' ' || department || ' ' || location || ' ' || description) @@ websearch_to_tsquery('english', $1)
      ORDER BY rank DESC, title ASC
    `;
    const result = await db.query(query, [searchQuery]);
    return result.rows;
  }
};
