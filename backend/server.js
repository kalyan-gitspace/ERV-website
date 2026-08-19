import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcrypt';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './config/logger.js';
import db from './config/db.js';
import apiRouter from './routes/index.js';
import { errorMiddleware } from './middlewares/error.middleware.js';
import { requestIdMiddleware } from './middlewares/requestId.middleware.js';
import { responseMiddleware } from './middlewares/response.middleware.js';
import { setCsrfToken, csrfProtection } from './middlewares/csrf.middleware.js';
import { healthController } from './controllers/health.controller.js';
import { swaggerController } from './controllers/swagger.controller.js';
import { mediaService } from './services/media.service.js';

// Trivial change to force reload
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  },
}));

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
  // Do not apply rate limit to auth login endpoint so admins are not blocked
  // (this prevents blocking legitimate repeated login attempts from the same IP)
  skip: (req /*, res */) => {
    try {
      const url = String(req.originalUrl || req.url || '').toLowerCase();
      // Skip limiter for auth login/refresh/logout endpoints under API v1 auth
      if (url.startsWith('/api/v1/auth')) return true;
    } catch (e) {
      // ignore and do not skip
    }
    return false;
  },
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
async function ensureApplicationTable() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS applications (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
        job_id UUID NOT NULL REFERENCES careers(id) ON DELETE CASCADE,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        notice_period VARCHAR(100) NOT NULL,
        total_experience VARCHAR(100) NOT NULL,
        message TEXT NOT NULL,
        resume_path VARCHAR(2048) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (error) {
    logger.error('Error creating applications table:', error);
  }
}

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
async function ensureClientsTable() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS clients (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
        name VARCHAR(255) NOT NULL,
        logo VARCHAR(2048) NOT NULL,
        website VARCHAR(2048),
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (error) {
    logger.error('Error creating clients table:', error);
  }
}

async function ensureProductCmsColumns() {
  try {
    await db.query(`
      ALTER TABLE products
        ADD COLUMN IF NOT EXISTS sub_heading VARCHAR(255),
        ADD COLUMN IF NOT EXISTS introduction TEXT,
        ADD COLUMN IF NOT EXISTS content JSONB DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'enabled',
        ADD COLUMN IF NOT EXISTS hero_image VARCHAR(2048)
    `);
  } catch (error) {
    logger.error('Error adding product CMS columns:', error);
  }
}

async function ensureLegacyProducts() {
  const legacyProducts = [
    {
      name: 'LDD (Laser Detection Device)',
      slug: 'ldd',
      subHeading: 'High-integrity path scanner and laser crack detection array.',
      introduction: 'The Laser Detection Device (LDD) represents the absolute gold standard in pathway surface scanning. Operating a high-speed rotating LiDAR laser module, the LDD sweeps the asphalt surface to compile sub-millimeter 3D point cloud maps. Dynamic algorithms detect road surface distress, cracking, potholes, and deformation in real time at highway speeds.',
      summary: 'Sub-millimeter LiDAR path scanner detecting structural distress at scale.',
      specifications: {
        'Laser Wave Length': '905nm eye-safe Class 1 Laser',
        'Scan Rate': '250,000 points per second, 360-degree sweep',
        'Defect Resolution': 'Detects structural crack lines down to 0.5 millimeters',
        'Mapping Speeds': 'Maintains maximum precision at vehicle speeds up to 120 km/h',
        'Onboard Storage': '2TB NVMe local cache storage',
        'Operational Rating': 'NEMA 4X / IP67 ruggedized vibration-isolated casing'
      },
      applications: [
        'High-speed highway pothole and crack surveys',
        'Bridge deck and runway surface scanning',
        'Structural paving profile analysis',
        'Localized pavement condition index (PCI) calculations'
      ],
      benefits: [
        'Sub-millimeter crack analysis avoids manual path inspection overhead.',
        'Runs mapping sweeps dynamically without stopping or slowing down route traffic.',
        'Onboard point cloud processors compress output logs for instant telemetry uplink.'
      ]
    },
    {
      name: 'NSV (Network Stream Video)',
      slug: 'nsv',
      subHeading: 'Real-time edge-encoded video streaming with sub-millisecond telemetry overlay.',
      introduction: 'The ERV Network Stream Video (NSV) system is a military-grade edge-vision encoder designed to capture, process, and stream multi-angle HDR video pipelines under demanding highway environments. Built with localized deep-learning computer vision caches, the NSV embeds telemetry layers directly into live streams, enabling route coordinators to inspect paths in real time.',
      summary: 'High-fidelity edge visual stream array with integrated path analytics.',
      specifications: {
        'Sensor Array': '4K HDR CMOS Optoelectronic Sensor, 120fps',
        'Encoding Protocol': 'H.265/HEVC hardware acceleration, sub-100ms latency',
        'Telemetry Overlays': 'GPS Coordinate mapping, speed index, grade index, time-codes',
        'Connectivity': 'Integrated Dual-SIM 5G LTE, Gigabit Ethernet port',
        'Protection Standard': 'IP68 certified military-grade dust and water protection',
        'Power Intake': '12-24V DC automotive standard input, 15W active load'
      },
      applications: [
        'Real-time highway path telemetry streaming',
        'Autonomous logistics route visual monitoring',
        'Structural route survey telemetry verification',
        'Intelligent highway traffic flow path-analytics'
      ],
      benefits: [
        'Sub-millisecond overlay sync guarantees precision mapping.',
        'Rugged heat-sink casing guarantees operation between -40°C to +85°C.',
        'Active path mapping continues offline utilizing local caching logs.'
      ]
    }
  ];

  try {
    for (const product of legacyProducts) {
      await db.query(`
        INSERT INTO products (
          name, slug, sub_heading, introduction, content, status, short_description,
          full_description, specifications, applications, benefits, features
        ) VALUES ($1, $2, $3, $4, '[]'::jsonb, 'enabled', $5, $4, $6::jsonb, $7, $8, '{}')
        ON CONFLICT DO NOTHING
      `, [
        product.name,
        product.slug,
        product.subHeading,
        product.introduction,
        product.summary,
        JSON.stringify(product.specifications),
        product.applications,
        product.benefits
      ]);
    }
  } catch (error) {
    logger.error('Error preserving legacy products:', error);
  }
}

app.listen(PORT, async () => {
  mediaService.initStorage();
  await ensureApplicationTable();
  await ensureClientsTable();
  await ensureProductCmsColumns();
  await ensureLegacyProducts();
  logger.info(`Edge Route Vision backend running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  await bootstrapAdmin();
});
