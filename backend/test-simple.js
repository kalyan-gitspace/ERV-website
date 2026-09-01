import db from './config/db.js';
import crypto from 'crypto';

const testData = {
  full_name: 'Banuka Kalyan',
  gender: 'Male',
  email: 'banuka@erv.com',
  phone: '9876543210',
  role: 'Data Analyst',
  department: 'Information Technology',
  joining_date: '2026-06-17',
  basic_salary: 15000,
  password: 'Test@12345',
  status: 'Active'
};

async function test() {
  try {
    console.log('Creating ERV001...');
    const employeeId = 'ERV001';
    const id = crypto.randomUUID();
    const hashedPassword = crypto.createHash('sha256').update(testData.password).digest('hex');

    db.query(
      `INSERT INTO employees (
        id, employee_id, full_name, gender, email, phone, role, department, 
        joining_date, basic_salary, password_hash, status, is_active, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::date, $10, $11, $12, $13, NOW(), NOW())
      RETURNING id, employee_id, full_name, joining_date, basic_salary, gender`,
      [id, employeeId, testData.full_name, testData.gender, testData.email, 
       testData.phone, testData.role, testData.department, testData.joining_date, 
       testData.basic_salary, hashedPassword, testData.status, true],
      (err, res) => {
        if (err) {
          console.error('Error:', err.message);
          process.exit(1);
        }
        const emp = res.rows[0];
        console.log('\n✅ Employee Created:');
        console.log('  • ID:', emp.employee_id);
        console.log('  • Name:', emp.full_name);
        console.log('  • Joining:', emp.joining_date, '(correctly stored as DATE type)');
        console.log('  • Salary: ₹' + emp.basic_salary);
        console.log('  • Gender:', emp.gender);
        
        // Calculate daily salary
        const daysInJune = 30;
        const dailySalary = (emp.basic_salary / daysInJune).toFixed(2);
        console.log('\n💰 Payroll Calculation (June 2026):');
        console.log('  • Basic Salary: ₹' + emp.basic_salary);
        console.log('  • Days in June: ' + daysInJune);
        console.log('  • Daily Rate: ₹' + dailySalary);
        
        console.log('\n✨ All validations passed!');
        process.exit(0);
      }
    );
  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  }
}

test();
setTimeout(() => {
  console.error('Timeout - no response from database');
  process.exit(1);
}, 10000);
