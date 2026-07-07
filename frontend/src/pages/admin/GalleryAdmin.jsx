import React, { useEffect, useMemo, useState } from 'react';
import { PlusCircle, Upload, Trash2, Image as ImageIcon, Sparkles, X } from 'lucide-react';
import api, { resolveImageUrl } from '../../services/api';

const HERO_SETTING_KEY = 'gallery_hero_image';
const IMAGES_SETTING_KEY = 'gallery_images';

const createGalleryItem = (image = '', alt = '', id = null) => ({
  id: id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `gallery-item-${Date.now()}-${Math.random().toString(16).slice(2)}`),
  image,
  alt,
});

const normalizeGalleryItems = (value) => {
  if (!Array.isArray(value)) return [];

  return value.map((item, index) => {
    if (typeof item === 'string') {
      return createGalleryItem(item, '', `gallery-item-${index + 1}`);
    }

    if (item && typeof item === 'object') {
      return createGalleryItem(item.image || item.url || '', item.alt || item.alt_text || '', item.id || `gallery-item-${index + 1}`);
    }

    return createGalleryItem('', '', `gallery-item-${index + 1}`);
  });
};

const getPersistableGalleryItems = (items = []) =>
  (items || [])
    .filter((item) => item?.image)
    .map((item) => ({ id: item.id, image: item.image, alt: item.alt || '' }));

const emitGalleryUpdated = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('gallery:updated'));
  }
};

export function GalleryAdmin() {
  const [heroImage, setHeroImage] = useState('');
  const [savedHeroImage, setSavedHeroImage] = useState('');
  const [galleryItems, setGalleryItems] = useState([]);
  const [savedGalleryItems, setSavedGalleryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const hasHeroImage = Boolean(heroImage);
  const heroPreview = useMemo(() => (heroImage ? resolveImageUrl(heroImage) : ''), [heroImage]);
  const isDirty = heroImage !== savedHeroImage || JSON.stringify(getPersistableGalleryItems(galleryItems)) !== JSON.stringify(getPersistableGalleryItems(savedGalleryItems));

  const loadGalleryData = async () => {
    try {
      setLoading(true);
      const settings = await api.get('/settings');
      const nextHeroImage = settings?.[HERO_SETTING_KEY] || '';
      const nextGalleryItems = normalizeGalleryItems(settings?.[IMAGES_SETTING_KEY] || []);
      setHeroImage(nextHeroImage || '');
      setSavedHeroImage(nextHeroImage || '');
      setGalleryItems(nextGalleryItems);
      setSavedGalleryItems(getPersistableGalleryItems(nextGalleryItems));
      setError('');
    } catch (err) {
      console.error('[gallery-admin] failed to load gallery settings', err);
      setError(err.message || 'Unable to load gallery settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGalleryData();
  }, []);

  const persistGalleryState = async (nextHeroImage, nextGalleryItems) => {
    await Promise.all([
      api.put(`/settings/${HERO_SETTING_KEY}`, { value: nextHeroImage || '' }),
      api.put(`/settings/${IMAGES_SETTING_KEY}`, {
        value: getPersistableGalleryItems(nextGalleryItems),
      }),
    ]);
  };

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    const uploadedMedia = response?.data || response?.media || null;
    const uploadedUrl = uploadedMedia?.url || uploadedMedia?.secure_url || uploadedMedia?.path || null;
    return uploadedUrl ? resolveImageUrl(uploadedUrl) : '';
  };

  const handleHeroImageChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setSaving(true);
      const uploadedUrl = await uploadImage(file);
      if (!uploadedUrl) {
        throw new Error('Main gallery image upload failed.');
      }

      setHeroImage(uploadedUrl);
      setMessage('Main gallery image selected. Save Changes to publish it.');
      setError('');
    } catch (err) {
      console.error('[gallery-admin] hero upload failed', err);
      setError(err.message || 'Main gallery image upload failed.');
    } finally {
      setSaving(false);
      event.target.value = '';
    }
  };

  const handleHeroImageDelete = () => {
    setHeroImage('');
    setMessage('Main gallery image removed from the draft. Save Changes to publish it.');
    setError('');
  };

  const handleAddGalleryItem = () => {
    setGalleryItems((current) => [...current, createGalleryItem()]);
    setMessage('New gallery slot added. Upload an image and Save Changes to publish it.');
    setError('');
  };

  const handleGalleryImageChange = async (itemId, event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setSaving(true);
      const uploadedUrl = await uploadImage(file);
      if (!uploadedUrl) {
        throw new Error('Gallery image upload failed.');
      }

      const nextGalleryItems = galleryItems.map((item) => (item.id === itemId ? { ...item, image: uploadedUrl } : item));
      setGalleryItems(nextGalleryItems);
      setMessage('Gallery image selected. Save Changes to publish it.');
      setError('');
    } catch (err) {
      console.error('[gallery-admin] gallery image upload failed', err);
      setError(err.message || 'Gallery image upload failed.');
    } finally {
      setSaving(false);
      event.target.value = '';
    }
  };

  const handleGalleryImageDelete = (itemId) => {
    const nextGalleryItems = galleryItems.filter((item) => item.id !== itemId);
    setGalleryItems(nextGalleryItems);
    setMessage('Gallery image removed from the draft. Save Changes to publish it.');
    setError('');
  };

  const handleSaveChanges = async () => {
    try {
      setSaving(true);
      await persistGalleryState(heroImage, galleryItems);
      setSavedHeroImage(heroImage);
      setSavedGalleryItems(getPersistableGalleryItems(galleryItems));
      setMessage('Gallery changes saved successfully.');
      setError('');
      emitGalleryUpdated();
    } catch (err) {
      console.error('[gallery-admin] failed to save gallery changes', err);
      setError(err.message || 'Unable to save gallery changes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="max-h-[700px] overflow-y-auto rounded-3xl border border-slate-800 bg-slate-900/50 p-6 text-slate-100 shadow-2xl">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
            <Sparkles className="h-4 w-4" /> Gallery
          </div>
          <h2 className="mt-2 text-2xl font-semibold text-white">Manage public gallery content</h2>
          <p className="mt-2 text-sm text-slate-400">Upload a dedicated hero image and any number of gallery images for the public gallery page.</p>
        </div>
      </div>

      {message && !error && <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-300">{message}</div>}
      {error && <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-300">{error}</div>}

      <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Main Gallery Image</h3>
            <p className="mt-1 text-sm text-slate-400">This image appears as the hero image on the public gallery page and is stored separately from the gallery grid images.</p>
          </div>
          <div className="text-sm text-slate-500">{saving ? 'Saving...' : 'Ready'}</div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-700 bg-slate-950/70 px-3 py-3 text-sm text-slate-300 transition hover:border-cyan-500 hover:text-cyan-300">
              <Upload className="h-4 w-4" />
              {hasHeroImage ? 'Change Image' : 'Upload Image'}
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleHeroImageChange} />
            </label>
            {heroPreview ? (
              <div className="mt-4 overflow-hidden rounded-2xl border border-slate-800 bg-black">
                <img src={heroPreview} alt="Gallery hero preview" className="h-56 w-full object-contain" />
              </div>
            ) : (
              <div className="mt-4 flex h-56 items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-950/60 text-sm text-slate-500">
                No main gallery image selected yet.
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
              <ImageIcon className="h-4 w-4" /> Hero Controls
            </div>
            <p className="mt-3 text-sm text-slate-400">Upload a new image, replace the current one, or delete the hero image without affecting the gallery images below.</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-2 text-sm text-slate-300 transition hover:border-cyan-500 hover:text-cyan-300">
                <Upload className="h-4 w-4" />
                {hasHeroImage ? 'Replace Image' : 'Upload Image'}
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleHeroImageChange} />
              </label>
              {hasHeroImage && (
                <button type="button" onClick={handleHeroImageDelete} className="inline-flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-300 transition hover:bg-rose-500/20">
                  <Trash2 className="h-4 w-4" /> Delete Image
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Gallery Images</h3>
            <p className="mt-1 text-sm text-slate-400">Each gallery image is managed independently and can be added, updated, or removed without refreshing the page.</p>
          </div>
          <button type="button" onClick={handleAddGalleryItem} className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-500">
            <PlusCircle className="h-4 w-4" /> Add Image
          </button>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-400">Loading gallery settings...</div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {galleryItems.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">Image Card</div>
                  <button type="button" onClick={() => handleGalleryImageDelete(item.id)} className="rounded-lg border border-rose-500/30 p-2 text-rose-400 transition hover:bg-rose-500/10">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {item.image ? (
                  <div className="mt-4 overflow-hidden rounded-2xl border border-slate-800 bg-black">
                    <img src={resolveImageUrl(item.image)} alt={item.alt || 'Gallery preview'} className="h-48 w-full object-cover" />
                  </div>
                ) : (
                  <div className="mt-4 flex h-48 items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-950/60 text-sm text-slate-500">
                    No image selected yet.
                  </div>
                )}

                <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-700 bg-slate-950/70 px-3 py-3 text-sm text-slate-300 transition hover:border-cyan-500 hover:text-cyan-300">
                  <Upload className="h-4 w-4" />
                  {item.image ? 'Change Image' : 'Upload Image'}
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => handleGalleryImageChange(item.id, event)} />
                </label>
              </div>
            ))}
          </div>
        )}

        {!loading && galleryItems.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/70 p-6 text-center text-sm text-slate-500">
            No gallery images yet. Add your first image to begin building the public gallery.
          </div>
        )}
      </div>

      <div className="sticky bottom-0 mt-4 rounded-2xl border border-slate-800 bg-slate-900/90 p-4">
        <button
          type="button"
          onClick={handleSaveChanges}
          disabled={saving || !isDirty}
          className="w-full rounded-xl bg-cyan-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:bg-slate-700"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </section>
  );
}

export default GalleryAdmin;
