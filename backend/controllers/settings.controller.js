import { settingsService } from '../services/settings.service.js';
import { dashboardService } from '../services/dashboard.service.js';

export const settingsController = {
  /**
   * Get all system settings (Public & Admin)
   */
  async getSettings(req, res, next) {
    try {
      const settings = await settingsService.getSettings();
      return res.status(200).json(settings);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update a specific system setting (Admin)
   */
  async updateSetting(req, res, next) {
    try {
      const { key } = req.params;
      const { value } = req.body;

      if (value === undefined) {
        return res.status(400).json({ message: 'Setting value is required.' });
      }

      const updated = await settingsService.updateSetting(key, value);
      
      // Log admin action
      await dashboardService.logAdminActivity(
        req.admin.sub,
        'UPDATE_SETTING',
        { key },
        req.ip
      );

      return res.status(200).json({
        message: `Setting '${key}' updated successfully.`,
        setting: updated
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all company information blocks (Public & Admin)
   */
  async getCompanyInfo(req, res, next) {
    try {
      const info = await settingsService.getCompanyInfo();
      return res.status(200).json(info);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update a specific company information block (Admin)
   */
  async updateCompanyInfo(req, res, next) {
    try {
      const { key } = req.params;
      const { content } = req.body;

      if (!content) {
        return res.status(400).json({ message: 'Company information content is required.' });
      }

      const updated = await settingsService.updateCompanyInfo(key, content);

      // Log admin action
      await dashboardService.logAdminActivity(
        req.admin.sub,
        'UPDATE_COMPANY_INFO',
        { key },
        req.ip
      );

      return res.status(200).json({
        message: `Company information block '${key}' updated successfully.`,
        companyInfo: updated
      });
    } catch (error) {
      next(error);
    }
  }
};
