import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { formatDateOnly } from '../utils/dateOnly';

export default function SalaryDashboard({ employeeId, employee, employeeRoute = false }) {
  const now = new Date();
  const [month, setMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  const [payroll, setPayroll] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { const path = employeeRoute ? '/employees/me/payroll' : `/employees/${employeeId}/payroll`; api.get(`${path}?month=${month}`).then((response) => setPayroll(response.data)).catch((err) => setError(err.message || 'Unable to load earnings.')); }, [employeeId, employeeRoute, month]);
  const download = async () => { try { const path = employeeRoute ? '/employees/me/attendance/export' : `/employees/${employeeId}/attendance/export`; const response = await api.get(`${path}?month=${month}`, { responseType: 'blob' }); const url = URL.createObjectURL(response); const link = document.createElement('a'); link.href = url; link.download = `${employee?.employee_id || 'employee'}-${month}-attendance.csv`; link.click(); URL.revokeObjectURL(url); } catch (err) { setError(err.message || 'Unable to download attendance.'); } };
  if (error) return <p className="mt-3 text-sm text-rose-300">{error}</p>;
  if (!payroll) return <p className="mt-3 text-sm text-slate-400">Loading earnings...</p>;
  const labels = [['Present', 'Days Present'], ['Absent', 'Days Absent'], ['Halfday', 'Half Days'], ['WFH', 'WFH'], ['On Site Work', 'On Site Work'], ['Paid Sundays', 'Paid Sundays']];
  return <section className="mt-5 rounded-xl border border-slate-800 bg-slate-950 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-semibold">Monthly Earnings</h3><select value={month} onChange={(event) => setMonth(event.target.value)} className="cursor-pointer rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"><option value={month}>{new Date(`${month}-02T00:00:00`).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</option></select></div><div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3"><p><span className="text-slate-500">Basic Pay</span><br />₹{payroll.basicSalary.toFixed(2)}</p><p><span className="text-slate-500">Daily Pay</span><br />₹{payroll.dailySalary.toFixed(2)}</p>{labels.map(([key, label]) => <p key={key}><span className="text-slate-500">{label}</span><br />{payroll.counts[key] ?? 0}</p>)}<p><span className="text-slate-500">Total Paid Days</span><br />{payroll.paidDays.toFixed(2)}</p><p><span className="text-slate-500">Current Earnings</span><br /><b className="text-emerald-400">₹{payroll.earnings.toFixed(2)}</b></p><p><span className="text-slate-500">Updated Till</span><br />{payroll.updatedTillDisplay || 'Not started'}</p></div><button type="button" onClick={download} className="mt-4 cursor-pointer rounded-lg bg-cyan-600 px-3 py-2 text-sm font-semibold">Download Attendance</button></section>;
}
