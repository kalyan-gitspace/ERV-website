import db from '../config/db.js';

export const projectsRepository = {
  async findAll(options = {}) {
    const includeDisabled = options.includeDisabled === true;
    const query = `
      SELECT *
      FROM projects
      WHERE is_deleted = FALSE
      ${includeDisabled ? '' : "AND status = 'enabled'"}
      ORDER BY display_order ASC, created_at DESC
    `;
    const result = await db.query(query);
    return result.rows;
  },

  async findBySlug(slug) {
    const query = `
      SELECT *
      FROM projects
      WHERE slug = $1 AND is_deleted = FALSE AND status = 'enabled'
    `;
    const result = await db.query(query, [slug]);
    return result.rows[0] || null;
  },

  async create(payload) {
    const {
      title,
      slug,
      short_description,
      rich_description,
      main_image,
      gallery_images,
      location,
      completion_date,
      category,
      status = 'enabled',
      display_order = 0,
      seo_title,
      seo_description,
    } = payload;

    const query = `
      INSERT INTO projects (
        title, slug, short_description, rich_description, main_image, gallery_images,
        location, completion_date, category, status, display_order, seo_title, seo_description
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;
    const result = await db.query(query, [
      title,
      slug,
      short_description,
      rich_description || '',
      main_image || null,
      JSON.stringify(gallery_images || []),
      location || null,
      completion_date || null,
      category || null,
      status,
      display_order,
      seo_title || null,
      seo_description || null,
    ]);
    return result.rows[0];
  },

  async update(id, payload) {
    const {
      title,
      slug,
      short_description,
      rich_description,
      main_image,
      gallery_images,
      location,
      completion_date,
      category,
      status,
      display_order,
      seo_title,
      seo_description,
    } = payload;

    const query = `
      UPDATE projects
      SET title = COALESCE($1, title),
          slug = COALESCE($2, slug),
          short_description = COALESCE($3, short_description),
          rich_description = COALESCE($4, rich_description),
          main_image = COALESCE($5, main_image),
          gallery_images = COALESCE($6, gallery_images),
          location = COALESCE($7, location),
          completion_date = COALESCE($8, completion_date),
          category = COALESCE($9, category),
          status = COALESCE($10, status),
          display_order = COALESCE($11, display_order),
          seo_title = COALESCE($12, seo_title),
          seo_description = COALESCE($13, seo_description),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $14 AND is_deleted = FALSE
      RETURNING *
    `;
    const result = await db.query(query, [
      title,
      slug,
      short_description,
      rich_description,
      main_image,
      gallery_images ? JSON.stringify(gallery_images) : null,
      location,
      completion_date,
      category,
      status,
      display_order,
      seo_title,
      seo_description,
      id,
    ]);
    return result.rows[0] || null;
  },

  async delete(id) {
    const query = `
      UPDATE projects
      SET is_deleted = TRUE, deleted_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND is_deleted = FALSE
      RETURNING id
    `;
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  },

  async updateStatus(id, enabled) {
    const query = `
      UPDATE projects
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND is_deleted = FALSE
      RETURNING *
    `;
    const result = await db.query(query, [enabled ? 'enabled' : 'disabled', id]);
    return result.rows[0] || null;
  },

  async updateDisplayOrder(id, displayOrder) {
    const query = `
      UPDATE projects
      SET display_order = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND is_deleted = FALSE
      RETURNING *
    `;
    const result = await db.query(query, [displayOrder, id]);
    return result.rows[0] || null;
  },
};
