import { settingsRepository } from '../repositories/settings.repository.js';
import logger from '../config/logger.js';

export const settingsService = {
  /**
   * Fetch all settings as a single key-value object
   */
  async getSettings() {
    return await settingsRepository.getAllSettings();
  },

  /**
   * Update or create a single system setting
   */
  async updateSetting(key, value) {
    logger.info(`Updating system setting: ${key}`);
    return await settingsRepository.setSetting(key, value);
  },

  /**
   * Fetch all company information blocks (About sections)
   */
  async getCompanyInfo() {
    return await settingsRepository.getAllCompanyInfo();
  },

  /**
   * Update or create a single company information block
   */
  async updateCompanyInfo(key, content) {
    logger.info(`Updating company info block: ${key}`);
    return await settingsRepository.setCompanyInfo(key, content);
  }
};
