import { dashboardRepository } from '../repositories/dashboard.repository.js';
import logger from '../config/logger.js';

export const dashboardService = {
  /**
   * Get main statistics for the admin dashboard
   */
  async getDashboardStats() {
    return await dashboardRepository.getStats();
  },

  /**
   * Log an administrative action
   */
  async logAdminActivity(adminId, action, details = {}, ipAddress = null) {
    try {
      return await dashboardRepository.logActivity(adminId, action, details, ipAddress);
    } catch (error) {
      // Log error but don't disrupt the request flow
      logger.error(`Failed to write activity log for admin ${adminId}:`, error);
      return null;
    }
  },

  /**
   * Get recent administrative activity logs
   */
  async getRecentActivities(limit = 15) {
    return await dashboardRepository.getRecentActivities(limit);
  },

  /**
   * Record a public page view
   */
  async recordPageView(pagePath, ipAddress = null, userAgent = null) {
    try {
      // Don't track admin pages to keep public metrics clean
      if (pagePath.startsWith('/admin') || pagePath.startsWith('/api')) {
        return null;
      }
      return await dashboardRepository.logPageView(pagePath, ipAddress, userAgent);
    } catch (error) {
      logger.error(`Failed to record page view for path ${pagePath}:`, error);
      return null;
    }
  },

  /**
   * Get traffic and visitor analytics
   */
  async getAnalytics(limitDays = 30) {
    const traffic = await dashboardRepository.getPageViewStats(limitDays);
    const topPages = await dashboardRepository.getTopPages(10);
    return {
      traffic,
      topPages
    };
  }
};
