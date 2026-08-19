import React, { useEffect, useState } from 'react';
import { Linkedin, Instagram, Facebook, CheckCircle, X } from 'lucide-react';
import api, { fetchSettings } from '../../services/api';
import { clearSettingsCache } from '../../services/api';

const KEYS = {
  linkedin: 'social_linkedin',
  instagram: 'social_instagram',
  facebook: 'social_facebook',
};

const isValidUrl = (value) => {
  if (!value) return false;
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch (e) {
    return false;
  }
};

export function SocialMediaAdmin() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState({ linkedin: '', instagram: '', facebook: '' });
  const [errors, setErrors] = useState({ linkedin: '', instagram: '', facebook: '' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const settings = await fetchSettings();
        if (!mounted) return;
        setValues({
          linkedin: settings?.[KEYS.linkedin] || '',
          instagram: settings?.[KEYS.instagram] || '',
          facebook: settings?.[KEYS.facebook] || '',
        });
      } catch (err) {
        console.error('[social-admin] failed to load settings', err);
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleChange = (key, val) => {
    setValues((s) => ({ ...s, [key]: val }));
    setErrors((e) => ({ ...e, [key]: '' }));
    setMessage('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    // Validate URLs
    const nextErrors = {};
    Object.entries(values).forEach(([k, v]) => {
      if (v && !isValidUrl(v)) nextErrors[k] = 'Enter a valid https:// URL or leave empty.';
    });

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    try {
      setSaving(true);
      await Promise.all([
        api.put(`/settings/${KEYS.linkedin}`, { value: values.linkedin || '' }),
        api.put(`/settings/${KEYS.instagram}`, { value: values.instagram || '' }),
        api.put(`/settings/${KEYS.facebook}`, { value: values.facebook || '' }),
      ]);
      clearSettingsCache();
      setMessage('Social media links saved.');
    } catch (err) {
      console.error('[social-admin] save failed', err);
      setMessage('Save failed. See console for details.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-xl backdrop-blur-xl">
      <h2 className="flex items-center gap-2 text-lg font-bold text-slate-100">
        <Linkedin className="h-5 w-5 text-cyan-400" />
        Social Media
      </h2>

      <form onSubmit={handleSave} className="mt-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300">LinkedIn URL</label>
          <input
            type="text"
            value={values.linkedin}
            onChange={(e) => handleChange('linkedin', e.target.value)}
            placeholder="https://linkedin.com/company/your-company"
            className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-slate-100"
          />
          {errors.linkedin && <div className="mt-1 text-xs text-rose-400">{errors.linkedin}</div>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300">Instagram URL</label>
          <input
            type="text"
            value={values.instagram}
            onChange={(e) => handleChange('instagram', e.target.value)}
            placeholder="https://instagram.com/your-account"
            className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-slate-100"
          />
          {errors.instagram && <div className="mt-1 text-xs text-rose-400">{errors.instagram}</div>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300">Facebook URL</label>
          <input
            type="text"
            value={values.facebook}
            onChange={(e) => handleChange('facebook', e.target.value)}
            placeholder="https://facebook.com/your-page"
            className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-slate-100"
          />
          {errors.facebook && <div className="mt-1 text-xs text-rose-400">{errors.facebook}</div>}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-500"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          {message && <div className="text-sm text-slate-300">{message}</div>}
        </div>
      </form>
    </section>
  );
}

export default SocialMediaAdmin;
