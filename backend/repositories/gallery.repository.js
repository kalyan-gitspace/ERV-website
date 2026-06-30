import db from '../config/db.js';

/**
 * Gallery Repository - Encapsulates all SQL queries for gallery_categories and gallery tables.
 */
export const galleryRepository = {
  // =========================================================================
  // CATEGORY OPERATIONS
  // =========================================================================

  async findAllCategories() {
    const query = 'SELECT * FROM gallery_categories ORDER BY name ASC';
    const result = await db.query(query);
    return result.rows;
  },

  async findCategoryById(id) {
    const query = 'SELECT * FROM gallery_categories WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  },

  async findCategoryBySlug(slug) {
    const query = 'SELECT * FROM gallery_categories WHERE slug = $1';
    const result = await db.query(query, [slug]);
    return result.rows[0] || null;
  },

  async createCategory(name, slug) {
    const query = `
      INSERT INTO gallery_categories (name, slug)
      VALUES ($1, $2)
      RETURNING *
    `;
    const result = await db.query(query, [name, slug]);
    return result.rows[0];
  },

  async updateCategory(id, name, slug) {
    const query = `
      UPDATE gallery_categories
      SET name = $1, slug = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `;
    const result = await db.query(query, [name, slug, id]);
    return result.rows[0] || null;
  },

  async deleteCategory(id) {
    const query = 'DELETE FROM gallery_categories WHERE id = $1 RETURNING id';
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  },

  // =========================================================================
  // GALLERY ITEM OPERATIONS
  // =========================================================================

  /**
   * Find gallery items with optional filtering, pagination
   */
  async findAllItems(options = {}) {
    const { categorySlug, tag, limit = 12, offset = 0 } = options;
    const params = [];
    let paramCount = 1;

    let query = `
      SELECT g.*, 
             c.name as category_name, 
             c.slug as category_slug, 
             m.url as image_url,
             m.filename
      FROM gallery g
      JOIN gallery_categories c ON g.category_id = c.id
      JOIN media_library m ON g.image_media_id = m.id
      WHERE g.is_deleted = FALSE
    `;

    if (categorySlug) {
      query += ` AND c.slug = $${paramCount}`;
      params.push(categorySlug);
      paramCount++;
    }

    if (tag) {
      query += ` AND $${paramCount} = ANY(g.tags)`;
      params.push(tag);
      paramCount++;
    }

    query += ` ORDER BY g.display_order ASC, g.created_at DESC`;

    // Pagination
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);
    return result.rows;
  },

  /**
   * Count total items matching filters (for pagination calculations)
   */
  async countItems(options = {}) {
    const { categorySlug, tag } = options;
    const params = [];
    let paramCount = 1;

    let query = `
      SELECT COUNT(g.id) as total
      FROM gallery g
      JOIN gallery_categories c ON g.category_id = c.id
      WHERE g.is_deleted = FALSE
    `;

    if (categorySlug) {
      query += ` AND c.slug = $${paramCount}`;
      params.push(categorySlug);
      paramCount++;
    }

    if (tag) {
      query += ` AND $${paramCount} = ANY(g.tags)`;
      params.push(tag);
      paramCount++;
    }

    const result = await db.query(query, params);
    return parseInt(result.rows[0].total, 10);
  },

  async findItemById(id) {
    const query = `
      SELECT g.*, 
             c.name as category_name, 
             c.slug as category_slug, 
             m.url as image_url,
             m.filename
      FROM gallery g
      JOIN gallery_categories c ON g.category_id = c.id
      JOIN media_library m ON g.image_media_id = m.id
      WHERE g.id = $1 AND g.is_deleted = FALSE
    `;
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  },

  async createItem(itemData) {
    const { category_id, image_media_id, title, description, alt_text, tags, display_order } = itemData;
    const query = `
      INSERT INTO gallery (category_id, image_media_id, title, description, alt_text, tags, display_order)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const params = [category_id, image_media_id, title, description, alt_text, tags || [], display_order || 0];
    const result = await db.query(query, params);
    return result.rows[0];
  },

  async updateItem(id, itemData) {
    const { category_id, image_media_id, title, description, alt_text, tags, display_order } = itemData;
    const query = `
      UPDATE gallery SET
        category_id = $1,
        image_media_id = $2,
        title = $3,
        description = $4,
        alt_text = $5,
        tags = $6,
        display_order = $7,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $8 AND is_deleted = FALSE
      RETURNING *
    `;
    const params = [category_id, image_media_id, title, description, alt_text, tags || [], display_order || 0, id];
    const result = await db.query(query, params);
    return result.rows[0] || null;
  },

  async deleteItem(id) {
    const query = `
      UPDATE gallery
      SET is_deleted = TRUE, deleted_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND is_deleted = FALSE
      RETURNING id
    `;
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  },

  /**
   * Reorder gallery items
   */
  async updateDisplayOrder(id, displayOrder) {
    const query = `
      UPDATE gallery
      SET display_order = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND is_deleted = FALSE
      RETURNING id
    `;
    const result = await db.query(query, [displayOrder, id]);
    return result.rows[0] || null;
  },

  /**
   * Search gallery using Full-Text Search
   */
  async search(searchQuery) {
    const query = `
      SELECT g.*, 
             c.name as category_name, 
             c.slug as category_slug, 
             m.url as image_url,
             ts_rank(to_tsvector('english', g.title || ' ' || coalesce(g.description, '')), websearch_to_tsquery('english', $1)) as rank
      FROM gallery g
      JOIN gallery_categories c ON g.category_id = c.id
      JOIN media_library m ON g.image_media_id = m.id
      WHERE g.is_deleted = FALSE
        AND (
          to_tsvector('english', g.title || ' ' || coalesce(g.description, '')) @@ websearch_to_tsquery('english', $1)
          OR $1 = ANY(g.tags)
        )
      ORDER BY rank DESC, g.display_order ASC
    `;
    const result = await db.query(query, [searchQuery]);
    return result.rows;
  }
};
