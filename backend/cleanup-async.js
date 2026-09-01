import db from './config/db.js';

function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, res) => {
      if (err) reject(err);
      else resolve(res);
    });
  });
}

async function cleanup() {
  try {
    // Delete attendance
    const att = await query("DELETE FROM employee_attendance WHERE employee_id IN (SELECT id FROM employees WHERE employee_id = 'ERV001')");
    console.log('Deleted attendance:', att.rowCount);
    
    // Delete employee
    const emp = await query("DELETE FROM employees WHERE employee_id = 'ERV001'");
    console.log('Deleted employees:', emp.rowCount);
    
    // Verify
    const check = await query("SELECT COUNT(*) as cnt FROM employees WHERE employee_id = 'ERV001'");
    console.log('Remaining ERV001:', check.rows[0].cnt);
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

cleanup();
