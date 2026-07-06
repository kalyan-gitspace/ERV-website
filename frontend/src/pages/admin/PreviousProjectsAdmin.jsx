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

const getUniqueProjectSlug = (projectTitle, projects = [], editingId = null, preferredSlug = '') => {
  const baseSlug = slugify(projectTitle) || `project-${Date.now().toString(36)}`;
  const usedSlugs = new Set(
    projects
      .filter((project) => String(project.id) !== String(editingId))
      .map((project) => project.slug)
      .filter(Boolean)
  );

  if (preferredSlug && !usedSlugs.has(preferredSlug)) {
    return preferredSlug;
  }

  if (!usedSlugs.has(baseSlug)) {
    return baseSlug;
  }

  let suffix = 2;
  while (usedSlugs.has(`${baseSlug}-${suffix}`)) {
    suffix += 1;
  }

  return `${baseSlug}-${suffix}`;
};

const getSlugConflictFallback = (projectTitle) => {
  const baseSlug = slugify(projectTitle) || 'project';
  return `${baseSlug}-${Date.now().toString(36)}`;
};

const isSlugConflictError = (error) => {
  const message = String(error?.message || error?.response?.data?.message || '').toLowerCase();
  return message.includes('projects_slug_key') || (message.includes('duplicate key') && message.includes('slug'));
};

const emitProjectsChanged = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('projects:updated'));
  }
};

const hasProjectDescriptionContent = (html = '') => {
  if (htmlToPlainText(html)) {
    return true;
  }

  if (!html) {
    return false;
  }

  if (typeof document !== 'undefined') {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    return Boolean(wrapper.querySelector('img[src]'));
  }

  return /<img\b/i.test(String(html));
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

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setEnabled(true);
    setWarning('');
    setMainImageItem(null);
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

  const handleSubmit = async (event) => {
    event.preventDefault();

    const plainDescription = htmlToPlainText(description);
    const hasRequiredFields = Boolean(title.trim() && hasProjectDescriptionContent(description) && mainImageItem);
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

      if (!mainImageUrl) {
        setWarning('Main Image upload failed. Please choose the image again and publish.');
        return;
      }

      const payload = {
        title: title.trim(),
        slug: getUniqueProjectSlug(
          title.trim(),
          projects,
          editingId,
          editingId && slugify(projects.find((project) => String(project.id) === String(editingId))?.title || '') === slugify(title.trim())
            ? projects.find((project) => String(project.id) === String(editingId))?.slug
            : ''
        ),
        short_description: plainDescription || title.trim(),
        rich_description: description.trim(),
        main_image: mainImageUrl,
        gallery_images: [],
        status: enabled ? 'enabled' : 'disabled',
      };

      console.log('[projects] publishing payload', payload);

      const saveProject = async (projectPayload) => {
        if (editingId) {
          const res = await api.put(`/projects/${editingId}`, projectPayload);
          console.log('[projects] update response', res);
          return res;
        }

        const res = await api.post('/projects', projectPayload);
        console.log('[projects] create response', res);
        return res;
      };

      try {
        await saveProject(payload);
      } catch (error) {
        if (!isSlugConflictError(error)) {
          throw error;
        }

        const retryPayload = {
          ...payload,
          slug: getSlugConflictFallback(title.trim()),
        };
        console.warn('[projects] slug conflict, retrying with slug', retryPayload.slug);
        await saveProject(retryPayload);
      }

      resetForm();
      await loadProjects();
      emitProjectsChanged();
    } catch (error) {
      console.error(error);
      setWarning(error.message || 'Project could not be published. Please try again.');
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
  };

  const toggleStatus = async (project) => {
    const hasRequiredFields = Boolean(
      project.title?.trim() &&
        hasProjectDescriptionContent(project.rich_description || project.short_description || '') &&
        project.main_image
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

  const isSubmitDisabled = saving || !(title.trim() && hasProjectDescriptionContent(description) && mainImageItem);

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
            onUploadImage={uploadImage}
            placeholder="Write a simple description"
          />
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
