import { careerService } from '../services/career.service.js';
import { dashboardService } from '../services/dashboard.service.js';

export const careerController = {
  /**
   * Get all career vacancies
   */
  async getAll(req, res, next) {
    try {
      // By default, public endpoint only returns 'Open' positions
      // Admin can request all by passing showAll=true
      const showAll = req.query.showAll === 'true';
      const filters = {};
      
      if (!showAll) {
        filters.status = 'Open';
      }
      
      if (req.query.department) {
        filters.department = req.query.department;
      }

      const vacancies = await careerService.getVacancies(filters);
      return res.status(200).json(vacancies);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get a vacancy by ID
   */
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const vacancy = await careerService.getVacancyById(id);
      
      if (!vacancy) {
        return res.status(404).json({ message: 'Career vacancy not found.' });
      }
      
      return res.status(200).json(vacancy);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Create a new vacancy (Admin)
   */
  async create(req, res, next) {
    try {
      const careerData = req.body;

      if (!careerData.title || !careerData.department || !careerData.location || !careerData.employment_type || !careerData.description) {
        return res.status(400).json({ message: 'Missing required fields: title, department, location, employment_type, description' });
      }

      const vacancy = await careerService.createVacancy(careerData);

      await dashboardService.logAdminActivity(
        req.admin.sub,
        'CREATE_CAREER',
        { careerId: vacancy.id, title: vacancy.title },
        req.ip
      );

      return res.status(201).json({
        message: 'Career vacancy created successfully.',
        vacancy
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update a vacancy (Admin)
   */
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const careerData = req.body;

      const vacancy = await careerService.updateVacancy(id, careerData);
      if (!vacancy) {
        return res.status(404).json({ message: 'Career vacancy not found or has been deleted.' });
      }

      await dashboardService.logAdminActivity(
        req.admin.sub,
        'UPDATE_CAREER',
        { careerId: id, title: vacancy.title },
        req.ip
      );

      return res.status(200).json({
        message: 'Career vacancy updated successfully.',
        vacancy
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete a vacancy (Admin - Soft Delete)
   */
  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const deleted = await careerService.deleteVacancy(id);
      if (!deleted) {
        return res.status(404).json({ message: 'Career vacancy not found or already deleted.' });
      }

      await dashboardService.logAdminActivity(
        req.admin.sub,
        'DELETE_CAREER',
        { careerId: id },
        req.ip
      );

      return res.status(200).json({ message: 'Career vacancy deleted successfully (soft delete).' });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Close a vacancy (Admin)
   */
  async close(req, res, next) {
    try {
      const { id } = req.params;
      const vacancy = await careerService.closeVacancy(id);
      if (!vacancy) {
        return res.status(404).json({ message: 'Career vacancy not found or already deleted.' });
      }

      await dashboardService.logAdminActivity(
        req.admin.sub,
        'CLOSE_CAREER',
        { careerId: id, title: vacancy.title },
        req.ip
      );

      return res.status(200).json({
        message: 'Vacancy closed successfully.',
        vacancy
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Reopen a vacancy (Admin)
   */
  async reopen(req, res, next) {
    try {
      const { id } = req.params;
      const vacancy = await careerService.reopenVacancy(id);
      if (!vacancy) {
        return res.status(404).json({ message: 'Career vacancy not found or already deleted.' });
      }

      await dashboardService.logAdminActivity(
        req.admin.sub,
        'REOPEN_CAREER',
        { careerId: id, title: vacancy.title },
        req.ip
      );

      return res.status(200).json({
        message: 'Vacancy reopened successfully.',
        vacancy
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Search vacancies
   */
  async search(req, res, next) {
    try {
      const { q } = req.query;
      const results = await careerService.searchCareers(q);
      return res.status(200).json(results);
    } catch (error) {
      next(error);
    }
  }
};
