import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcrypt';
import cookieParser from 'cookie-parser';
import logger from './config/logger.js';
import db from './config/db.js';
import apiRouter from './routes/index.js';
import { errorMiddleware } from './middlewares/error.middleware.js';
import { requestIdMiddleware } from './middlewares/requestId.middleware.js';
import { responseMiddleware } from './middlewares/response.middleware.js';
import { setCsrfToken, csrfProtection } from './middlewares/csrf.middleware.js';
import { healthController } from './controllers/health.controller.js';
import { swaggerController } from './controllers/swagger.controller.js';

// Trivial change to force reload
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// 1. Request ID — must be first so all subsequent logs include the ID
app.use(requestIdMiddleware);

// 2. Security Headers (Helmet)
app.use(helmet());

// 3. CORS Configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// 4. Request Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 5. Standardized Response Helpers (res.ok, res.created, res.error)
app.use(responseMiddleware);

// 6. CSRF Token Cookie (set on every request; readable by frontend)
app.use(setCsrfToken);

// 7. Rate Limiting for API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests from this IP, please try again later.' },
});
app.use('/api/', apiLimiter);

// 8. Request Logging Middleware (includes requestId)
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    requestId: req.requestId
  });
  next();
});

// 9. Health Check — no CSRF needed
app.get('/api/v1/health', healthController.checkHealth);

// 10. Swagger/OpenAPI Documentation — no CSRF needed
app.get('/api/docs', swaggerController.getSwaggerHtml);
app.get('/api/v1/docs/swagger.json', swaggerController.getSwaggerJson);

// 11. CSRF Protection for mutating requests (POST, PUT, PATCH, DELETE)
// Applied AFTER health/docs routes, BEFORE API routes
app.use('/api/', csrfProtection);

// 12. API Route Versioning (v1)
app.use('/api/v1', apiRouter);

// 13. Global Error Handling Middleware
app.use(errorMiddleware);

/**
 * Bootstraps the initial Superadmin if no administrators exist in the database.
 * Uses ADMIN_EMAIL, ADMIN_PASSWORD, and ADMIN_NAME from environment variables.
 */
async function bootstrapAdmin() {
  try {
    const result = await db.query('SELECT COUNT(*) FROM admins WHERE is_deleted = FALSE');
    const count = parseInt(result.rows[0].count, 10);
    
    if (count === 0) {
      const email = process.env.ADMIN_EMAIL;
      const password = process.env.ADMIN_PASSWORD;
      const name = process.env.ADMIN_NAME || 'System Administrator';
      
      if (!email || !password) {
        logger.warn('No active administrators found. ADMIN_EMAIL or ADMIN_PASSWORD is not configured. Bootstrapping skipped.');
        return;
      }
      
      logger.info('No administrators found. Bootstrapping initial superadmin account...');
      
      const roleResult = await db.query("SELECT id FROM roles WHERE name = 'superadmin'");
      if (roleResult.rows.length === 0) {
        logger.error('Bootstrapping failed: "superadmin" role is missing. Run migrations/seeds first.');
        return;
      }
      
      const roleId = roleResult.rows[0].id;
      const passwordHash = await bcrypt.hash(password, 10);
      
      await db.query(
        'INSERT INTO admins (role_id, email, password_hash, full_name, is_active) VALUES ($1, $2, $3, $4, TRUE)',
        [roleId, email, passwordHash, name]
      );
      
      logger.info(`Successfully bootstrapped initial superadmin: ${email}`);
    }
  } catch (error) {
    logger.error('Error during admin bootstrapping:', error);
  }
}

// Start the server
app.listen(PORT, async () => {
  logger.info(`Edge Route Vision backend running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  await bootstrapAdmin();
});
