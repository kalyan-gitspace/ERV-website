import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PublicLayout } from '../../layouts/PublicLayout';
import api from '../../services/api';
import { CareerApplicationModal } from '../../components/CareerApplicationModal';

function Box({ title, children }) {
  return (
    <div className="rounded-[12px] border border-white/10 bg-black p-4">
      <h3 className="font-semibold mb-2">{title}</h3>
      <div className="text-sm text-slate-200">{children}</div>
    </div>
  );
}

export function CareerDetail() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/careers/${id}`);
        setJob(res.data || res || null);
      } catch (err) {
        console.error('[career] load', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <PublicLayout>
        <section className="min-h-screen bg-[#000000] px-5 py-8 text-white">
          <div className="mx-auto max-w-6xl space-y-6">Loading job...</div>
        </section>
      </PublicLayout>
    );
  }

  if (!job) {
    return (
      <PublicLayout>
        <section className="min-h-screen bg-[#000000] px-5 py-8 text-white">
          <div className="mx-auto max-w-6xl space-y-6">
            Job not found.</div>
        </section>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <section className="min-h-screen bg-[#000000] px-5 pt-32 pb-8 text-white sm:px-8 sm:pt-36 sm:pb-10 lg:px-10 lg:pt-40 lg:pb-12">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h1 className="text-3xl font-extrabold">{job.title}</h1>
              <div className="mt-2 text-sm text-slate-300">{job.location} • {job.experience} • {job.employment_type}</div>
            </div>

            <div className="text-right">
              <div className={`px-3 py-1 rounded-full text-sm font-semibold ${job.status === 'Open' ? 'bg-emerald-700 text-white' : 'bg-red-700 text-white'}`}>
                {job.status}
              </div>
              {job.status === 'Open' && (
                <button
                  type="button"
                  onClick={() => setShowApplyModal(true)}
                  className="mt-3 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  Apply Now
                </button>
              )}
            </div>
          </div>

          <div className="grid gap-6">
            <div className="flex gap-4">
              <div className="w-1/2 text-sm text-slate-400">Package</div>
              <div className="w-1/2 text-sm">{job.package || 'Not Disclosed'}</div>
            </div>
            <div className="flex gap-4">
              <div className="w-1/2 text-sm text-slate-400">Posted</div>
              <div className="w-1/2 text-sm">{new Date(job.created_at).toLocaleString()}</div>
            </div>

            <Box title="Job Description">{job.description}</Box>
            <Box title="Key Responsibilities">{(job.responsibilities || []).join('\n\n')}</Box>
            <Box title="Skills Required">{(job.requirements || []).join(', ')}</Box>
          </div>
        </div>
      </section>
      {showApplyModal && (
        <CareerApplicationModal
          jobId={job.id}
          jobTitle={job.title}
          onClose={() => setShowApplyModal(false)}
        />
      )}
    </PublicLayout>
  );
}

export default CareerDetail;
