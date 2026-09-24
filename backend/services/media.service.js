import cloudinary from '../config/cloudinary.js';
import { mediaRepository } from '../repositories/media.repository.js';
import logger from '../config/logger.js';

const allowedMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

const maxFileSize = 10 * 1024 * 1024;

const uploadBufferToCloudinary = (buffer, options) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result);
      }
    );

    stream.end(buffer);
  });
};

export const mediaService = {
  /**
   * Cloudinary does not require local storage initialization.
   */
  initStorage() {
    logger.info('Cloudinary media storage initialized.');
  },

  /**
   * Upload a media file to Cloudinary and create the database record.
   */
  async uploadFile(file, destination = 'projects', adminId = 'system') {
    if (!file) {
      throw new Error('No file provided.');
    }

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new Error(
        'Unsupported file type. Only JPG, JPEG, PNG, and WEBP images are allowed.'
      );
    }

    if (file.size > maxFileSize) {
      throw new Error('File too large. Maximum size is 10MB.');
    }

    try {
      const result = await uploadBufferToCloudinary(file.buffer, {
        folder: `erv/${destination}`,
        resource_type: 'image',
      });

      const mediaRecord = await mediaRepository.create({
        filename: file.originalname || result.public_id,
        url: result.secure_url,
        public_id: result.public_id,
        file_type: 'image',
        file_size: file.size,
        uploaded_by: adminId,
      });

      logger.info(
        `Cloudinary upload complete: ${file.originalname} -> ${result.secure_url}`
      );

      return mediaRecord;
    } catch (error) {
      logger.error(`Cloudinary upload failed: ${error.message}`);
      throw error;
    }
  },

  async getAllMedia(options = {}) {
    const page = parseInt(options.page, 10) || 1;
    const limit = parseInt(options.limit, 10) || 20;
    const offset = (page - 1) * limit;

    const queryOptions = {
      file_type: options.file_type,
      search: options.search,
      limit,
      offset,
    };

    const items = await mediaRepository.findAll(queryOptions);
    const totalItems = await mediaRepository.count(queryOptions);

    return {
      items,
      pagination: {
        totalItems,
        currentPage: page,
        totalPages: Math.ceil(totalItems / limit),
        limit,
      },
    };
  },

  async getMediaById(id) {
    return await mediaRepository.findById(id);
  },

  /**
   * Delete media from Cloudinary and then from the database.
   */
  async deleteMedia(id) {
    const media = await mediaRepository.findById(id);

    if (!media) {
      return null;
    }

    try {
      if (media.public_id) {
        await cloudinary.uploader.destroy(media.public_id, {
          resource_type: 'image',
        });

        logger.info(`Deleted Cloudinary asset: ${media.public_id}`);
      }
    } catch (cloudinaryError) {
      logger.warn(
        `Could not delete Cloudinary asset: ${media.public_id}`,
        cloudinaryError
      );
    }

    return await mediaRepository.delete(id);
  },
};