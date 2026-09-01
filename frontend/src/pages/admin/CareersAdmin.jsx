import React, { useEffect, useState } from 'react';
import { Download, Plus, Edit, RefreshCw, Trash2 } from 'lucide-react';
import api, { downloadCareerResume } from '../../services/api';

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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [applications, setApplications] = useState([]);
  const [applicationsLoading, setApplicationsLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);

  const loadApplications = async () => {
    try {
      setApplicationsLoading(true);
      const res = await api.get('/careers/applications');
      const payload = Array.isArray(res) ? res : (res?.data ?? []);
      setApplications(payload);
    } catch (err) {
      setError(err.message || 'Unable to load applications.');
    } finally {
      setApplicationsLoading(false);
    }
  };

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

  useEffect(() => {
    load();
    loadApplications();
  }, []);

  const handleDownload = async (application) => {
    try {
      setDownloadingId(application.id);
      const blob = await downloadCareerResume(application.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = application.resume_original_name || 'resume';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || 'Unable to download resume.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDeleteApplication = async (id) => {
    if (!confirm('Are you sure you want to delete this application?')) return;
    try {
      await api.delete(`/careers/applications/${id}`);
      setApplications((current) => current.filter((application) => application.id !== id));
    } catch (err) {
      setError(err.message || 'Unable to delete application.');
    }
  };

  const handleChange = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const handlePost = async () => {
    if (saving) return;
    setSaving(true);
    setError('');
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
      setError(err.message || 'Unable to save career listing.');
    } finally {
      setSaving(false);
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
    } catch (err) { console.error(err); setError(err.message || 'Unable to delete career listing.'); }
  };

  const toggleStatus = async (job) => {
    try {
      if (job.status === 'Open') await api.patch(`/careers/${job.id}/close`);
      else await api.patch(`/careers/${job.id}/reopen`);
      window.dispatchEvent(new Event('careers:updated'));
      load();
    } catch (err) { console.error(err); setError(err.message || 'Unable to update career status.'); }
  };

  return (
    <div className="mt-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2"><Plus className="h-5 w-5"/> Careers</h2>
          <button type="button" onClick={() => { setForm(emptyForm()); setEditingId(null); window.scrollTo({ top: 0 }); }} className="rounded-md bg-emerald-600 px-3 py-1 text-sm text-white">+ Post a Job</button>
        </div>

        {error && <div className="mt-3 rounded-md border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-300">{error}</div>}

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

          <textarea value={form.description} onChange={(e)=>handleChange('description', e.target.value)} placeholder="Job Description" rows={10} className="min-h-87.5 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200" />
          <textarea value={form.responsibilities} onChange={(e)=>handleChange('responsibilities', e.target.value)} placeholder="Key Responsibilities (one per line)" rows={10} className="h-87.5 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200" />
          <textarea value={form.requirements} onChange={(e)=>handleChange('requirements', e.target.value)} placeholder="Skills Required (one per line)" rows={10} className="h-87.5 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200" />

          <div className="flex items-center gap-3">
            <button type="button" onClick={handlePost} disabled={saving} className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">{saving ? 'Saving...' : editingId ? 'Save Changes' : 'Post Job'}</button>
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
                    <button type="button" onClick={()=>toggleStatus(job)} className="rounded-md bg-slate-700 px-3 py-1 text-sm text-white" title={job.status === 'Open' ? 'Disable career' : 'Enable career'}>{job.status === 'Open' ? 'Disable' : 'Enable'}</button>
                    <button type="button" onClick={()=>handleEdit(job)} className="rounded-md bg-slate-700 px-3 py-1 text-sm text-white" title="Edit career"><Edit className="h-4 w-4"/></button>
                    <button type="button" onClick={()=>handleDelete(job.id)} className="rounded-md bg-rose-600 px-3 py-1 text-sm text-white" title="Delete career"><Trash2 className="h-4 w-4"/></button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 flex items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-slate-200">Responses ({applications.length})</h3>
            <button
              type="button"
              onClick={loadApplications}
              disabled={applicationsLoading}
              className="inline-flex items-center gap-2 rounded-md bg-slate-700 px-3 py-1.5 text-sm text-white disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${applicationsLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
          {applicationsLoading ? (
            <div className="rounded-md border border-slate-800 bg-slate-950 p-4 text-sm text-slate-400">Loading responses...</div>
          ) : applications.length === 0 ? (
            <div className="rounded-md border border-slate-800 bg-slate-950 p-4 text-sm text-slate-400">No applications received yet.</div>
          ) : (
            <div className="space-y-3">
              {applications.map((application) => (
                <div key={application.id} className="flex flex-col gap-4 rounded-md border border-slate-800 bg-slate-950 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="break-words font-semibold text-slate-100">{application.full_name}</div>
                    <div className="mt-1 break-words text-sm text-slate-300">Applied for: {application.job_title}</div>
                    <div className="mt-1 text-sm text-slate-400">Applied on: {new Date(application.created_at).toLocaleString()}</div>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button type="button" onClick={() => handleDownload(application)} disabled={downloadingId === application.id} className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60">
                      <Download className="h-4 w-4" />
                      {downloadingId === application.id ? 'Downloading...' : 'Download Resume'}
                    </button>
                    <button type="button" onClick={() => handleDeleteApplication(application.id)} className="rounded-md bg-rose-600 px-3 py-2 text-sm font-semibold text-white">
                      <Trash2 className="h-4 w-4" />
                    </button>
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
