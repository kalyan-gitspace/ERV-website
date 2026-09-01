import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { careerRepository } from '../repositories/career.repository.js';
import logger from '../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsRoot = path.join(__dirname, '..', 'uploads', 'applications');
const allowedResumeTypes = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]);

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

const validateResume = (file) => {
  if (!file || !allowedResumeTypes.has(file.mimetype)) {
    throw new Error('Unsupported resume file type. Please upload a PDF, DOC, or DOCX file.');
  }

  const header = file.buffer.subarray(0, 8).toString('hex');
  const isPdf = file.mimetype === 'application/pdf' && header.startsWith('255044462d');
  const isDoc = file.mimetype === 'application/msword' && header.startsWith('d0cf11e0a1b11ae1');
  const isDocx = file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' && header.startsWith('504b0304');

  if (!isPdf && !isDoc && !isDocx) {
    throw new Error('The uploaded resume content does not match its file type.');
  }
};

const getStoredPath = (relativePath) => {
  const resolved = path.resolve(__dirname, '..', relativePath);
  if (!resolved.startsWith(`${uploadsRoot}${path.sep}`)) {
    throw new Error('Invalid resume path.');
  }
  return resolved;
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
    validateResume(applicationData.resumeFile);
    ensureDirectory(uploadsRoot);

    const fileName = buildFileName(applicationData.resumeFile?.originalname || 'resume');
    const finalPath = path.join(uploadsRoot, fileName);

    try {
      fs.writeFileSync(finalPath, applicationData.resumeFile.buffer);
      const relativePath = path.relative(path.join(__dirname, '..'), finalPath).replace(/\\/g, '/');
      return await careerRepository.createApplication({
        ...applicationData,
        resumePath: relativePath,
        resumeOriginalName: applicationData.resumeFile.originalname,
        resumeMimeType: applicationData.resumeFile.mimetype,
        resumeSize: applicationData.resumeFile.size
      });
    } catch (error) {
      try {
        if (fs.existsSync(finalPath)) fs.unlinkSync(finalPath);
      } catch (cleanupError) {
        logger.warn(`Failed to cleanup resume after application failure: ${cleanupError.message}`);
      }
      logger.error(`Failed to save resume for application: ${error.message}`);
      throw error;
    }
  },

  async getApplications() {
    return await careerRepository.findApplications();
  },

  async getApplicationResume(id) {
    const application = await careerRepository.findApplicationById(id);
    if (!application) return null;
    return { application, filePath: getStoredPath(application.resume_path) };
  },

  async deleteApplication(id) {
    const application = await careerRepository.findApplicationById(id);
    if (!application) return null;
    const deleted = await careerRepository.deleteApplication(id);
    try {
      const filePath = getStoredPath(application.resume_path);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (error) {
      logger.warn(`Could not remove resume for application ${id}: ${error.message}`);
    }
    return deleted;
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
