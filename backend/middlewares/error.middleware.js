import logger from '../config/logger.js';

/**
 * Global Express Error Handling Middleware.
 * Formats all errors into the standardized API response structure.
 */
export function errorMiddleware(err, req, res, next) {
  // Log the error using Winston with request ID and stack trace
  logger.error(err.message, {
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    requestId: req.requestId
  });

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  // Standardized error response
  return res.status(statusCode).json({
    success: false,
    message,
    data: null,
    errors: err.errors || err.message || null,
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
}
