import db from '../config/db.js';

export const clientRepository = {
  async findAll() {
    const query = `
      SELECT * FROM clients
      ORDER BY display_order ASC, created_at DESC
    `;
    const result = await db.query(query);
    return result.rows;
  },

  async findById(id) {
    const query = `
      SELECT * FROM clients
      WHERE id = $1
    `;
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  },

  async create(clientData) {
    const { name, logo, website, displayOrder } = clientData;
    const query = `
      INSERT INTO clients (name, logo, website, display_order)
      VALUES ($1, $2, $3, COALESCE($4, (SELECT COALESCE(MAX(display_order), 0) + 1 FROM clients)))
      RETURNING *
    `;
    const result = await db.query(query, [
      name,
      logo,
      website || null,
      typeof displayOrder !== 'undefined' && displayOrder !== null ? displayOrder : null
    ]);
    return result.rows[0];
  },

  async update(id, clientData) {
    const keys = [];
    const values = [];
    let index = 1;

    if (typeof clientData.name !== 'undefined') {
      keys.push(`name = $${index++}`);
      values.push(clientData.name);
    }

    if (typeof clientData.logo !== 'undefined') {
      keys.push(`logo = $${index++}`);
      values.push(clientData.logo);
    }

    if (typeof clientData.website !== 'undefined') {
      keys.push(`website = $${index++}`);
      values.push(clientData.website || null);
    }

    if (keys.length === 0) {
      return await this.findById(id);
    }

    const query = `
      UPDATE clients
      SET ${keys.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${index}
      RETURNING *
    `;
    values.push(id);

    const result = await db.query(query, values);
    return result.rows[0] || null;
  },

  async swapOrder(sourceId, targetId) {
    const fetchQuery = `
      SELECT id, display_order
      FROM clients
      WHERE id = ANY($1::uuid[])
      ORDER BY display_order ASC, created_at ASC
    `;
    const fetchResult = await db.query(fetchQuery, [[sourceId, targetId]]);
    if (fetchResult.rows.length !== 2) return null;

    const sourceRow = fetchResult.rows.find((row) => row.id === sourceId);
    const targetRow = fetchResult.rows.find((row) => row.id === targetId);
    if (!sourceRow || !targetRow) return null;

    const updateQuery = `
      UPDATE clients
      SET display_order = CASE
        WHEN id = $1 THEN $2
        WHEN id = $3 THEN $4
        ELSE display_order
      END,
      updated_at = CURRENT_TIMESTAMP
      WHERE id = ANY($5::uuid[])
      RETURNING *
    `;
    const updateResult = await db.query(updateQuery, [
      sourceId,
      targetRow.display_order,
      targetId,
      sourceRow.display_order,
      [sourceId, targetId]
    ]);
    return updateResult.rows;
  },

  async delete(id) {
    const query = `
      DELETE FROM clients
      WHERE id = $1
      RETURNING id
    `;
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }
};
