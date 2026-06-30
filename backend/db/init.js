import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Connects to PostgreSQL, runs the schema definition script, and seeds initial system records.
 */
async function initializeDatabase() {
  console.log('Starting Edge Route Vision database initialization...');
  
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const seedPath = path.join(__dirname, 'seed.sql');
    
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found at: ${schemaPath}`);
    }
    if (!fs.existsSync(seedPath)) {
      throw new Error(`Seed file not found at: ${seedPath}`);
    }

    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    const seedSql = fs.readFileSync(seedPath, 'utf8');
    
    console.log('Resetting database public schema...');
    await db.query('DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;');
    
    console.log('Connecting to database and running schema.sql...');
    await db.query(schemaSql);
    console.log('Schema structure created successfully.');
    
    console.log('Running seed.sql to populate tables...');
    await db.query(seedSql);
    console.log('Default static data and admin records seeded successfully.');
    
    console.log('Database initialization completed successfully.');
    
    // Close the pool connection cleanly
    await db.getPool().end();
    process.exit(0);
  } catch (error) {
    console.error('CRITICAL: Database initialization failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

initializeDatabase();
