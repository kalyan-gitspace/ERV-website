import React, { useEffect, useState } from 'react';
import { Download, FileCheck, RefreshCw, Search, Trash2, X } from 'lucide-react';
import api, { resolveImageUrl } from '../../services/api';
import AttendanceCalendar from '../../components/AttendanceCalendar';
import SalaryDashboard from '../../components/SalaryDashboard';
import { formatDateOnly } from '../../utils/dateOnly';

const emptyForm = {
  fullName: '',
  password: '',
  email: '',
  phone: '',
  role: '',
  department: '',
  gender: '',
  joiningDate: '',
  basicSalary: '',
  status: 'Active'
};

const proofAccept = '.pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,application/pdf,image/jpeg,image/png,image/webp,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const statuses = ['Present', 'Absent', 'WFH', 'Halfday', 'On Site Work'];

function Avatar({ employee }) {
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-800 text-sm font-bold text-slate-500">
      {employee?.full_name?.slice(0, 1)?.toUpperCase() || '?'}
      {employee?.profile_picture && (
        <img src={resolveImageUrl(employee.profile_picture)} alt="" className="relative -mt-full h-full w-full object-cover" onError={(event) => { event.currentTarget.style.display = 'none'; }} />
      )}
    </div>
  );
}

export default function EmployeesAdmin() {
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [files, setFiles] = useState({ profilePicture: null, idProof: null });
  const [preview, setPreview] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [nextId, setNextId] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [attendanceForm, setAttendanceForm] = useState({ date: '', status: 'Present' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const [list, id] = await Promise.all([
        api.get(`/employees?search=${encodeURIComponent(search)}`),
        api.get('/employees/next-id')
      ]);
      setEmployees(list.data || []);
      setNextId(id.data || '');
    } catch (err) {
      setError(err.message || 'Unable to load employees.');
    }
  };

  useEffect(() => {
    load();
  }, [search]);

  const chooseFile = (field, file) => {
    if (!file) return;
    const allowed = field === 'profilePicture' ? ['image/jpeg', 'image/png', 'image/webp'] : ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/octet-stream'];
    const limit = field === 'profilePicture' ? 5 : 10;
    if (!allowed.includes(file.type) || file.size > limit * 1024 * 1024) {
      setError(field === 'profilePicture' ? 'Profile picture must be JPG, JPEG, or WEBP up to 5MB.' : 'ID proof must be PDF, JPG, JPEG, PNG, WEBP, DOC, or DOCX up to 10MB.');
      return;
    }
    setFiles((current) => ({ ...current, [field]: file }));
    setError('');
    if (field === 'profilePicture') setPreview(URL.createObjectURL(file));
  };

  const clearFiles = () => {
    setFiles({ profilePicture: null, idProof: null });
    if (preview) URL.revokeObjectURL(preview);
    setPreview('');
  };

  const save = async (event) => {
    event.preventDefault();
    if (!editingId && (!form.fullName || !form.password || form.password.length < 8)) {
      setError('Full name and an initial password of at least 8 characters are required.');
      return;
    }
    setSaving(true);
    setError('');
    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value) data.append(key, value);
    });
    if (files.profilePicture) data.append('profilePicture', files.profilePicture, files.profilePicture.name);
    if (files.idProof) data.append('idProof', files.idProof, files.idProof.name);
    try {
      const response = await api[editingId ? 'put' : 'post'](editingId ? `/employees/${editingId}` : '/employees', data);
      const wasEditing = Boolean(editingId);
      setForm(emptyForm);
      clearFiles();
      setEditingId(null);
      await load();
      if (wasEditing) setSelected(response.data);
    } catch (err) {
      console.error('[employee-admin] save failed:', err);
      setError(err.message || 'Unable to save employee.');
    } finally {
      setSaving(false);
    }
  };

  const openProfile = async (employee) => {
    try {
      const [profile, records] = await Promise.all([
        api.get(`/employees/${employee.id}`),
        api.get(`/employees/${employee.id}/attendance`)
      ]);
      setSelected(profile.data);
      setAttendance(records.data || []);
      setAttendanceForm({ date: '', status: 'Present' });
    } catch (err) {
      setError(err.message || 'Unable to load employee profile.');
    }
  };

  const edit = (employee) => {
    setEditingId(employee.id);
    setForm({
      fullName: employee.full_name,
      password: '',
      email: employee.email || '',
      phone: employee.phone || '',
      role: employee.role || '',
      department: employee.department || '',
      gender: employee.gender || '',
      joiningDate: employee.joining_date?.slice(0, 10) || '',
      basicSalary: employee.basic_salary || '',
      status: employee.status || 'Active'
    });
    clearFiles();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateStatus = async (status) => {
    try {
      const data = new FormData();
      data.append('status', status);
      const response = await api.put(`/employees/${selected.id}`, data);
      setSelected(response.data);
      await load();
    } catch (err) {
      setError(err.message || 'Unable to update status.');
    }
  };

  const resetPassword = async () => {
    const password = prompt('Enter a new password (8+ characters):');
    if (password) {
      try {
        await api.post(`/employees/${selected.id}/reset-password`, { password });
      } catch (err) {
        setError(err.message || 'Unable to reset password.');
      }
    }
  };

  const remove = async () => {
    if (!confirm(`Remove ${selected.full_name}'s profile? Employee ID ${selected.employee_id} remains permanently reserved.`)) return;
    try {
      await api.delete(`/employees/${selected.id}`);
      setSelected(null);
      await load();
    } catch (err) {
      setError(err.message || 'Unable to remove employee.');
    }
  };

  const saveAttendance = async () => {
    if (!attendanceForm.date || !selected) return;
    try {
      const response = await api.post('/employees/attendance', {
        employeeId: selected.id,
        ...attendanceForm
      });
      if (response.data) {
        setAttendance((current) => [response.data, ...current.filter((row) => String(row.attendance_date).slice(0, 10) !== attendanceForm.date)]);
      } else {
        setError('Attendance date must be between joining date and today.');
      }
    } catch (err) {
      setError(err.message || 'Unable to save attendance.');
    }
  };

  const downloadProof = async () => {
    try {
      const response = await api.get(`/employees/${selected.id}/id-proof`, { responseType: 'blob' });
      const url = URL.createObjectURL(response);
      const link = document.createElement('a');
      link.href = url;
      link.download = selected.id_proof_name || 'employee-id-proof';
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || 'Unable to download ID proof.');
    }
  };

  const statusClass = (status) => status === 'Resigned' ? 'text-amber-400' : status === 'Inactive' ? 'text-rose-400' : 'text-emerald-400';

  return (
    <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
      <h2 className="text-lg font-bold">Employees</h2>
      {error && <p className="mt-3 rounded-lg bg-rose-500/10 p-3 text-sm text-rose-300">{error}</p>}

      <form onSubmit={save} className="mt-5 grid gap-3 rounded-xl border border-slate-800 bg-slate-950 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <input readOnly value={nextId} placeholder="Employee ID" className="cursor-not-allowed rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-cyan-300" />
        {[
          ['fullName', 'Full name'],
          ['password', 'Initial password'],
          ['email', 'Email'],
          ['phone', 'Phone'],
          ['role', 'Role/designation'],
          ['department', 'Department'],
          ['joiningDate', 'Joining date'],
          ['basicSalary', 'Basic Salary (INR)']
        ].map(([key, label]) => (
          <input
            key={key}
            required={['fullName', 'password'].includes(key) && !editingId}
            type={key === 'password' ? 'password' : key === 'joiningDate' ? 'date' : key === 'basicSalary' ? 'number' : 'text'}
            placeholder={label}
            value={form[key]}
            max={key === 'joiningDate' ? new Date().toISOString().slice(0, 10) : undefined}
            onChange={(event) => setForm({ ...form, [key]: event.target.value })}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          />
        ))}

        <select value={form.gender} onChange={(event) => setForm({ ...form, gender: event.target.value })} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm">
          <option value="">Select Gender</option>
          <option>Male</option>
          <option>Female</option>
        </select>

        <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm">
          <option>Active</option>
          <option>Inactive</option>
          <option>Resigned</option>
        </select>

        <label className="cursor-pointer rounded-lg border border-dashed border-slate-700 p-2 text-sm text-slate-400">
          Profile picture
          <input type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={(event) => chooseFile('profilePicture', event.target.files?.[0])} className="hidden" />
          {files.profilePicture && <span className="mt-2 block break-all text-xs text-emerald-400"><FileCheck className="mr-1 inline h-4 w-4" />{files.profilePicture.name}</span>}
          {preview && <img src={preview} alt="Selected profile preview" className="mt-2 h-12 w-12 rounded-full object-cover" />}
        </label>

        <label className="cursor-pointer rounded-lg border border-dashed border-slate-700 p-2 text-sm text-slate-400">
          ID proof (PDF/JPG/DOC)
          <input type="file" accept={proofAccept} onChange={(event) => chooseFile('idProof', event.target.files?.[0])} className="hidden" />
          {files.idProof && <span className="mt-2 block break-all text-xs text-emerald-400"><FileCheck className="mr-1 inline h-4 w-4" />{files.idProof.name}</span>}
        </label>

        <button type="submit" disabled={saving} className="cursor-pointer rounded-lg bg-cyan-600 px-3 py-2 text-sm font-semibold hover:bg-cyan-700 disabled:opacity-50">
          {saving ? 'Saving...' : editingId ? 'Update Employee' : 'Create Employee'}
        </button>
      </form>

      <div className="mt-8 border-t border-slate-800 pt-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-slate-200">Employee List</h3>
          <div className="relative flex items-center gap-2">
            <Search className="h-4 w-4 text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search employees" className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
            <button type="button" onClick={load} className="cursor-pointer rounded-lg bg-slate-700 p-2">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="mt-3 space-y-2">
          {employees.map((employee) => (
            <button
              type="button"
              key={employee.id}
              onClick={() => openProfile(employee)}
              className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950 p-4 text-left hover:border-cyan-500/50"
            >
              <span className="flex min-w-0 items-center gap-3">
                <Avatar employee={employee} />
                <span className="min-w-0">
                  <b className="block truncate">{employee.full_name}</b>
                  <span className="block text-sm text-slate-400">{employee.employee_id}</span>
                  <span className="block truncate text-xs text-slate-500">
                    {employee.role || 'No role'}
                    {employee.department ? ` • ${employee.department}` : ''}
                  </span>
                </span>
              </span>
              <span className={`shrink-0 text-xs ${statusClass(employee.status)}`}>{employee.status || 'Active'}</span>
            </button>
          ))}
        </div>
      </div>

      {selected && (
        <section className="mt-6 rounded-xl border border-cyan-500/30 bg-slate-950 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <Avatar employee={selected} />
              <div>
                <h3 className="text-xl font-semibold">{selected.full_name}</h3>
                <p className="text-sm text-slate-400">{selected.gender || 'Not specified'}</p>
              </div>
            </div>
            <button type="button" onClick={() => setSelected(null)} className="cursor-pointer text-slate-400">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
            <p><span className="text-slate-500">Employee ID</span><br />{selected.employee_id}</p>
            <p><span className="text-slate-500">Status</span><br /><b className={statusClass(selected.status)}>{selected.status || 'Active'}</b></p>
            <p><span className="text-slate-500">Email</span><br />{selected.email || 'Not provided'}</p>
            <p><span className="text-slate-500">Phone</span><br />{selected.phone || 'Not provided'}</p>
            <p><span className="text-slate-500">Role</span><br />{selected.role || 'Not provided'}</p>
            <p><span className="text-slate-500">Department</span><br />{selected.department || 'Not provided'}</p>
            <p><span className="text-slate-500">Joining date</span><br />{formatDateOnly(selected.joining_date)}</p>
            <p><span className="text-slate-500">Basic salary</span><br />₹{Number(selected.basic_salary || 0).toFixed(2)}</p>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" onClick={() => edit(selected)} className="cursor-pointer rounded bg-slate-700 px-3 py-2 text-sm">
              Edit profile
            </button>
            <button type="button" onClick={() => updateStatus('Active')} className="cursor-pointer rounded bg-emerald-700 px-3 py-2 text-sm">
              Mark Active
            </button>
            <button type="button" onClick={() => updateStatus('Inactive')} className="cursor-pointer rounded bg-slate-700 px-3 py-2 text-sm">
              Mark Inactive
            </button>
            <button type="button" onClick={() => updateStatus('Resigned')} className="cursor-pointer rounded bg-amber-700 px-3 py-2 text-sm">
              Mark Resigned
            </button>
            <button type="button" onClick={resetPassword} className="cursor-pointer rounded bg-slate-600 px-3 py-2 text-sm">
              Reset Password
            </button>
            {selected.id_proof_name && (
              <button type="button" onClick={downloadProof} className="cursor-pointer rounded bg-slate-600 px-3 py-2 text-sm">
                <Download className="mr-1 inline h-4 w-4" /> ID Proof
              </button>
            )}
            <button type="button" onClick={remove} className="cursor-pointer rounded bg-rose-700 px-3 py-2 text-sm">
              <Trash2 className="mr-1 inline h-4 w-4" /> Delete
            </button>
          </div>

          <div className="mt-5 border-t border-slate-700 pt-5">
            <h4 className="text-sm font-semibold">Attendance & Salary</h4>
            
            <AttendanceCalendar
              records={attendance}
              joiningDate={selected.joining_date}
              editable
              onSelectDate={(date, status) => setAttendanceForm({ date, status: status || 'Present' })}
            />

            <div className="mt-4 flex gap-2">
              <input
                type="date"
                min={selected.joining_date?.slice(0, 10)}
                max={new Date().toISOString().slice(0, 10)}
                value={attendanceForm.date}
                onChange={(event) => setAttendanceForm({ ...attendanceForm, date: event.target.value })}
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
              />
              <select value={attendanceForm.status} onChange={(event) => setAttendanceForm({ ...attendanceForm, status: event.target.value })} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm">
                {statuses.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
              <button type="button" onClick={saveAttendance} className="cursor-pointer rounded-lg bg-emerald-600 px-3 py-2 text-sm">
                Save
              </button>
            </div>

            <SalaryDashboard employeeId={selected.id} employee={selected} />
          </div>
        </section>
      )}
    </div>
  );
}
