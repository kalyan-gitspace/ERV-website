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
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported resume file type. Please upload a PDF, DOC, or DOCX file.'), false);
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

const employeeFileFilter = (req, file, cb) => {
  const profileMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp'
  ];
  const documentMimeTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/octet-stream'
  ];
  const allowedMimeTypes = file.fieldname === 'profilePicture' ? profileMimeTypes : documentMimeTypes;
  if (allowedMimeTypes.includes(file.mimetype)) cb(null, true);
  else cb(new Error(file.fieldname === 'profilePicture'
    ? 'Profile picture must be JPG, JPEG, PNG, or WEBP.'
    : 'ID proof must be PDF, JPG, JPEG, PNG, WEBP, DOC, or DOCX.'), false);
};

export const employeeUpload = multer({
  storage,
  fileFilter: employeeFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});
