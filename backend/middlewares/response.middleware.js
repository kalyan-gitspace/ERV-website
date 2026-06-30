/**
 * Middleware to standardize all API responses.
 * Adds helper methods to the Express res object: res.ok(), res.created(), res.error().
 */
export function responseMiddleware(req, res, next) {
  /**
   * Send a 200 OK successful response
   * @param {*} data - Payload
   * @param {string} message - User-friendly message
   */
  res.ok = (data = null, message = 'Success') => {
    return res.status(200).json({
      success: true,
      message,
      data,
      errors: null,
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  };

  /**
   * Send a 201 Created successful response
   * @param {*} data - Payload
   * @param {string} message - User-friendly message
   */
  res.created = (data = null, message = 'Resource created successfully') => {
    return res.status(201).json({
      success: true,
      message,
      data,
      errors: null,
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  };

  /**
   * Send an error response
   * @param {number} statusCode - HTTP status code (e.g. 400, 401, 403, 404, 500)
   * @param {string} message - Error explanation
   * @param {*} errors - Granular validation or system errors
   */
  res.error = (statusCode = 500, message = 'Internal Server Error', errors = null) => {
    return res.status(statusCode).json({
      success: false,
      message,
      data: null,
      errors,
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  };

  next();
}
