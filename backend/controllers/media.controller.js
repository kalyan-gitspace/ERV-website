import { mediaService } from '../services/media.service.js';
import { dashboardService } from '../services/dashboard.service.js';
import { serializeMediaUpload } from '../utils/uploads.js';

export const mediaController = {
  /**
   * Upload a single file to the local uploads directory.
   */
  async upload(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file provided. Please upload a file.' });
      }

      const adminId = req.admin?.sub || 'system';
      const media = await mediaService.uploadFile(req.file, 'projects', adminId);
      const serializedMedia = serializeMediaUpload(req, media);

      // Log admin action
      await dashboardService.logAdminActivity(
        adminId,
        'UPLOAD_MEDIA',
        { mediaId: media.id, filename: media.filename, fileType: media.file_type },
        req.ip
      );

      return res.status(201).json({
        success: true,
        message: 'File uploaded successfully.',
        data: serializedMedia,
        errors: null,
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to upload images.',
        data: null,
        errors: null,
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
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
      return res.status(200).json({
        ...result,
        items: result.items.map((item) => serializeMediaUpload(req, item)),
      });
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
        req.admin?.sub || 'system',
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
