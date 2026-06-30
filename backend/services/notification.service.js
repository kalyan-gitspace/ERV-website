import { notificationRepository } from '../repositories/notification.repository.js';
import logger from '../config/logger.js';

export const notificationService = {
  /**
   * Fetch recent system notifications
   * @param {Object} options - e.g. is_read, limit
   */
  async getNotifications(options = {}) {
    return await notificationRepository.findAll(options);
  },

  /**
   * Mark a single notification as read
   */
  async markAsRead(id) {
    logger.info(`Marking notification ID ${id} as read.`);
    return await notificationRepository.markAsRead(id);
  },

  /**
   * Mark all unread notifications as read
   */
  async markAllAsRead() {
    logger.info('Marking all notifications as read.');
    return await notificationRepository.markAllAsRead();
  }
};
