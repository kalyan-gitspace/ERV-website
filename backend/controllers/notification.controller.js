import { notificationService } from '../services/notification.service.js';

export const notificationController = {
  /**
   * Get recent notifications
   */
  async getAll(req, res, next) {
    try {
      const isRead = req.query.isRead === undefined ? undefined : req.query.isRead === 'true';
      const limit = parseInt(req.query.limit, 10) || 20;

      const notifications = await notificationService.getNotifications({
        is_read: isRead,
        limit
      });

      return res.status(200).json(notifications);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Mark a notification as read
   */
  async markRead(req, res, next) {
    try {
      const { id } = req.params;
      const notification = await notificationService.markAsRead(id);

      if (!notification) {
        return res.status(404).json({ message: 'Notification not found.' });
      }

      return res.status(200).json({
        message: 'Notification marked as read.',
        notification
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Mark all notifications as read
   */
  async markAllRead(req, res, next) {
    try {
      await notificationService.markAllAsRead();
      return res.status(200).json({ message: 'All notifications marked as read.' });
    } catch (error) {
      next(error);
    }
  }
};
