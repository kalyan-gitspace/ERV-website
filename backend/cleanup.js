import db from './config/db.js';

// First delete attendance records
db.query("DELETE FROM employee_attendance WHERE employee_id IN (SELECT id FROM employees WHERE employee_id = 'ERV001')", (err) => {
  if (err) console.error('Error cleaning attendance:', err);
  
  // Then delete employee
  db.query("DELETE FROM employees WHERE employee_id = 'ERV001'", (err, res) => {
    if (err) console.error('Error:', err);
    else console.log('Cleaned: ERV001 and all attendance records deleted');
    process.exit(0);
  });
});
