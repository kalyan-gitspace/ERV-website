import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PublicLayout } from '../../layouts/PublicLayout';
import api from '../../services/api';
import { CareerApplicationModal } from '../../components/CareerApplicationModal';

function timeAgo(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return 'Posted just now';
  if (diff < 3600) return `Posted ${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `Posted ${Math.floor(diff / 3600)} hours ago`;
  if (diff < 172800) return 'Posted Yesterday';
  if (diff < 604800) return `Posted ${Math.floor(diff / 86400)} days ago`;
  if (diff < 2592000) return `Posted ${Math.floor(diff / 604800)} weeks ago`;
  if (diff < 31536000) return `Posted ${Math.floor(diff / 2592000)} months ago`;
  return `Posted ${Math.floor(diff / 31536000)} years ago`;
}

export function Careers() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadJobs = async () => {
  try {
    setLoading(true);

    const res = await api.get('/careers');

    console.log("CAREERS API RESPONSE");
    console.log(res);
    console.log("Is Array?", Array.isArray(res));

    const payload = Array.isArray(res) ? res : (res?.data ?? res);

    console.log("PAYLOAD");
    console.log(payload);

    setJobs(payload || []);
  } catch (err) {
      console.error('[careers] load failed', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
    const onUpdated = () => loadJobs();
    window.addEventListener('careers:updated', onUpdated);
    return () => window.removeEventListener('careers:updated', onUpdated);
  }, []);

  const [activeJob, setActiveJob] = useState(null);

  return (
    <PublicLayout>
      <section className="min-h-screen bg-[#000000] px-5 pt-32 pb-8 text-white sm:px-8 sm:pt-36 sm:pb-10 lg:px-10 lg:pt-40 lg:pb-12">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-3xl font-extrabold mb-4">Careers</h1>

          <div className="space-y-4">
            {loading ? (
              <div className="rounded-[12px] border border-white/10 bg-black px-6 py-8 text-center text-sm text-slate-400">Loading vacancies...</div>
            ) : jobs.length === 0 ? (
              <div className="rounded-[12px] border border-white/10 bg-black px-6 py-8 text-center text-sm text-slate-400">No vacancies currently available.</div>
            ) : (
              jobs.map((job) => (
                <div key={job.id} className="rounded-[12px] border border-white/10 bg-black">
                  <button
                    type="button"
                    onClick={() => navigate(`/careers/${job.id}`)}
                    className="w-full text-left px-6 py-5"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-bold">{job.title}</h2>
                        <div className="mt-1 text-sm text-slate-300">
                          <span>{job.location}</span>
                          <span className="mx-3">•</span>
                          <span>{job.experience}</span>
                        </div>
                        <div className="mt-3 text-sm text-slate-400">Package: {job.package || 'Not Disclosed'}</div>
                      </div>

                      <div className="flex flex-col items-end gap-3">
                        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${job.status === 'Open' ? 'bg-emerald-700 text-white' : 'bg-red-700 text-white'}`}>
                          {job.status?.toUpperCase()}
                        </div>
                        <div className="text-sm text-slate-400">{timeAgo(job.created_at)}</div>
                        {job.status === 'Open' && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setActiveJob(job); }}
                            className="mt-2 inline-block rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                          >
                            Apply Now
                          </button>
                        )}
                      </div>
                    </div>
                  </button>
                  <div className="border-t border-white/5" />
                </div>
              ))
            )}
          </div>
        </div>
      </section>
      {activeJob && (
        <CareerApplicationModal
          jobId={activeJob.id}
          jobTitle={activeJob.title}
          onClose={() => setActiveJob(null)}
        />
      )}
    </PublicLayout>
  );
}

export default Careers;
