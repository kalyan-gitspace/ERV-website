import React, { useEffect, useState } from 'react';
import { PlusCircle, Pencil, Trash2, Eye, EyeOff, Upload, X } from 'lucide-react';
import api, { resolveImageUrl } from '../../services/api';
import RichTextEditor from '../../components/RichTextEditor';
import { getEditableHtml, htmlToPlainText } from '../../utils/richText';

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const emitProjectsChanged = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('projects:updated'));
  }
};

export function PreviousProjectsAdmin() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [warning, setWarning] = useState('');
  const [mainImageItem, setMainImageItem] = useState(null);
  const [galleryItems, setGalleryItems] = useState([]);

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setEnabled(true);
    setWarning('');
    setMainImageItem(null);
    setGalleryItems([]);
  };

  const loadProjects = async () => {
    try {
      console.log('[projects] loading projects from admin list');
      const res = await api.get('/projects?admin=true');
      console.log('[projects] admin list response', res);
      if (res?.success && Array.isArray(res.data)) {
        setProjects(res.data);
      }
    } catch (error) {
      console.error('[projects] failed to load admin projects', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    const uploadedMedia = res?.data || res?.media || null;
    const uploadedUrl = uploadedMedia?.url || uploadedMedia?.secure_url || uploadedMedia?.path || null;
    return uploadedUrl ? resolveImageUrl(uploadedUrl) : null;
  };

  const handleMainImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setMainImageItem({ type: 'new', value: file, preview: URL.createObjectURL(file) });
    setWarning('');
  };

  const removeMainImage = () => {
    setMainImageItem(null);
    setWarning('');
  };

  const handleGalleryChange = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const newItems = files.map((file) => ({
      id: `${Date.now()}-${Math.random()}`,
      type: 'new',
      value: file,
      preview: URL.createObjectURL(file),
    }));

    setGalleryItems((current) => [...current, ...newItems]);
    setWarning('');
  };

  const removeGalleryItem = (itemId) => {
    setGalleryItems((current) => current.filter((item) => item.id !== itemId));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const plainDescription = htmlToPlainText(description);
    const hasRequiredFields = Boolean(title.trim() && plainDescription && mainImageItem && galleryItems.length > 0);
    if (!hasRequiredFields) {
      setWarning('Please complete all required fields before publishing this project.');
      return;
    }

    setSaving(true);
    try {
      let mainImageUrl = '';
      if (mainImageItem?.type === 'existing') {
        mainImageUrl = mainImageItem.value;
      } else if (mainImageItem?.type === 'new') {
        mainImageUrl = (await uploadImage(mainImageItem.value)) || '';
      }

      const galleryUrls = [];
      for (const item of galleryItems) {
        if (item.type === 'existing') {
          galleryUrls.push(item.value);
        } else if (item.type === 'new') {
          const uploadedUrl = await uploadImage(item.value);
          if (uploadedUrl) {
            galleryUrls.push(uploadedUrl);
          }
        }
      }

      const payload = {
        title: title.trim(),
        slug: slugify(title.trim()),
        short_description: plainDescription,
        rich_description: description.trim(),
        main_image: mainImageUrl,
        gallery_images: galleryUrls,
        status: enabled ? 'enabled' : 'disabled',
      };

      console.log('[projects] publishing payload', payload);

      if (editingId) {
        const res = await api.put(`/projects/${editingId}`, payload);
        console.log('[projects] update response', res);
      } else {
        const res = await api.post('/projects', payload);
        console.log('[projects] create response', res);
      }

      resetForm();
      await loadProjects();
      emitProjectsChanged();
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (project) => {
    setEditingId(project.id);
    setTitle(project.title || '');
    setDescription(getEditableHtml(project.rich_description || project.short_description || ''));
    setEnabled(project.status !== 'disabled');
    setWarning('');
    setMainImageItem(
      project.main_image
        ? { id: `existing-main-${project.id}`, type: 'existing', value: project.main_image, preview: resolveImageUrl(project.main_image) }
        : null
    );
    setGalleryItems(
      Array.isArray(project.gallery_images)
        ? project.gallery_images.map((image, index) => ({
            id: `existing-gallery-${project.id}-${index}`,
            type: 'existing',
            value: image,
            preview: resolveImageUrl(image),
          }))
        : []
    );
  };

  const toggleStatus = async (project) => {
    const hasRequiredFields = Boolean(
      project.title?.trim() &&
        htmlToPlainText(project.rich_description || project.short_description || '') &&
        project.main_image &&
        Array.isArray(project.gallery_images) &&
        project.gallery_images.length > 0
    );

    if (!hasRequiredFields) {
      setWarning('Please complete all required fields before enabling this project.');
      return;
    }

    try {
      if (project.status === 'enabled') {
        await api.patch(`/projects/${project.id}/disable`);
      } else {
        await api.patch(`/projects/${project.id}/enable`);
      }
      await loadProjects();
      emitProjectsChanged();
    } catch (error) {
      console.error(error);
    }
  };

  const removeProject = async (id) => {
    const confirmed = window.confirm('Delete this project?');
    if (!confirmed) return;

    try {
      await api.delete(`/projects/${id}`);
      await loadProjects();
      emitProjectsChanged();
    } catch (error) {
      console.error(error);
    }
  };

  const isSubmitDisabled = saving || !(title.trim() && htmlToPlainText(description) && mainImageItem && galleryItems.length > 0);

  return (
    <div className="space-y-6 rounded-3xl border border-slate-800 bg-slate-900/50 p-6 text-slate-100 shadow-2xl">
      <div>
        <h2 className="text-2xl font-semibold text-white">Previous Projects</h2>
        <p className="mt-2 text-sm text-slate-400">Add and manage simple project entries for the website.</p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
          <PlusCircle className="h-4 w-4" /> {editingId ? 'Edit Project' : 'Add Project'}
        </div>

        <div className="space-y-2">
          <label className="text-sm text-slate-300">Project Title</label>
          <input
            required
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              setWarning('');
            }}
            className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2"
            placeholder="Project Title"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-slate-300">Description</label>
          <RichTextEditor
            value={description}
            onChange={(value) => {
              setDescription(value);
              setWarning('');
            }}
            placeholder="Write a simple description"
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm text-slate-300">Main Image</label>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-700 bg-slate-900/70 px-3 py-3 text-sm text-slate-300">
              <Upload className="h-4 w-4" />
              Choose Image
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleMainImageChange} />
            </label>
            {mainImageItem && (
              <div className="relative">
                <img src={mainImageItem.preview} alt="Main preview" className="h-28 w-full rounded-xl object-cover" />
                <button type="button" onClick={removeMainImage} className="absolute right-2 top-2 rounded-full bg-slate-950/80 p-1 text-slate-100">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm text-slate-300">Additional Photos</label>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-700 bg-slate-900/70 px-3 py-3 text-sm text-slate-300">
              <Upload className="h-4 w-4" />
              Choose Photos
              <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handleGalleryChange} />
            </label>
            {galleryItems.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {galleryItems.map((item) => (
                  <div key={item.id} className="relative">
                    <img src={item.preview} alt="Gallery preview" className="h-16 w-full rounded-lg object-cover" />
                    <button type="button" onClick={() => removeGalleryItem(item.id)} className="absolute right-1 top-1 rounded-full bg-slate-950/80 p-1 text-slate-100">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {warning && <p className="text-sm text-amber-400">{warning}</p>}

        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={isSubmitDisabled} className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-700">
            {saving ? 'Publishing...' : editingId ? 'Save Changes' : 'Publish Project'}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300">
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="space-y-3">
        <div className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">Published Projects</div>
        {loading ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-sm text-slate-400">Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-sm text-slate-400" />
        ) : (
          projects.map((project) => (
            <div key={project.id} className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-950/40 p-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <div className="font-semibold text-white">{project.title}</div>
                  <div className={`mt-1 text-xs ${project.status === 'enabled' ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {project.status === 'enabled' ? 'Enabled' : 'Disabled'}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => toggleStatus(project)} className="rounded-lg border border-slate-700 p-2 text-slate-300">
                  {project.status === 'enabled' ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <button type="button" onClick={() => handleEdit(project)} className="rounded-lg border border-slate-700 p-2 text-slate-300">
                  <Pencil className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => removeProject(project.id)} className="rounded-lg border border-rose-500/30 p-2 text-rose-400">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default PreviousProjectsAdmin;
