import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '../services/api';

const ACCEPTED_FILE_TYPES = '.pdf,.doc,.docx';

export function CareerApplicationModal({ jobId, jobTitle, onClose }) {
  const [submissionStatus, setSubmissionStatus] = useState({ success: '', error: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isValid }
  } = useForm({
    mode: 'onChange',
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      noticePeriod: '',
      totalExperience: '',
      message: ''
    }
  });

  const resumeFile = watch('resume');
  const hasResume = resumeFile && resumeFile.length > 0;
  const submitDisabled = !isValid || !hasResume || isSubmitting;

  const onSubmit = async (values) => {
    setSubmissionStatus({ success: '', error: '' });
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('fullName', values.fullName.trim());
    formData.append('email', values.email.trim());
    formData.append('phone', values.phone.trim());
    formData.append('noticePeriod', values.noticePeriod.trim());
    formData.append('totalExperience', values.totalExperience.trim());
    formData.append('message', values.message.trim());
    formData.append('resume', resumeFile[0]);

    try {
      const res = await api.post(`/careers/${jobId}/apply`, formData);
      setSubmissionStatus({
        success: res.message || 'Application submitted successfully. Our recruitment team will review your profile and contact you if shortlisted.',
        error: ''
      });
      reset();
    } catch (error) {
      setSubmissionStatus({
        success: '',
        error: error?.message || 'Failed to submit application. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="relative max-h-[calc(100vh-4rem)] w-full max-w-3xl overflow-y-auto rounded-[24px] border border-white/10 bg-[#020202] p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-white/10"
        >
          Close
        </button>

        <div className="space-y-4">
          <div>
            <div className="text-sm uppercase tracking-[0.3em] text-emerald-400">Apply for job</div>
            <h2 className="mt-2 text-2xl font-bold text-white">{jobTitle}</h2>
            <p className="mt-2 text-sm text-slate-400">
              All fields are mandatory. Resume upload must be PDF, DOC, or DOCX.
            </p>
          </div>

          {submissionStatus.success ? (
            <div className="rounded-2xl border border-emerald-600/40 bg-emerald-600/10 p-4 text-sm text-emerald-100">
              <p className="font-semibold">Application submitted successfully.</p>
              <p className="mt-2">
                Our recruitment team will review your profile and contact you if shortlisted.
              </p>
            </div>
          ) : null}

          {submissionStatus.error ? (
            <div className="rounded-2xl border border-rose-600/40 bg-rose-600/10 p-4 text-sm text-rose-100">
              {submissionStatus.error}
            </div>
          ) : null}

          <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-200">
                <span>Full Name *</span>
                <input
                  type="text"
                  {...register('fullName', { required: 'Full Name is required' })}
                  className="w-full rounded-2xl border border-white/10 bg-[#050505] px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-500"
                />
                {errors.fullName && <span className="text-rose-300">{errors.fullName.message}</span>}
              </label>

              <label className="space-y-2 text-sm text-slate-200">
                <span>Email Address *</span>
                <input
                  type="email"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'Enter a valid email address'
                    }
                  })}
                  className="w-full rounded-2xl border border-white/10 bg-[#050505] px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-500"
                />
                {errors.email && <span className="text-rose-300">{errors.email.message}</span>}
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-200">
                <span>Phone Number *</span>
                <input
                  type="tel"
                  {...register('phone', { required: 'Phone Number is required' })}
                  className="w-full rounded-2xl border border-white/10 bg-[#050505] px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-500"
                />
                {errors.phone && <span className="text-rose-300">{errors.phone.message}</span>}
              </label>

              <label className="space-y-2 text-sm text-slate-200">
                <span>Notice Period *</span>
                <input
                  type="text"
                  {...register('noticePeriod', { required: 'Notice Period is required' })}
                  className="w-full rounded-2xl border border-white/10 bg-[#050505] px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-500"
                />
                {errors.noticePeriod && <span className="text-rose-300">{errors.noticePeriod.message}</span>}
              </label>
            </div>

            <label className="space-y-2 text-sm text-slate-200">
              <span>Total Experience *</span>
              <input
                type="text"
                {...register('totalExperience', { required: 'Total Experience is required' })}
                className="w-full rounded-2xl border border-white/10 bg-[#050505] px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-500"
              />
              {errors.totalExperience && <span className="text-rose-300">{errors.totalExperience.message}</span>}
            </label>

            <label className="space-y-2 text-sm text-slate-200">
              <span>Message *</span>
              <textarea
                rows={4}
                {...register('message', { required: 'Message is required' })}
                className="w-full rounded-2xl border border-white/10 bg-[#050505] px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-500"
              />
              {errors.message && <span className="text-rose-300">{errors.message.message}</span>}
            </label>

            <label className="space-y-2 text-sm text-slate-200">
              <span>Resume Upload *</span>
              <input
                type="file"
                accept={ACCEPTED_FILE_TYPES}
                {...register('resume', { required: 'Resume is required' })}
                className="w-full rounded-2xl border border-white/10 bg-[#050505] px-4 py-3 text-sm text-white outline-none transition file:mr-4 file:rounded-full file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:text-white file:font-semibold"
              />
              {errors.resume && <span className="text-rose-300">{errors.resume.message}</span>}
              {hasResume && resumeFile[0] && (
                <span className="text-sm text-slate-400">Selected file: {resumeFile[0].name}</span>
              )}
            </label>

            <button
              type="submit"
              disabled={submitDisabled}
              className="mt-2 inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-slate-700"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
