import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { mediaRepository } from '../repositories/media.repository.js';
import logger from '../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsRoot = path.join(__dirname, '..', 'uploads');
const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
const maxFileSize = 10 * 1024 * 1024;

const ensureDirectory = (dirPath) => {
  fs.mkdirSync(dirPath, { recursive: true });
};

const ensureUploadStructure = () => {
  const subfolders = ['projects', 'products', 'gallery', 'team', 'careers', 'certificates', 'logos', 'documents', 'temp'];
  ensureDirectory(uploadsRoot);
  subfolders.forEach((folder) => ensureDirectory(path.join(uploadsRoot, folder)));
};

const getFileExtension = (originalName) => {
  const parsed = path.parse(originalName);
  return parsed.ext ? parsed.ext.toLowerCase() : '.bin';
};

const buildFileName = (originalName, destination) => {
  const ext = getFileExtension(originalName);
  const base = path.parse(originalName).name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
  const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `${base || 'file'}-${uniqueSuffix}${ext}`;
};

const getPublicUrl = (relativePath) => `/uploads/${relativePath.replace(/\\/g, '/')}`;

export const mediaService = {
  initStorage() {
    ensureUploadStructure();
  },

  async uploadFile(file, destination = 'projects', adminId = 'system') {
    ensureUploadStructure();

    if (!file) {
      throw new Error('No file provided.');
    }

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new Error('Unsupported file type. Only JPG, JPEG, PNG, and WEBP images are allowed.');
    }

    if (file.size > maxFileSize) {
      throw new Error('File too large. Maximum size is 10MB.');
    }

    const tempDir = path.join(uploadsRoot, 'temp');
    const destinationDir = path.join(uploadsRoot, destination);
    ensureDirectory(tempDir);
    ensureDirectory(destinationDir);

    const fileName = buildFileName(file.originalname || 'upload', destination);
    const tempPath = path.join(tempDir, fileName);
    const finalPath = path.join(destinationDir, fileName);

    try {
      fs.writeFileSync(tempPath, file.buffer);
      fs.renameSync(tempPath, finalPath);

      const relativePath = path.relative(uploadsRoot, finalPath).replace(/\\/g, '/');
      const url = getPublicUrl(relativePath);
      const mediaRecord = await mediaRepository.create({
        filename: file.originalname || fileName,
        url,
        public_id: relativePath,
        file_type: 'image',
        file_size: file.size,
        uploaded_by: adminId,
      });

      logger.info(`Local upload complete: ${file.originalname} -> ${url}`);
      return mediaRecord;
    } catch (error) {
      try {
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      } catch (cleanupError) {
        logger.warn('Failed to cleanup temp upload', cleanupError);
      }
      logger.error(`Local upload failed: ${error.message}`);
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

  async getMediaById(id) {
    return await mediaRepository.findById(id);
  },

  async deleteMedia(id) {
    const media = await mediaRepository.findById(id);
    if (!media) return null;

    try {
      const absolutePath = path.join(uploadsRoot, media.public_id.replace(/^uploads\//, ''));
      if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
      }
      logger.info(`Deleted local asset: ${media.public_id}`);
    } catch (cdnError) {
      logger.warn(`Could not delete local asset: ${media.public_id}`, cdnError);
    }

    return await mediaRepository.delete(id);
  }
};
