import crypto from 'crypto';

const CSRF_COOKIE_NAME = 'csrf_token';

/**
 * Generates and attaches a CSRF token cookie if one doesn't exist.
 * This cookie is intentionally NOT HttpOnly so the React client can read it.
 */
export function setCsrfToken(req, res, next) {
  // If no cookie exists, generate a new token
  if (!req.cookies?.[CSRF_COOKIE_NAME]) {
    const csrfToken = crypto.randomBytes(32).toString('hex');
    res.cookie(CSRF_COOKIE_NAME, csrfToken, {
      secure: process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production',
      sameSite: process.env.COOKIE_SAMESITE || 'lax',
      path: '/',
      // HttpOnly is false so the frontend can read the cookie to populate the header
    });
  }
  next();
}

/**
 * Enforces Double Submit Cookie CSRF validation on mutating HTTP methods.
 */
export function csrfProtection(req, res, next) {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  
  if (safeMethods.includes(req.method)) {
    return next();
  }

  const csrfCookie = req.cookies?.[CSRF_COOKIE_NAME];
  const csrfHeader = req.headers['x-csrf-token'];

  // Check if both exist and match exactly
  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    return res.status(403).json({
      success: false,
      message: 'CSRF token validation failed. Access denied.',
      data: null,
      errors: 'Invalid or missing CSRF token.',
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  next();
}
