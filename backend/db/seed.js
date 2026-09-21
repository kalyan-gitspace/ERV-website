import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import db from '../config/db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seedDevelopmentData() {
  const seedPath = path.join(__dirname, 'seed.sql');
  const sql = fs.readFileSync(seedPath, 'utf8');

  if (!sql.trim()) {
    console.log('No seed SQL found.');
    return;
  }

  try {
    await db.query(sql);
    console.log('Development seed data applied successfully.');
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exitCode = 1;
  }
}

seedDevelopmentData();
