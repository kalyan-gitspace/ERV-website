import { contactRepository } from '../repositories/contact.repository.js';
import { notificationRepository } from '../repositories/notification.repository.js';
import logger from '../config/logger.js';

export const contactService = {
  /**
   * Submit a new contact form inquiry and trigger an admin notification
   */
  async submitContactForm(contactData) {
    logger.info(`Processing new contact inquiry from: ${contactData.name} (${contactData.email})`);
    const message = await contactRepository.create(contactData);

    // Create a dashboard notification for administrators
    try {
      await notificationRepository.create({
        title: 'New Contact Inquiry',
        message: `You received a new message from ${contactData.name} (${contactData.email}).`,
        type: 'contact_message'
      });
      logger.info('Generated system notification for new contact inquiry.');
    } catch (notifError) {
      // Log notification failure but do not crash the contact form submission
      logger.error('Failed to generate contact notification:', notifError);
    }

    return message;
  },

  /**
   * Fetch paginated contact messages
   */
  async getMessages(options = {}) {
    const page = parseInt(options.page, 10) || 1;
    const limit = parseInt(options.limit, 10) || 20;
    const offset = (page - 1) * limit;

    const queryOptions = {
      is_read: options.is_read,
      limit,
      offset
    };

    const items = await contactRepository.findAll(queryOptions);
    const totalItems = await contactRepository.count(queryOptions);

    return {
      items,
      pagination: {
        totalItems,
        currentPage: page,
        totalPages: Math.ceil(totalItems / limit),
        limit
      }
    };
  },

  /**
   * Get a contact message by ID
   */
  async getMessageById(id) {
    return await contactRepository.findById(id);
  },

  /**
   * Mark a contact message as read
   */
  async markMessageAsRead(id) {
    logger.info(`Marking contact message ID: ${id} as read`);
    return await contactRepository.markAsRead(id);
  },

  /**
   * Delete a contact message
   */
  async deleteMessage(id) {
    logger.info(`Deleting contact message ID: ${id}`);
    return await contactRepository.delete(id);
  }
};
