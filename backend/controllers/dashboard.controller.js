import { dashboardService } from '../services/dashboard.service.js';

export const dashboardController = {
  /**
   * Get main statistics for the admin dashboard (Admin)
   */
  async getStats(req, res, next) {
    try {
      const stats = await dashboardService.getDashboardStats();
      return res.status(200).json(stats);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get recent administrative activity logs (Admin)
   */
  async getActivities(req, res, next) {
    try {
      const limit = parseInt(req.query.limit, 10) || 15;
      const activities = await dashboardService.getRecentActivities(limit);
      return res.status(200).json(activities);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get traffic and page visitor analytics (Admin)
   */
  async getAnalytics(req, res, next) {
    try {
      const days = parseInt(req.query.days, 10) || 30;
      const analytics = await dashboardService.getAnalytics(days);
      return res.status(200).json(analytics);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Log a page view from the frontend (Public)
   */
  async logPageView(req, res, next) {
    try {
      const { pagePath } = req.body;

      if (!pagePath) {
        return res.status(400).json({ message: 'pagePath is required.' });
      }

      // Capture IP and User Agent
      const ipAddress = req.ip;
      const userAgent = req.headers['user-agent'];

      await dashboardService.recordPageView(pagePath, ipAddress, userAgent);
      return res.status(204).send(); // No content response
    } catch (error) {
      next(error);
    }
  }
};
