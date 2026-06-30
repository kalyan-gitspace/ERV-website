import db from '../config/db.js';

/**
 * Product Repository - Encapsulates all SQL queries for the products table.
 */
export const productRepository = {
  /**
   * Find all products (excluding soft-deleted ones)
   */
  async findAll() {
    const query = `
      SELECT p.*, 
             t.url as thumbnail_url, 
             h.url as hero_url, 
             b.url as brochure_url
      FROM products p
      LEFT JOIN media_library t ON p.thumbnail_media_id = t.id
      LEFT JOIN media_library h ON p.hero_media_id = h.id
      LEFT JOIN media_library b ON p.brochure_media_id = b.id
      WHERE p.is_deleted = FALSE
      ORDER BY p.created_at DESC
    `;
    const result = await db.query(query);
    return result.rows;
  },

  /**
   * Find a product by ID
   */
  async findById(id) {
    const query = `
      SELECT p.*, 
             t.url as thumbnail_url, 
             h.url as hero_url, 
             b.url as brochure_url
      FROM products p
      LEFT JOIN media_library t ON p.thumbnail_media_id = t.id
      LEFT JOIN media_library h ON p.hero_media_id = h.id
      LEFT JOIN media_library b ON p.brochure_media_id = b.id
      WHERE p.id = $1 AND p.is_deleted = FALSE
    `;
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  },

  /**
   * Find a product by Slug (useful for public URL /products/:slug)
   */
  async findBySlug(slug) {
    const query = `
      SELECT p.*, 
             t.url as thumbnail_url, 
             h.url as hero_url, 
             b.url as brochure_url
      FROM products p
      LEFT JOIN media_library t ON p.thumbnail_media_id = t.id
      LEFT JOIN media_library h ON p.hero_media_id = h.id
      LEFT JOIN media_library b ON p.brochure_media_id = b.id
      WHERE p.slug = $1 AND p.is_deleted = FALSE
    `;
    const result = await db.query(query, [slug]);
    return result.rows[0] || null;
  },

  /**
   * Create a new product record
   */
  async create(productData) {
    const {
      name, slug, short_description, full_description, specifications,
      applications, benefits, features, thumbnail_media_id, hero_media_id,
      brochure_media_id, meta_title, meta_description, meta_keywords
    } = productData;

    const query = `
      INSERT INTO products (
        name, slug, short_description, full_description, specifications,
        applications, benefits, features, thumbnail_media_id, hero_media_id,
        brochure_media_id, meta_title, meta_description, meta_keywords
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;

    const params = [
      name, slug, short_description, full_description, JSON.stringify(specifications),
      applications, benefits, features, thumbnail_media_id, hero_media_id,
      brochure_media_id, meta_title, meta_description, meta_keywords
    ];

    const result = await db.query(query, params);
    return result.rows[0];
  },

  /**
   * Update an existing product
   */
  async update(id, productData) {
    const {
      name, slug, short_description, full_description, specifications,
      applications, benefits, features, thumbnail_media_id, hero_media_id,
      brochure_media_id, meta_title, meta_description, meta_keywords
    } = productData;

    const query = `
      UPDATE products SET
        name = $1,
        slug = $2,
        short_description = $3,
        full_description = $4,
        specifications = $5,
        applications = $6,
        benefits = $7,
        features = $8,
        thumbnail_media_id = $9,
        hero_media_id = $10,
        brochure_media_id = $11,
        meta_title = $12,
        meta_description = $13,
        meta_keywords = $14,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $15 AND is_deleted = FALSE
      RETURNING *
    `;

    const params = [
      name, slug, short_description, full_description, JSON.stringify(specifications),
      applications, benefits, features, thumbnail_media_id, hero_media_id,
      brochure_media_id, meta_title, meta_description, meta_keywords,
      id
    ];

    const result = await db.query(query, params);
    return result.rows[0] || null;
  },

  /**
   * Soft-delete a product
   */
  async delete(id) {
    const query = `
      UPDATE products
      SET is_deleted = TRUE, deleted_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND is_deleted = FALSE
      RETURNING id
    `;
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  },

  /**
   * Get product additional gallery images
   */
  async getProductImages(productId) {
    const query = `
      SELECT pi.id, pi.display_order, m.url, m.id as media_id, m.filename
      FROM product_images pi
      JOIN media_library m ON pi.image_media_id = m.id
      WHERE pi.product_id = $1
      ORDER BY pi.display_order ASC
    `;
    const result = await db.query(query, [productId]);
    return result.rows;
  },

  /**
   * Clear all images associated with a product (typically done before re-adding during updates)
   */
  async clearProductImages(productId) {
    const query = `DELETE FROM product_images WHERE product_id = $1`;
    await db.query(query, [productId]);
  },

  /**
   * Add a single product image link
   */
  async addProductImage(productId, mediaId, displayOrder = 0) {
    const query = `
      INSERT INTO product_images (product_id, image_media_id, display_order)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const result = await db.query(query, [productId, mediaId, displayOrder]);
    return result.rows[0];
  },

  /**
   * Perform Full-Text Search on products (returns ranked results)
   */
  async search(searchQuery) {
    // Format search query for plainto_tsquery or websearch_to_tsquery
    const query = `
      SELECT p.*, 
             t.url as thumbnail_url, 
             h.url as hero_url, 
             b.url as brochure_url,
             ts_rank(to_tsvector('english', p.name || ' ' || p.short_description || ' ' || p.full_description), websearch_to_tsquery('english', $1)) as rank
      FROM products p
      LEFT JOIN media_library t ON p.thumbnail_media_id = t.id
      LEFT JOIN media_library h ON p.hero_media_id = h.id
      LEFT JOIN media_library b ON p.brochure_media_id = b.id
      WHERE p.is_deleted = FALSE 
        AND to_tsvector('english', p.name || ' ' || p.short_description || ' ' || p.full_description) @@ websearch_to_tsquery('english', $1)
      ORDER BY rank DESC, p.name ASC
    `;
    const result = await db.query(query, [searchQuery]);
    return result.rows;
  }
};
