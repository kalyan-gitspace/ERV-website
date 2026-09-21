import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import dotenv from 'dotenv';
import db from '../config/db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.join(__dirname, 'migrations');

const isMainModule = () => {
  if (!process.argv[1]) return false;
  return import.meta.url === pathToFileURL(process.argv[1]).href;
};

const readMigrationFiles = () =>
  fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();

async function ensureMigrationTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      migration_name VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

async function getAppliedMigrations() {
  const result = await db.query('SELECT migration_name FROM schema_migrations ORDER BY id');
  return new Set(result.rows.map((row) => row.migration_name));
}

async function applyMigration(fileName) {
  const filePath = path.join(migrationsDir, fileName);
  const sql = fs.readFileSync(filePath, 'utf8');

  if (!sql.trim()) {
    return;
  }

  const client = await db.getPool().connect();

  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('INSERT INTO schema_migrations (migration_name) VALUES ($1)', [fileName]);
    await client.query('COMMIT');
    console.log(`Applied migration: ${fileName}`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw new Error(`Migration ${fileName} failed: ${error.message}`);
  } finally {
    client.release();
  }
}

export async function runMigrations() {
  await ensureMigrationTable();

  const files = readMigrationFiles();
  const applied = await getAppliedMigrations();
  const pending = files.filter((file) => !applied.has(file));

  if (pending.length === 0) {
    console.log('No pending database migrations.');
    return { appliedCount: 0, pendingCount: 0 };
  }

  for (const file of pending) {
    await applyMigration(file);
  }

  return { appliedCount: pending.length, pendingCount: 0 };
}

export async function printMigrationStatus() {
  await ensureMigrationTable();

  const files = readMigrationFiles();
  const applied = await getAppliedMigrations();

  console.log('Database migration status');
  console.log('========================');

  for (const file of files) {
    const status = applied.has(file) ? 'APPLIED' : 'PENDING';
    console.log(`${status} ${file}`);
  }

  const pending = files.filter((file) => !applied.has(file));
  console.log(`\n${pending.length} pending migration(s).`);
}

async function main() {
  const mode = process.argv.includes('--status') ? 'status' : 'migrate';

  try {
    if (mode === 'status') {
      await printMigrationStatus();
      return;
    }

    const result = await runMigrations();
    console.log(`Migration run complete. Applied ${result.appliedCount} file(s).`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

if (isMainModule()) {
  await main();
}
