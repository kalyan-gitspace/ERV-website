const paidValues = { Present: 1, WFH: 1, 'On Site Work': 1, Festival: 1, 'Paid Leave': 1, Halfday: 0.5, Absent: 0 };

const pad = (value) => String(value).padStart(2, '0');
const dateKey = (year, month, day) => `${year}-${pad(month)}-${pad(day)}`;
const displayDate = (date) => { const [year, month, day] = String(date).slice(0, 10).split('-'); return `${day}/${month}/${year}`; };
const dateOnly = (value) => {
  if (value instanceof Date) return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
  const match = String(value || '').match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : '';
};
const getDaysInMonth = (year, month) => new Date(year, month, 0).getDate();

export function calculatePayroll(employee, records, monthValue, now = new Date()) {
  const today = dateOnly(now);
  const selected = /^\d{4}-\d{2}$/.test(monthValue || '') ? monthValue : today.slice(0, 7);
  const [year, month] = selected.split('-').map(Number);
  const daysInMonth = getDaysInMonth(year, month);
  const currentMonth = selected === today.slice(0, 7);
  const throughDay = currentMonth ? Number(today.slice(8, 10)) : (selected < today.slice(0, 7) ? daysInMonth : 0);
  const joiningDate = dateOnly(employee.joining_date) || null;
  const recordMap = Object.fromEntries(records.map((record) => [dateOnly(record.attendance_date), record.status]));
  const rows = [];
  const counts = { Present: 0, Absent: 0, WFH: 0, Halfday: 0, 'On Site Work': 0, Festival: 0, 'Paid Leave': 0, 'Paid Sundays': 0 };
  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = dateKey(year, month, day);
    const weekday = new Date(year, month - 1, day).getDay();
    const beforeJoining = joiningDate && date < joiningDate;
    const future = day > throughDay;
    let status = beforeJoining ? 'Before Joining' : future ? 'Future' : weekday === 0 ? 'Paid Holiday' : (recordMap[date] || 'Not Updated');
    const value = beforeJoining || future ? 0 : status === 'Paid Holiday' ? 1 : (paidValues[status] ?? 0);
    if (counts[status] !== undefined) counts[status] += 1;
    if (status === 'Paid Holiday') counts['Paid Sundays'] += 1;
    rows.push({ date, displayDate: displayDate(date), day: new Date(year, month - 1, day).toLocaleDateString('en-IN', { weekday: 'long' }), status, dayValue: value });
  }
  const basicSalary = Number(employee.basic_salary || 0);
  const dailySalary = daysInMonth ? basicSalary / daysInMonth : 0;
  const paidDays = rows.reduce((total, row) => total + row.dayValue, 0);
  return { month: selected, daysInMonth, basicSalary, dailySalary, paidDays, earnings: paidDays * dailySalary, updatedTill: throughDay ? dateKey(year, month, throughDay) : null, updatedTillDisplay: throughDay ? displayDate(dateKey(year, month, throughDay)) : null, counts, rows };
}

export { dateOnly, displayDate, getDaysInMonth };
