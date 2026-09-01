import fs from 'fs';
import { careerService } from '../services/career.service.js';
import { dashboardService } from '../services/dashboard.service.js';

export const careerController = {
  /**
   * Get all career vacancies
   */
  async getAll(req, res, next) {
    try {
      const filters = {};

      if (req.query.department) {
        filters.department = req.query.department;
      }

      console.log('Incoming GET /careers - filters:', filters);
      const vacancies = await careerService.getVacancies(filters);
      console.log('Fetched Careers:', vacancies?.length ?? 0);
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
      console.log("================================");
      console.log("BODY:", req.body);
      console.log("CONTENT-TYPE:", req.headers["content-type"]);
      console.log("================================");

      const careerData = req.body;
      console.log('Incoming Career Payload:', careerData);

      if (!careerData.title || !careerData.department || !careerData.location || !careerData.employment_type || !careerData.description) {
        return res.status(400).json({ message: 'Missing required fields: title, department, location, employment_type, description' });
      }

      const vacancy = await careerService.createVacancy(careerData);
      console.log('Inserted Career:', vacancy);

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
   * Submit a job application
   */
  async apply(req, res, next) {
    try {
      const { id } = req.params;
      const { fullName, email, phone, noticePeriod, totalExperience, message } = req.body;

      if (!req.file) {
        return res.status(400).json({ success: false, message: 'Resume upload is required.' });
      }

      if (!fullName || !email || !phone || !noticePeriod || !totalExperience || !message) {
        return res.status(400).json({ success: false, message: 'All fields are required.' });
      }

      const vacancy = await careerService.getVacancyById(id);
      if (!vacancy) {
        return res.status(404).json({ success: false, message: 'Career vacancy not found.' });
      }

      if (String(vacancy.status || '').toLowerCase() !== 'open') {
        return res.status(400).json({ success: false, message: 'This position is currently closed.' });
      }

      const application = await careerService.submitApplication({
        jobId: id,
        fullName,
        email,
        phone,
        noticePeriod,
        totalExperience,
        message,
        resumeFile: req.file
      });

      return res.status(201).json({
        success: true,
        message: 'Application submitted successfully. Our recruitment team will review your profile and contact you if shortlisted.',
        data: application,
        errors: null,
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    } catch (error) {
      next(error);
    }
  },

  async getApplications(req, res, next) {
    try {
      const applications = await careerService.getApplications();
      return res.ok(applications);
    } catch (error) {
      next(error);
    }
  },

  async downloadResume(req, res, next) {
    try {
      const result = await careerService.getApplicationResume(req.params.id);
      if (!result || !fs.existsSync(result.filePath)) {
        return res.error(404, 'Resume file is no longer available.');
      }
      res.setHeader('Content-Type', result.application.resume_mime_type || 'application/octet-stream');
      return res.download(
        result.filePath,
        result.application.resume_original_name || 'candidate-resume'
      );
    } catch (error) {
      next(error);
    }
  },

  async deleteApplication(req, res, next) {
    try {
      const deleted = await careerService.deleteApplication(req.params.id);
      if (!deleted) return res.error(404, 'Application not found.');
      return res.ok(null, 'Application deleted successfully.');
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
