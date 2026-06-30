import { mediaService } from '../services/media.service.js';
import { dashboardService } from '../services/dashboard.service.js';

export const mediaController = {
  /**
   * Upload a single file (image, video, or PDF) to Cloudinary
   */
  async upload(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file provided. Please upload a file.' });
      }

      const adminId = req.admin.sub;
      const media = await mediaService.uploadFile(req.file, adminId);

      // Log admin action
      await dashboardService.logAdminActivity(
        adminId,
        'UPLOAD_MEDIA',
        { mediaId: media.id, filename: media.filename, fileType: media.file_type },
        req.ip
      );

      return res.status(201).json({
        message: 'File uploaded successfully.',
        media
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all media assets in the library (Admin Centralized View)
   */
  async getAll(req, res, next) {
    try {
      const { file_type, search, page, limit } = req.query;
      const result = await mediaService.getAllMedia({
        file_type,
        search,
        page,
        limit
      });
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete a media asset (Admin)
   */
  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const deleted = await mediaService.deleteMedia(id);
      
      if (!deleted) {
        return res.status(404).json({ message: 'Media asset not found or already deleted.' });
      }

      // Log admin action
      await dashboardService.logAdminActivity(
        req.admin.sub,
        'DELETE_MEDIA',
        { mediaId: id, filename: deleted.filename },
        req.ip
      );

      return res.status(200).json({ message: 'Media asset deleted successfully.' });
    } catch (error) {
      next(error);
    }
  }
};
