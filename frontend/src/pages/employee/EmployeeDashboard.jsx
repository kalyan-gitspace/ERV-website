import React, { useEffect, useState } from 'react';
import { Camera, LockKeyhole, LogOut } from 'lucide-react';
import { useEmployeeAuth } from '../../context/EmployeeAuthContext';
import AttendanceCalendar from '../../components/AttendanceCalendar';
import SalaryDashboard from '../../components/SalaryDashboard';
import api, { resolveImageUrl } from '../../services/api';
import { formatDateOnly } from '../../utils/dateOnly';

const formatTime = (value) => {
  if (!value) return 'NA';
  const [hour, minute] = String(value).slice(0, 5).split(':').map(Number);
  return `${String(hour % 12 || 12).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`;
};

export default function EmployeeDashboard() {
  const { employee, logout, setEmployee } = useEmployeeAuth();
  const [attendance, setAttendance] = useState([]);
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get('/employees/me/attendance')
      .then((response) => setAttendance(response.data || []))
      .catch(() => setMessage('Unable to load attendance.'));
  }, []);

  const picture = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const data = new FormData();
    data.append('profilePicture', file, file.name);
    try {
      const response = await api.post('/employees/me/picture', data);
      setEmployee(response.data);
      setMessage('Profile picture updated.');
    } catch (error) {
      setMessage(error.message || 'Upload failed.');
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      setMessage('New password and confirmation do not match.');
      return;
    }
    try {
      await api.post('/employees/me/password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setMessage('Password updated successfully.');
    } catch (error) {
      setMessage(error.message || 'Password update failed.');
    }
  };

  const statusClass = employee?.status === 'Resigned' ? 'text-amber-400' : employee?.is_active ? 'text-emerald-400' : 'text-rose-400';

  return (
    <main className="min-h-screen bg-slate-950 p-4 text-slate-100 sm:p-8">
      <div className="mx-auto max-w-5xl">
        <header className="flex items-center justify-between border-b border-slate-800 pb-5">
          <div>
            <p className="text-sm text-cyan-400">ERV Employee Portal</p>
            <h1 className="text-2xl font-bold">{employee?.full_name}</h1>
            <p className="text-sm text-slate-400">{employee?.gender || 'Not specified'}</p>
          </div>
          <button onClick={logout} className="flex cursor-pointer items-center gap-2 rounded-lg bg-rose-600 px-3 py-2 text-sm">
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </header>

        {message && (
          <div className="mt-5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-3 text-sm text-cyan-200">
            {message}
          </div>
        )}

        <section className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center">
            <div className="mx-auto h-32 w-32 overflow-hidden rounded-full border border-slate-700 bg-slate-950">
              {employee?.profile_picture && (
                <img src={resolveImageUrl(employee.profile_picture)} alt="Profile" className="h-full w-full object-cover" />
              )}
            </div>
            <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-slate-700 px-3 py-2 text-sm">
              <Camera className="h-4 w-4" />
              Update picture
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={picture} className="hidden" />
            </label>
            <div className="mt-5 space-y-3 text-left text-sm">
              <p>
                <span className="text-slate-400">Employee ID</span>
                <br />
                {employee?.employee_id}
              </p>
              <p>
                <span className="text-slate-400">Role</span>
                <br />
                {employee?.role || 'Not specified'}
              </p>
              <p>
                <span className="text-slate-400">Department</span>
                <br />
                {employee?.department || 'Not specified'}
              </p>
              <p>
                <span className="text-slate-400">Status</span>
                <br />
                <span className={statusClass}>{employee?.status || 'Active'}</span>
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-lg font-semibold">Profile</h2>
              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <p>
                  <span className="text-slate-400">Email</span>
                  <br />
                  {employee?.email}
                </p>
                <p>
                  <span className="text-slate-400">Phone</span>
                  <br />
                  {employee?.phone}
                </p>
                <p>
                  <span className="text-slate-400">Joining Date</span>
                  <br />
                  {formatDateOnly(employee?.joining_date)}
                </p>
                <p>
                  <span className="text-slate-400">Basic Salary</span>
                  <br />
                  ₹{Number(employee?.basic_salary || 0).toFixed(2)}
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-lg font-semibold">Change Password</h2>
              <form onSubmit={changePassword} className="mt-4 space-y-3">
                <input
                  required
                  type="password"
                  placeholder="Current password"
                  value={passwords.currentPassword}
                  onChange={(event) => setPasswords({ ...passwords, currentPassword: event.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3"
                />
                <input
                  required
                  minLength="8"
                  type="password"
                  placeholder="New password (8+ characters)"
                  value={passwords.newPassword}
                  onChange={(event) => setPasswords({ ...passwords, newPassword: event.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3"
                />
                <input
                  required
                  type="password"
                  placeholder="Confirm new password"
                  value={passwords.confirmPassword}
                  onChange={(event) => setPasswords({ ...passwords, confirmPassword: event.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3"
                />
                <button type="submit" className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-cyan-600 px-4 py-3 font-semibold hover:bg-cyan-700">
                  <LockKeyhole className="h-4 w-4" />
                  Update Password
                </button>
              </form>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-lg font-semibold">Attendance Calendar</h2>
              <AttendanceCalendar records={attendance} joiningDate={employee?.joining_date} />
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[620px] text-left text-xs">
                  <thead className="text-slate-400"><tr><th className="p-2">Date</th><th className="p-2">Status</th><th className="p-2">Login Time</th><th className="p-2">Logout Time</th><th className="p-2">Work Hours</th></tr></thead>
                  <tbody>{attendance.map((record) => <tr key={record.id || record.attendance_date} className="border-t border-slate-800"><td className="p-2">{formatDateOnly(record.attendance_date)}</td><td className="p-2">{record.status === 'Halfday' ? 'Half Day' : record.status}</td><td className="p-2">{formatTime(record.login_time)}</td><td className="p-2">{formatTime(record.logout_time)}</td><td className="p-2">{record.work_hours?.slice(0, 5) || 'NA'}</td></tr>)}</tbody>
                </table>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-lg font-semibold">Salary & Earnings</h2>
              <SalaryDashboard employeeRoute employee={employee} />
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
