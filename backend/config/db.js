import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const isProduction = process.env.NODE_ENV === 'production';
const isTesting = process.env.NODE_ENV === 'testing';

let databaseUrl = process.env.DATABASE_URL;

if (isTesting) {
  // Use a separate test database URL if defined, otherwise fall back to standard URL
  databaseUrl = process.env.TEST_DATABASE_URL || databaseUrl;
}

const poolConfig = {
  connectionString: databaseUrl,
  // Neon PostgreSQL requires SSL in production. RejectUnauthorized is false for standard cloud certs.
  ssl: isProduction
    ? { rejectUnauthorized: false }
    : false,
};

// Enterprise pooling configurations
poolConfig.max = isProduction ? 20 : 10; // Max connections in pool
poolConfig.idleTimeoutMillis = 30000;     // Close idle clients after 30 seconds
poolConfig.connectionTimeoutMillis = 5000; // Return an error if connection takes > 5s

const pool = new Pool(poolConfig);

// Handle unexpected errors on idle pool clients
pool.on('error', (err) => {
  console.error('Unexpected error on idle database client:', err.message);
});

export default {
  /**
   * Execute an SQL query
   * @param {string} text - SQL Query
   * @param {Array} params - Query Parameters
   */
  query: (text, params) => pool.query(text, params),
  
  /**
   * Access the underlying Pool instance (useful for transaction blocks or migration setups)
   */
  getPool: () => pool,
};
