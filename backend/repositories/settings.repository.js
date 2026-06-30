import db from '../config/db.js';

/**
 * Settings Repository - Encapsulates all SQL queries for settings and company_information tables.
 */
export const settingsRepository = {
  // =========================================================================
  // WEBSITE SETTINGS (JSONB values)
  // =========================================================================

  async getSetting(key) {
    const query = 'SELECT value FROM settings WHERE key = $1';
    const result = await db.query(query, [key]);
    return result.rows[0]?.value ?? null;
  },

  async setSetting(key, value) {
    const query = `
      INSERT INTO settings (key, value, updated_at)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      ON CONFLICT (key) DO UPDATE
      SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    const result = await db.query(query, [key, JSON.stringify(value)]);
    return result.rows[0];
  },

  async getAllSettings() {
    const query = 'SELECT key, value FROM settings';
    const result = await db.query(query);
    
    // Map array of rows into a single key-value object
    return result.rows.reduce((acc, row) => {
      acc[row.key] = row.value;
      return acc;
    }, {});
  },

  // =========================================================================
  // COMPANY INFORMATION (JSONB content)
  // =========================================================================

  async getCompanyInfo(key) {
    const query = 'SELECT content FROM company_information WHERE key = $1';
    const result = await db.query(query, [key]);
    return result.rows[0]?.content ?? null;
  },

  async setCompanyInfo(key, content) {
    const query = `
      INSERT INTO company_information (key, content, updated_at)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      ON CONFLICT (key) DO UPDATE
      SET content = EXCLUDED.content, updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    const result = await db.query(query, [key, JSON.stringify(content)]);
    return result.rows[0];
  },

  async getAllCompanyInfo() {
    const query = 'SELECT key, content FROM company_information';
    const result = await db.query(query);

    // Map array of rows into a single key-value object
    return result.rows.reduce((acc, row) => {
      acc[row.key] = row.content;
      return acc;
    }, {});
  }
};
