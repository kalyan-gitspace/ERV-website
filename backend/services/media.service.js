import path from 'path';
import cloudinary from '../config/cloudinary.js';
import { mediaRepository } from '../repositories/media.repository.js';
import logger from '../config/logger.js';

export const mediaService = {
  /**
   * Upload a file buffer directly to Cloudinary and record it in the database.
   * @param {Object} file - Express Multer file object
   * @param {string} adminId - ID of the admin who uploaded it
   */
  async uploadFile(file, adminId) {
    return new Promise((resolve, reject) => {
      let folder = 'erv/images';
      let resourceType = 'image';
      let fileType = 'image';

      if (file.mimetype.startsWith('video/')) {
        folder = 'erv/videos';
        resourceType = 'video';
        fileType = 'video';
      } else if (file.mimetype === 'application/pdf') {
        folder = 'erv/brochures';
        resourceType = 'raw';
        fileType = 'pdf';
      }

      // Generate clean public ID
      const parsedName = path.parse(file.originalname).name;
      const cleanName = parsedName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      const publicId = `${cleanName}-${Date.now()}`;

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: resourceType,
          public_id: publicId,
        },
        async (error, result) => {
          if (error) {
            logger.error(`Cloudinary upload failed: ${error.message}`);
            return reject(error);
          }

          try {
            // Write record to database
            const mediaRecord = await mediaRepository.create({
              filename: file.originalname,
              url: result.secure_url,
              public_id: result.public_id,
              file_type: fileType,
              file_size: file.size,
              uploaded_by: adminId,
            });

            logger.info(`Media uploaded successfully: ${file.originalname} -> ${result.secure_url}`);
            resolve(mediaRecord);
          } catch (dbError) {
            logger.error(`Error saving media metadata to DB: ${dbError.message}`);
            reject(dbError);
          }
        }
      );

      // End the stream and write the buffer
      uploadStream.end(file.buffer);
    });
  },

  /**
   * Fetch all media items in the centralized library
   */
  async getAllMedia(options = {}) {
    const page = parseInt(options.page, 10) || 1;
    const limit = parseInt(options.limit, 10) || 20;
    const offset = (page - 1) * limit;

    const queryOptions = {
      file_type: options.file_type,
      search: options.search,
      limit,
      offset
    };

    const items = await mediaRepository.findAll(queryOptions);
    const totalItems = await mediaRepository.count(queryOptions);

    return {
      items,
      pagination: {
        totalItems,
        currentPage: page,
        totalPages: Math.ceil(totalItems / limit),
        limit
      }
    };
  },

  /**
   * Get a single media record by ID
   */
  async getMediaById(id) {
    return await mediaRepository.findById(id);
  },

  /**
   * Delete a media asset from Cloudinary and soft-delete it in the database
   */
  async deleteMedia(id) {
    const media = await mediaRepository.findById(id);
    if (!media) return null;

    let resourceType = 'image';
    if (media.file_type === 'video') {
      resourceType = 'video';
    } else if (media.file_type === 'pdf') {
      resourceType = 'raw';
    }

    try {
      // Delete from CDN
      await cloudinary.uploader.destroy(media.public_id, { resource_type: resourceType });
      logger.info(`Deleted asset from Cloudinary: ${media.public_id}`);
    } catch (cdnError) {
      // Log warning but continue so we can still mark it deleted in DB if it was already deleted on CDN
      logger.warn(`Could not delete asset from Cloudinary (may have been deleted manually): ${media.public_id}`);
    }

    // Soft delete in database
    return await mediaRepository.delete(id);
  }
};
