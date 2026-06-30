import multer from 'multer';

// Keep uploaded files in memory buffers instead of writing to disk
const storage = multer.memoryStorage();

/**
 * Filter to validate uploaded file mime-types
 */
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    // Images
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    // Videos
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime', // .mov
    // PDFs
    'application/pdf'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type. Only images (JPEG, PNG, WEBP, GIF, SVG), videos (MP4, WEBM, MOV), and PDFs are allowed.'), false);
  }
};

/**
 * Configure Multer middleware
 * 
 * Limits:
 *   - Overall size limit: 100MB (to support high-definition background videos)
 */
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100 Megabytes
  }
});
