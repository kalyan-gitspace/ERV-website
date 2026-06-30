import { authService } from '../services/auth.service.js';

/**
 * Middleware to protect routes and verify the JWT Access Token
 */
export function protect(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.error(401, 'Access denied. No token provided.');
  }

  const token = authHeader.split(' ')[1];
  const decoded = authService.verifyAccessToken(token);

  if (!decoded) {
    return res.error(401, 'Session expired or invalid token. Please log in again.');
  }

  // Attach decoded admin payload (sub, email, name, role) to request
  req.admin = decoded;
  next();
}

/**
 * Middleware to restrict access to specific administrator roles
 * @param {...string} roles - Allowed roles (e.g. 'superadmin', 'editor')
 */
export function restrictTo(...roles) {
  return (req, res, next) => {
    if (!req.admin) {
      return res.error(401, 'Access denied. Not authenticated.');
    }

    if (!roles.includes(req.admin.role)) {
      return res.error(403, 'Access denied. You do not have permission to perform this action.');
    }

    next();
  };
}

