ALTER TABLE employees ADD COLUMN IF NOT EXISTS gender VARCHAR(20);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS basic_salary NUMERIC(12, 2);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'Active';

ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_gender_check;
ALTER TABLE employees ADD CONSTRAINT employees_gender_check CHECK (gender IS NULL OR gender IN ('Male', 'Female'));

ALTER TABLE employee_attendance ADD COLUMN IF NOT EXISTS login_time TIME;
ALTER TABLE employee_attendance ADD COLUMN IF NOT EXISTS logout_time TIME;
ALTER TABLE employee_attendance ADD COLUMN IF NOT EXISTS work_hours TIME;
ALTER TABLE employee_attendance DROP CONSTRAINT IF EXISTS employee_attendance_status_check;
ALTER TABLE employee_attendance ADD CONSTRAINT employee_attendance_status_check CHECK (status IN ('Present', 'Absent', 'WFH', 'Halfday', 'On Site Work', 'Paid Holiday', 'Festival', 'Paid Leave'));

ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS leave_type VARCHAR(20) NOT NULL DEFAULT 'unpaid';
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS request_key VARCHAR(255);
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'Pending';
CREATE UNIQUE INDEX IF NOT EXISTS leave_requests_request_key_unique ON leave_requests (request_key);

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS recipient_type VARCHAR(20) DEFAULT 'admin';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS recipient_id UUID;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS related_id UUID;
CREATE UNIQUE INDEX IF NOT EXISTS notifications_leave_request_unique ON notifications (type, related_id) WHERE type = 'leave_request' AND related_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS employee_id_registry (
    employee_id VARCHAR(100) PRIMARY KEY,
    sequence_number INTEGER UNIQUE NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE SEQUENCE IF NOT EXISTS employee_id_sequence START WITH 1;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM employee_id_registry
    WHERE employee_id = 'ERV001'
  ) THEN
    INSERT INTO employee_id_registry (employee_id, sequence_number)
    SELECT employee_id, CAST(SUBSTRING(employee_id FROM 4) AS INTEGER)
    FROM employees
    WHERE employee_id ~ '^ERV[0-9]+$'
    ON CONFLICT (employee_id) DO NOTHING;
  END IF;
END $$;

DO $$
BEGIN
  PERFORM setval('employee_id_sequence', GREATEST(COALESCE((SELECT MAX(sequence_number) FROM employee_id_registry), 0) + 1, 1), false);
END $$;
