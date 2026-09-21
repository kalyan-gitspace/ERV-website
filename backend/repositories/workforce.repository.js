import db from '../config/db.js';

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export const workforceRepository = {
  async festivals() { const result = await db.query('SELECT id, festival_date::text AS festival_date, name FROM office_festivals ORDER BY festival_date'); return result.rows; },
  async addFestival(date, name = 'Festival') { const result = await db.query('INSERT INTO office_festivals (festival_date, name) VALUES ($1::date, $2) ON CONFLICT (festival_date) DO UPDATE SET name=EXCLUDED.name, updated_at=CURRENT_TIMESTAMP RETURNING id, festival_date::text AS festival_date, name', [date, name]); return result.rows[0]; },
  async removeFestival(id) { const result = await db.query('DELETE FROM office_festivals WHERE id=$1 RETURNING id', [id]); return result.rows[0] || null; },
  async createLeave(employeeId, dates, leaveType = 'unpaid', deviceDate = null) {
    const client = await db.getPool().connect();
    const normalizedDates = [...dates].sort();
    const requestKey = `${employeeId}:${leaveType}:${normalizedDates.join(',')}`;
    try {
      await client.query('BEGIN');
      const existing = await client.query('SELECT id FROM leave_requests WHERE request_key=$1 AND status <> $2 FOR UPDATE', [requestKey, 'Cancelled']);
      if (existing.rows[0]) {
        await client.query('COMMIT');
        return { ...(await this.leaveById(existing.rows[0].id)), created: false };
      }
      const valid = await client.query(`SELECT d::date AS leave_date FROM unnest($1::date[]) AS d WHERE d::date >= COALESCE((SELECT joining_date FROM employees WHERE id=$2), d::date) AND d::date >= COALESCE($3::date, CURRENT_DATE) AND EXTRACT(DOW FROM d::date) <> 0 AND NOT EXISTS (SELECT 1 FROM office_festivals f WHERE f.festival_date=d::date) AND NOT EXISTS (SELECT 1 FROM employee_attendance a WHERE a.employee_id=$2 AND a.attendance_date=d::date AND a.status='Paid Holiday')`, [normalizedDates, employeeId, deviceDate]);
      if (valid.rows.length !== normalizedDates.length) throw new Error('One or more selected leave dates are not eligible.');
      const request = await client.query('INSERT INTO leave_requests (employee_id, requested_days, leave_type, request_key) VALUES ($1, $2, $3, $4) ON CONFLICT (request_key) DO UPDATE SET updated_at=CURRENT_TIMESTAMP RETURNING id, (xmax = 0) AS created', [employeeId, normalizedDates.length, leaveType, requestKey]);
      if (!request.rows[0].created) { await client.query('COMMIT'); return { ...(await this.leaveById(request.rows[0].id)), created: false }; }
      await client.query('INSERT INTO leave_request_dates (leave_request_id, leave_date) SELECT $1, unnest($2::date[])', [request.rows[0].id, normalizedDates]);
      await client.query('COMMIT');
      return { ...(await this.leaveById(request.rows[0].id)), created: true };
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  },
  async leaveById(id) { const result = await db.query(`SELECT r.id, r.employee_id, e.employee_id AS employee_code, e.full_name, r.requested_days, r.leave_type, r.status AS request_status, r.created_at, json_agg(json_build_object('id', d.id, 'date', d.leave_date::text, 'status', d.status) ORDER BY d.leave_date) AS dates FROM leave_requests r JOIN employees e ON e.id=r.employee_id JOIN leave_request_dates d ON d.leave_request_id=r.id WHERE r.id=$1 GROUP BY r.id, e.employee_id, e.full_name`, [id]); return result.rows[0] || null; },
  async leaves(employeeId = null) { const result = await db.query(`SELECT r.id, r.employee_id, e.employee_id AS employee_code, e.full_name, r.requested_days, r.leave_type, r.status AS request_status, r.created_at, json_agg(json_build_object('id', d.id, 'date', d.leave_date::text, 'status', d.status) ORDER BY d.leave_date) AS dates FROM leave_requests r JOIN employees e ON e.id=r.employee_id JOIN leave_request_dates d ON d.leave_request_id=r.id ${employeeId ? 'WHERE r.employee_id=$1 AND r.status <> \'Cancelled\'' : ''} GROUP BY r.id, e.employee_id, e.full_name ORDER BY r.created_at DESC`, employeeId ? [employeeId] : []); return result.rows; },
  async cancelLeave(id, employeeId) { const client = await db.getPool().connect(); try { await client.query('BEGIN'); const dates = await client.query(`SELECT leave_date::text AS date, status FROM leave_request_dates WHERE leave_request_id=$1`, [id]); const result = await client.query(`UPDATE leave_requests SET status='Cancelled', request_key=request_key || ':cancelled:' || id, updated_at=CURRENT_TIMESTAMP WHERE id=$1 AND employee_id=$2 AND status IN ('Pending', 'Completed') RETURNING id`, [id, employeeId]); if (!result.rows[0]) { await client.query('ROLLBACK'); return null; } for (const item of dates.rows.filter((date) => date.status === 'Approved')) await client.query(`DELETE FROM employee_attendance WHERE employee_id=$1 AND attendance_date=$2::date AND status IN ('Absent', 'Paid Leave')`, [employeeId, item.date]); await client.query('COMMIT'); return this.leaveById(id); } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); } },
  async decideDate(dateId, status) { const result = await db.query(`UPDATE leave_request_dates SET status=$2 WHERE id=$1 AND status='Pending' RETURNING leave_request_id`, [dateId, status]); if (!result.rows[0]) return null; await db.query(`UPDATE leave_requests SET status=CASE WHEN NOT EXISTS (SELECT 1 FROM leave_request_dates WHERE leave_request_id=$1 AND status='Pending') THEN 'Completed' ELSE status END, updated_at=CURRENT_TIMESTAMP WHERE id=$1`, [result.rows[0].leave_request_id]); return this.leaveById(result.rows[0].leave_request_id); },
  async decideAll(requestId, status) { await db.query(`UPDATE leave_request_dates SET status=$2 WHERE leave_request_id=$1 AND status='Pending'`, [requestId, status]); await db.query(`UPDATE leave_requests SET status=CASE WHEN NOT EXISTS (SELECT 1 FROM leave_request_dates WHERE leave_request_id=$1 AND status='Pending') THEN 'Completed' ELSE status END, updated_at=CURRENT_TIMESTAMP WHERE id=$1`, [requestId]); return this.leaveById(requestId); },
  async deleteLeave(id) { const client = await db.getPool().connect(); try { await client.query('BEGIN'); await client.query(`DELETE FROM notifications WHERE type = 'leave_request' AND related_id = $1`, [id]); const result = await client.query('DELETE FROM leave_requests WHERE id=$1 RETURNING id', [id]); await client.query('COMMIT'); return result.rows[0] || null; } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); } },
  async deleteAllLeaves() { const client = await db.getPool().connect(); try { await client.query('BEGIN'); await client.query(`DELETE FROM notifications WHERE type = 'leave_request'`); const result = await client.query('DELETE FROM leave_requests RETURNING id'); await client.query('COMMIT'); return result.rows; } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); } },
  isDate(date) { return datePattern.test(date || ''); }
};