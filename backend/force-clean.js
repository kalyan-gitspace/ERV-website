import db from './config/db.js';

db.query("SELECT employee_id, id FROM employees WHERE employee_id = 'ERV001'", (err, res) => {
  if (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
  
  if (res.rows.length === 0) {
    console.log('No ERV001 found');
    process.exit(0);
  }
  
  const emp = res.rows[0];
  console.log('Found ERV001:', emp);
  
  // Delete attendance first
  db.query("DELETE FROM employee_attendance WHERE employee_id = $1", [emp.id], (err) => {
    if (err) console.error('Attendance error:', err.message);
    
    // Delete employee
    db.query("DELETE FROM employees WHERE id = $1", [emp.id], (err, res2) => {
      if (err) console.error('Delete error:', err.message);
      else console.log('Deleted ' + res2.rowCount + ' rows');
      process.exit(0);
    });
  });
});
