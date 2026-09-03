import { describe, expect, it } from 'vitest';
import { calculatePayroll, getDaysInMonth } from '../services/payroll.service.js';
import { normalizeAttendanceTimes } from '../services/attendance.service.js';

const date = (day) => `2026-06-${String(day).padStart(2, '0')}`;

it('uses actual month lengths, including leap-year February', () => {
  expect(getDaysInMonth(2026, 2)).toBe(28);
  expect(getDaysInMonth(2028, 2)).toBe(29);
  expect(getDaysInMonth(2026, 8)).toBe(31);
});

it('normalizes attendance times by status', () => {
  expect(normalizeAttendanceTimes('Present')).toEqual({ loginTime: '09:30', logoutTime: '18:30', workHours: '09:00' });
  expect(normalizeAttendanceTimes('Halfday')).toEqual({ loginTime: '09:30', logoutTime: '14:00', workHours: '04:30' });
  expect(normalizeAttendanceTimes('Festival', '09:30', '18:30')).toEqual({ loginTime: null, logoutTime: null, workHours: null });
  expect(normalizeAttendanceTimes('Paid Leave', '09:30', '18:30')).toEqual({ loginTime: null, logoutTime: null, workHours: null });
  expect(normalizeAttendanceTimes('Absent', '09:30', '18:30')).toEqual({ loginTime: null, logoutTime: null, workHours: null });
  expect(normalizeAttendanceTimes('Present', '09:45', '18:15')).toEqual({ loginTime: '09:45', logoutTime: '18:15', workHours: '08:30' });
});

describe('calculatePayroll', () => {
  it('preserves date-only records and calculates the supplied payroll example', () => {
    const nonSundays = [...Array(30)].map((_, index) => index + 1)
      .filter((day) => new Date(2026, 5, day).getDay() !== 0);
    const records = [
      ...nonSundays.slice(0, 21).map((day) => ({ attendance_date: date(day), status: 'Present' })),
      ...nonSundays.slice(21, 23).map((day) => ({ attendance_date: date(day), status: 'Absent' })),
      { attendance_date: date(nonSundays[23]), status: 'WFH' },
      { attendance_date: date(nonSundays[24]), status: 'Halfday' },
      { attendance_date: date(nonSundays[25]), status: 'Halfday' }
    ];

    const payroll = calculatePayroll(
      { joining_date: '2026-06-01', basic_salary: 15000 },
      records,
      '2026-06',
      new Date(2026, 5, 30)
    );

    expect(payroll.dailySalary).toBe(500);
    expect(payroll.counts).toMatchObject({ Present: 21, Absent: 2, WFH: 1, Halfday: 2, 'Paid Sundays': 4 });
    expect(payroll.paidDays).toBe(27);
    expect(payroll.earnings).toBe(13500);
  });

  it('excludes dates before joining and after today without shifting calendar dates', () => {
    const payroll = calculatePayroll(
      { joining_date: '2026-06-15', basic_salary: 15000 },
      [{ attendance_date: '2026-06-14', status: 'Present' }, { attendance_date: '2026-06-15', status: 'Present' }],
      '2026-06',
      new Date(2026, 5, 30)
    );
    expect(payroll.rows.find((row) => row.date === '2026-06-14').status).toBe('Before Joining');
    expect(payroll.rows.find((row) => row.date === '2026-06-15').status).toBe('Present');

    const currentMonth = calculatePayroll(
      { joining_date: '2026-06-15', basic_salary: 15000 },
      [{ attendance_date: '2026-09-03T00:00:00.000Z', status: 'Present' }],
      '2026-09',
      new Date(2026, 8, 3)
    );
    expect(currentMonth.rows.find((row) => row.date === '2026-09-03').status).toBe('Present');
    expect(currentMonth.rows.find((row) => row.date === '2026-09-04').status).toBe('Future');
  });

  it('pays Festival and Paid Leave as full days', () => {
    const payroll = calculatePayroll(
      { joining_date: '2026-09-01', basic_salary: 30000 },
      [
        { attendance_date: '2026-09-01', status: 'Festival' },
        { attendance_date: '2026-09-02', status: 'Paid Leave' },
        { attendance_date: '2026-09-03', status: 'Halfday' }
      ],
      '2026-09',
      new Date(2026, 8, 3)
    );
    expect(payroll.dailySalary).toBe(1000);
    expect(payroll.counts.Festival).toBe(1);
    expect(payroll.counts['Paid Leave']).toBe(1);
    expect(payroll.paidDays).toBe(2.5);
    expect(payroll.earnings).toBe(2500);
  });
});
