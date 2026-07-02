import { projectsRepository } from '../repositories/projects.repository.js';
import logger from '../config/logger.js';

export const projectsService = {
  async getAllProjects(options = {}) {
    return projectsRepository.findAll(options);
  },

  async getProjectBySlug(slug) {
    return projectsRepository.findBySlug(slug);
  },

  async createProject(payload) {
    logger.info(`Creating project: ${payload.title}`);
    return projectsRepository.create(payload);
  },

  async updateProject(id, payload) {
    logger.info(`Updating project ID: ${id}`);
    return projectsRepository.update(id, payload);
  },

  async deleteProject(id) {
    logger.info(`Soft deleting project ID: ${id}`);
    return projectsRepository.delete(id);
  },

  async enableProject(id) {
    return projectsRepository.updateStatus(id, true);
  },

  async disableProject(id) {
    return projectsRepository.updateStatus(id, false);
  },

  async reorderProject(id, displayOrder) {
    return projectsRepository.updateDisplayOrder(id, displayOrder);
  },
};
