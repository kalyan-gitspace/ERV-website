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

const resumeFileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/rtf',
    'text/plain',
    'application/vnd.oasis.opendocument.text'
  ];

  const fileName = (file.originalname || '').toLowerCase();
  const isAllowedExtension = ['.pdf', '.doc', '.docx', '.rtf', '.odt', '.txt'].some((ext) => fileName.endsWith(ext));

  if (allowedMimeTypes.includes(file.mimetype) || isAllowedExtension) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported resume file type. Please upload a PDF, DOC, DOCX, RTF, ODT, or TXT file.'), false);
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

export const resumeUpload = multer({
  storage,
  fileFilter: resumeFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 Megabytes
  }
});
