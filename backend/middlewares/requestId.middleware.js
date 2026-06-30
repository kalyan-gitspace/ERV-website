import { generateUUIDv7 } from '../utils/uuid.js';

/**
 * Middleware to assign a unique X-Request-ID to every incoming request.
 * If the client already sends an X-Request-ID header, it preserves it.
 */
export function requestIdMiddleware(req, res, next) {
  const requestId = req.headers['x-request-id'] || generateUUIDv7();
  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
}
