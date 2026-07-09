import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { careerRepository } from '../repositories/career.repository.js';
import logger from '../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsRoot = path.join(__dirname, '..', 'uploads', 'applications');

const ensureDirectory = (dirPath) => {
  fs.mkdirSync(dirPath, { recursive: true });
};

const buildFileName = (originalName) => {
  const parsed = path.parse(originalName || 'resume');
  const ext = parsed.ext ? parsed.ext.toLowerCase() : '.bin';
  const base = (parsed.name || 'resume').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `${base || 'resume'}-${uniqueSuffix}${ext}`;
};

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
   * Submit a job application and save the resume file
   */
  async submitApplication(applicationData) {
    logger.info(`Submitting application for career ID: ${applicationData.jobId}`);
    ensureDirectory(uploadsRoot);

    const fileName = buildFileName(applicationData.resumeFile?.originalname || 'resume');
    const finalPath = path.join(uploadsRoot, fileName);

    try {
      fs.writeFileSync(finalPath, applicationData.resumeFile.buffer);
      const relativePath = path.relative(path.join(__dirname, '..'), finalPath).replace(/\\/g, '/');
      return await careerRepository.createApplication({
        ...applicationData,
        resumePath: relativePath
      });
    } catch (error) {
      logger.error(`Failed to save resume for application: ${error.message}`);
      throw error;
    }
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
