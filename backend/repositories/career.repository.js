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
   * Store a job application submission
   */
  async createApplication(applicationData) {
    const {
      jobId,
      fullName,
      email,
      phone,
      noticePeriod,
      totalExperience,
      message,
      resumePath,
      resumeOriginalName,
      resumeMimeType,
      resumeSize
    } = applicationData;

    const query = `
      INSERT INTO applications (
        job_id,
        full_name,
        email,
        phone,
        notice_period,
        total_experience,
        message,
        resume_path,
        resume_original_name,
        resume_mime_type,
        resume_size
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id, job_id, full_name, email, phone, notice_period, total_experience, message,
                resume_original_name, resume_mime_type, resume_size, created_at
    `;

    const result = await db.query(query, [
      jobId,
      fullName,
      email,
      phone,
      noticePeriod,
      totalExperience,
      message,
      resumePath,
      resumeOriginalName,
      resumeMimeType,
      resumeSize
    ]);

    return result.rows[0];
  },

  async findApplications() {
    const result = await db.query(`
      SELECT applications.id, applications.job_id, applications.full_name,
             applications.email, applications.phone, applications.notice_period,
             applications.total_experience, applications.message,
             applications.resume_original_name, applications.resume_mime_type,
             applications.resume_size, applications.created_at, careers.title AS job_title
      FROM applications
      INNER JOIN careers ON careers.id = applications.job_id
      ORDER BY applications.created_at DESC
    `);
    return result.rows;
  },

  async findApplicationById(id) {
    const result = await db.query(`
      SELECT applications.*, careers.title AS job_title
      FROM applications
      INNER JOIN careers ON careers.id = applications.job_id
      WHERE applications.id = $1
    `, [id]);
    return result.rows[0] || null;
  },

  async deleteApplication(id) {
    const result = await db.query('DELETE FROM applications WHERE id = $1 RETURNING id, resume_path', [id]);
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
