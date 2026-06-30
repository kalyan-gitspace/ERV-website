import { careerRepository } from '../repositories/career.repository.js';
import logger from '../config/logger.js';

export const careerService = {
  /**
   * Fetch vacancies
   * @param {Object} filters - e.g. status ('Open'/'Closed') or department
   */
  async getVacancies(filters = {}) {
    return await careerRepository.findAll(filters);
  },

  /**
   * Get vacancy by ID
   */
  async getVacancyById(id) {
    return await careerRepository.findById(id);
  },

  /**
   * Create a new vacancy
   */
  async createVacancy(careerData) {
    logger.info(`Creating career vacancy: ${careerData.title}`);
    return await careerRepository.create(careerData);
  },

  /**
   * Update an existing vacancy
   */
  async updateVacancy(id, careerData) {
    logger.info(`Updating career vacancy ID: ${id}`);
    return await careerRepository.update(id, careerData);
  },

  /**
   * Soft delete a vacancy
   */
  async deleteVacancy(id) {
    logger.info(`Soft deleting career vacancy ID: ${id}`);
    return await careerRepository.delete(id);
  },

  /**
   * Close a vacancy
   */
  async closeVacancy(id) {
    logger.info(`Closing vacancy ID: ${id}`);
    return await careerRepository.updateStatus(id, 'Closed');
  },

  /**
   * Reopen a vacancy
   */
  async reopenVacancy(id) {
    logger.info(`Reopening vacancy ID: ${id}`);
    return await careerRepository.updateStatus(id, 'Open');
  },

  /**
   * Search vacancies
   */
  async searchCareers(query) {
    if (!query || query.trim() === '') {
      return await this.getVacancies();
    }
    return await careerRepository.search(query);
  }
};
