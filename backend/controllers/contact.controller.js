import { contactService } from '../services/contact.service.js';
import { dashboardService } from '../services/dashboard.service.js';

export const contactController = {
  /**
   * Submit contact form (Public)
   */
  async submit(req, res, next) {
    try {
      const { name, email, phone, message } = req.body;

      if (!name || !email || !message) {
        return res.status(400).json({ message: 'Missing required fields: name, email, message' });
      }

      const inquiry = await contactService.submitContactForm({ name, email, phone, message });
      return res.status(201).json({
        message: 'Inquiry submitted successfully.',
        inquiry
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all contact messages (Admin)
   */
  async getAll(req, res, next) {
    try {
      const { is_read, page, limit } = req.query;
      const result = await contactService.getMessages({
        is_read: is_read === undefined ? undefined : is_read === 'true',
        page,
        limit
      });
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get contact message by ID (Admin)
   */
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const message = await contactService.getMessageById(id);
      
      if (!message) {
        return res.status(404).json({ message: 'Message not found.' });
      }

      return res.status(200).json(message);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Mark message as read (Admin)
   */
  async markRead(req, res, next) {
    try {
      const { id } = req.params;
      const message = await contactService.markMessageAsRead(id);
      
      if (!message) {
        return res.status(404).json({ message: 'Message not found.' });
      }

      return res.status(200).json({
        message: 'Message marked as read.',
        message
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete contact message (Admin)
   */
  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const deleted = await contactService.deleteMessage(id);
      
      if (!deleted) {
        return res.status(404).json({ message: 'Message not found.' });
      }

      // Log admin action
      await dashboardService.logAdminActivity(
        req.admin.sub,
        'DELETE_CONTACT_MESSAGE',
        { messageId: id },
        req.ip
      );

      return res.status(200).json({ message: 'Message deleted successfully.' });
    } catch (error) {
      next(error);
    }
  }
};
