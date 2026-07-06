import { projectsService } from '../services/projects.service.js';
import { dashboardService } from '../services/dashboard.service.js';
import { serializeProjectUploads } from '../utils/uploads.js';

export const projectsController = {
  async getAll(req, res, next) {
    try {
      const includeDisabled = req.query.admin === 'true' || req.query.includeDisabled === 'true';
      const projects = await projectsService.getAllProjects({ includeDisabled });
      const serializedProjects = projects.map((project) => serializeProjectUploads(req, project));
      return res.status(200).json({
        success: true,
        message: 'Projects fetched successfully.',
        data: serializedProjects,
      });
    } catch (error) {
      next(error);
    }
  },

  async getBySlug(req, res, next) {
    try {
      const { slug } = req.params;
      const project = await projectsService.getProjectBySlug(slug);

      if (!project) {
        return res.status(404).json({ success: false, message: `Project with slug '${slug}' not found.` });
      }

      return res.status(200).json({
        success: true,
        message: 'Project fetched successfully.',
        data: serializeProjectUploads(req, project),
      });
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const payload = req.body;
      if (!payload.title || !payload.slug || !payload.short_description) {
        return res.status(400).json({ success: false, message: 'Missing required fields: title, slug, short_description.' });
      }

      const project = await projectsService.createProject(payload);
      await dashboardService.logAdminActivity(
        req.admin?.sub || null,
        'CREATE_PROJECT',
        { projectId: project.id, title: project.title },
        req.ip
      );

      return res.status(201).json({ success: true, message: 'Project created successfully.', data: serializeProjectUploads(req, project) });
    } catch (error) {
      // Handle Postgres unique constraint violation for slug
      if (error && (error.code === '23505' || error.constraint === 'projects_slug_key' || String(error.message || '').includes('projects_slug_key'))) {
        return res.status(409).json({ success: false, message: 'projects_slug_key: Project slug already exists. Please choose a different title or slug.' });
      }
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const payload = req.body;
      const project = await projectsService.updateProject(id, payload);

      if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found or already deleted.' });
      }

      await dashboardService.logAdminActivity(
        req.admin?.sub || null,
        'UPDATE_PROJECT',
        { projectId: id, title: project.title },
        req.ip
      );

      return res.status(200).json({ success: true, message: 'Project updated successfully.', data: serializeProjectUploads(req, project) });
    } catch (error) {
      // Handle Postgres unique constraint violation for slug on update
      if (error && (error.code === '23505' || error.constraint === 'projects_slug_key' || String(error.message || '').includes('projects_slug_key'))) {
        return res.status(409).json({ success: false, message: 'projects_slug_key: Project slug already exists. Please choose a different title or slug.' });
      }
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const deleted = await projectsService.deleteProject(id);

      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Project not found or already deleted.' });
      }

      await dashboardService.logAdminActivity(req.admin?.sub || null, 'DELETE_PROJECT', { projectId: id }, req.ip);
      return res.status(200).json({ success: true, message: 'Project deleted successfully.' });
    } catch (error) {
      next(error);
    }
  },

  async enable(req, res, next) {
    try {
      const { id } = req.params;
      const project = await projectsService.enableProject(id);
      if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found.' });
      }
      return res.status(200).json({ success: true, message: 'Project enabled successfully.', data: serializeProjectUploads(req, project) });
    } catch (error) {
      next(error);
    }
  },

  async disable(req, res, next) {
    try {
      const { id } = req.params;
      const project = await projectsService.disableProject(id);
      if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found.' });
      }
      return res.status(200).json({ success: true, message: 'Project disabled successfully.', data: serializeProjectUploads(req, project) });
    } catch (error) {
      next(error);
    }
  },

  async reorder(req, res, next) {
    try {
      const { id } = req.params;
      const { displayOrder } = req.body;
      const project = await projectsService.reorderProject(id, displayOrder);
      if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found.' });
      }
      return res.status(200).json({ success: true, message: 'Project order updated successfully.', data: serializeProjectUploads(req, project) });
    } catch (error) {
      next(error);
    }
  },
};
