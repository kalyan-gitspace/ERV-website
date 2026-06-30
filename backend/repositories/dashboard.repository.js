import db from '../config/db.js';

/**
 * Dashboard Repository - Handles analytics, audit logging, and dashboard statistics queries.
 */
export const dashboardRepository = {
  /**
   * Get aggregated counts and statistics for the Admin Dashboard
   */
  async getStats() {
    const statsQuery = `
      SELECT
        (SELECT COUNT(*) FROM products WHERE is_deleted = FALSE) as total_products,
        (SELECT COUNT(*) FROM gallery WHERE is_deleted = FALSE) as total_gallery_images,
        (SELECT COUNT(*) FROM videos WHERE is_deleted = FALSE) as total_videos,
        (SELECT COUNT(*) FROM careers WHERE status = 'Open' AND is_deleted = FALSE) as open_careers,
        (SELECT COUNT(*) FROM contact_messages WHERE is_read = FALSE) as unread_messages,
        (SELECT COUNT(*) FROM media_library WHERE is_deleted = FALSE) as total_media_assets
    `;
    const result = await db.query(statsQuery);
    
    // Parse counts to integers
    const row = result.rows[0];
    return {
      totalProducts: parseInt(row.total_products, 10),
      totalGalleryImages: parseInt(row.total_gallery_images, 10),
      totalVideos: parseInt(row.total_videos, 10),
      openCareers: parseInt(row.open_careers, 10),
      unreadMessages: parseInt(row.unread_messages, 10),
      totalMediaAssets: parseInt(row.total_media_assets, 10)
    };
  },

  // =========================================================================
  // AUDIT ACTIVITY LOGS
  // =========================================================================

  /**
   * Log an admin action
   */
  async logActivity(adminId, action, details = {}, ipAddress = null) {
    const query = `
      INSERT INTO activity_logs (admin_id, action, details, ip_address)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const result = await db.query(query, [adminId, action, JSON.stringify(details), ipAddress]);
    return result.rows[0];
  },

  /**
   * Get recent activity logs
   */
  async getRecentActivities(limit = 15) {
    const query = `
      SELECT al.*, a.full_name as admin_name, a.email as admin_email
      FROM activity_logs al
      LEFT JOIN admins a ON al.admin_id = a.id
      ORDER BY al.created_at DESC
      LIMIT $1
    `;
    const result = await db.query(query, [limit]);
    return result.rows;
  },

  // =========================================================================
  // PAGE VIEWS & ANALYTICS
  // =========================================================================

  /**
   * Record a page view
   */
  async logPageView(pagePath, ipAddress = null, userAgent = null) {
    const query = `
      INSERT INTO page_views (page_path, ip_address, user_agent)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const result = await db.query(query, [pagePath, ipAddress, userAgent]);
    return result.rows[0];
  },

  /**
   * Get aggregated page views for the past 30 days
   */
  async getPageViewStats(limitDays = 30) {
    const query = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as views,
        COUNT(DISTINCT ip_address) as unique_visitors
      FROM page_views
      WHERE created_at >= CURRENT_DATE - INTERVAL '1 day' * $1
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at) ASC
    `;
    const result = await db.query(query, [limitDays]);
    return result.rows;
  },

  /**
   * Get top visited page paths
   */
  async getTopPages(limit = 10) {
    const query = `
      SELECT page_path, COUNT(*) as views
      FROM page_views
      GROUP BY page_path
      ORDER BY views DESC
      LIMIT $1
    `;
    const result = await db.query(query, [limit]);
    return result.rows;
  }
};
