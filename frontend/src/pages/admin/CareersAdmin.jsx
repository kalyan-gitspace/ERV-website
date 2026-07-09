import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import api from '../../services/api';

function emptyForm() {
  return {
    title: '',
    department: '',
    experience: '',
    location: '',
    package: '',
    employment_type: 'Full Time',
    description: '',
    responsibilities: '',
    requirements: ''
  };
}

export default function CareersAdmin() {
  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState(emptyForm());
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get('/careers?showAll=true');
      // api returns normalized data (response.data) or wrapped object
      const payload = Array.isArray(res) ? res : (res?.data ?? res);
      console.log('GET /careers?showAll=true response:', payload);
      setJobs(payload || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleChange = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const handlePost = async () => {
    try {
      const payload = {
        ...form,
        package: form.package || 'Not Disclosed',
        responsibilities: form.responsibilities ? form.responsibilities.split('\n').map(s=>s.trim()).filter(Boolean) : [],
        requirements: form.requirements ? form.requirements.split('\n').map(s=>s.trim()).filter(Boolean) : []
      };

      if (editingId) {
        const putRes = await api.put(`/careers/${editingId}`, payload);
        console.log('PUT /careers response:', putRes);
        // Update local state optimistically
        if (putRes?.vacancy) {
          setJobs((s) => s.map((j) => (j.id === editingId ? putRes.vacancy : j)));
        }
      } else {
        const postRes = await api.post('/careers', payload);
        console.log('POST /careers response:', postRes);
        if (postRes?.vacancy) {
          setJobs((s) => [postRes.vacancy, ...s]);
        }
      }

      setForm(emptyForm());
      setEditingId(null);
      window.dispatchEvent(new Event('careers:updated'));
      // Refresh from server to ensure consistency
      load();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (job) => {
    setEditingId(job.id);
    setForm({
      title: job.title || '',
      department: job.department || '',
      experience: job.experience || '',
      location: job.location || '',
      package: job.package || '',
      employment_type: job.employment_type || 'Full Time',
      description: job.description || '',
      responsibilities: (job.responsibilities || []).join('\n'),
      requirements: (job.requirements || []).join('\n')
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this job permanently?')) return;
    try {
      await api.delete(`/careers/${id}`);
      window.dispatchEvent(new Event('careers:updated'));
      load();
    } catch (err) { console.error(err); }
  };

  const toggleStatus = async (job) => {
    try {
      if (job.status === 'Open') await api.patch(`/careers/${job.id}/close`);
      else await api.patch(`/careers/${job.id}/reopen`);
      window.dispatchEvent(new Event('careers:updated'));
      load();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="mt-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2"><Plus className="h-5 w-5"/> Careers</h2>
          <button onClick={() => { setForm(emptyForm()); setEditingId(null); window.scrollTo({ top: 0 }); }} className="rounded-md bg-emerald-600 px-3 py-1 text-sm text-white">+ Post a Job</button>
        </div>

        <div className="mt-4 grid gap-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input value={form.title} onChange={(e)=>handleChange('title', e.target.value)} placeholder="Job Title" className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-slate-200" />
            <input value={form.department} onChange={(e)=>handleChange('department', e.target.value)} placeholder="Department" className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-slate-200" />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <input value={form.location} onChange={(e)=>handleChange('location', e.target.value)} placeholder="Location" className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-slate-200" />
            <input value={form.experience} onChange={(e)=>handleChange('experience', e.target.value)} placeholder="Experience" className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-slate-200" />
            <input value={form.package} onChange={(e)=>handleChange('package', e.target.value)} placeholder="Package" className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-slate-200" />
          </div>
          <div>
            <label className="text-sm text-slate-400">Job Type</label>
            <select value={form.employment_type} onChange={(e)=>handleChange('employment_type', e.target.value)} className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-slate-200">
              <option>Full Time</option>
              <option>Part Time</option>
              <option>Contract</option>
              <option>Internship</option>
            </select>
          </div>

          <textarea value={form.description} onChange={(e)=>handleChange('description', e.target.value)} placeholder="Job Description" rows={10} className="min-h-[350px] w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200" />
          <textarea value={form.responsibilities} onChange={(e)=>handleChange('responsibilities', e.target.value)} placeholder="Key Responsibilities (one per line)" rows={10} className="h-[350px] w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200" />
          <textarea value={form.requirements} onChange={(e)=>handleChange('requirements', e.target.value)} placeholder="Skills Required (one per line)" rows={10} className="h-[350px] w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200" />

          <div className="flex items-center gap-3">
            <button onClick={handlePost} className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">{editingId ? 'Save Changes' : 'Post Job'}</button>
          </div>

          <h3 className="mt-6 text-sm font-bold text-slate-200">Posted Jobs</h3>
          {loading ? (
            <div className="rounded-md border border-slate-800 bg-slate-950 p-4 text-sm text-slate-400">Loading...</div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <div key={job.id} className="rounded-md border border-slate-800 bg-slate-950 p-3 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-100">{job.title}</div>
                    <div className="text-sm text-slate-400">{job.location} • {job.experience}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={()=>toggleStatus(job)} className="rounded-md bg-slate-700 px-3 py-1 text-sm text-white">{job.status === 'Open' ? 'Disable' : 'Enable'}</button>
                    <button onClick={()=>handleEdit(job)} className="rounded-md bg-slate-700 px-3 py-1 text-sm text-white"><Edit className="h-4 w-4"/></button>
                    <button onClick={()=>handleDelete(job.id)} className="rounded-md bg-rose-600 px-3 py-1 text-sm text-white"><Trash2 className="h-4 w-4"/></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
