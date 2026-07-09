import React, { useEffect, useState } from 'react';
import { PlusCircle, Upload, Pencil, Trash2, Globe2, ArrowUp, ArrowDown, X } from 'lucide-react';
import api, { resolveImageUrl } from '../../services/api';

const initialFormState = {
  id: null,
  name: '',
  website: '',
  logoFile: null,
  logoPreview: '',
};

export default function ClientsAdmin() {
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState(initialFormState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const extractClients = (response) => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.clients)) return response.clients;
    if (Array.isArray(response?.data?.data)) return response.data.data;
    return [];
  };

  const loadClients = async () => {
    setLoading(true);
    try {
      const response = await api.get('/clients');
      const nextClients = extractClients(response);
      setClients(nextClients || []);
      setError('');
    } catch (err) {
      console.error('[clients-admin] load failed', err);
      setError('Unable to load clients.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const resetForm = () => {
    setForm(initialFormState);
    setError('');
    setMessage('');
  };

  const handleLogoSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setForm((prev) => ({
      ...prev,
      logoFile: file,
      logoPreview: URL.createObjectURL(file),
    }));
  };

  const handleEdit = (client) => {
    setForm({
      id: client.id,
      name: client.name || '',
      website: client.website || '',
      logoFile: null,
      logoPreview: resolveImageUrl(client.logo) || '',
    });
    setMessage('Editing existing client. Upload a new logo to replace the current one.');
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const moveClient = async (sourceIndex, destinationIndex) => {
    if (destinationIndex < 0 || destinationIndex >= clients.length) return;
    const sourceClient = clients[sourceIndex];
    const destinationClient = clients[destinationIndex];
    if (!sourceClient || !destinationClient) return;

    try {
      await api.patch(`/clients/${sourceClient.id}/swap`, {
        swapWithId: destinationClient.id,
      });
      await loadClients();
      window.dispatchEvent(new Event('clients:updated'));
    } catch (err) {
      console.error('[clients-admin] move failed', err);
      setError('Unable to update client order.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this client?')) {
      return;
    }

    try {
      await api.delete(`/clients/${id}`);
      await loadClients();
      window.dispatchEvent(new Event('clients:updated'));
      setMessage('Client deleted successfully.');
      setError('');
    } catch (err) {
      console.error('[clients-admin] delete failed', err);
      setError('Failed to delete client.');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setError('Client name is required.');
      return;
    }

    if (!form.id && !form.logoFile) {
      setError('Logo upload is required when creating a client.');
      return;
    }

    setSaving(true);
    try {
      const payload = new FormData();
      payload.append('name', form.name.trim());
      payload.append('website', form.website.trim());
      if (form.logoFile) {
        payload.append('logo', form.logoFile);
      }

      const response = form.id
        ? await api.put(`/clients/${form.id}`, payload)
        : await api.post('/clients', payload);

      const successMessage = form.id ? 'Client updated successfully.' : 'Client added successfully.';
      setMessage(successMessage);
      setError('');
      resetForm();
      await loadClients();
      window.dispatchEvent(new Event('clients:updated'));
    } catch (err) {
      console.error('[clients-admin] save failed', err);
      setError(err?.message || 'Unable to save client.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-6 rounded-3xl border border-slate-800 bg-slate-900/50 p-6 text-slate-100 shadow-2xl">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">Clients</h2>
          <p className="mt-2 text-sm text-slate-400">Manage the homepage client logo carousel and client links.</p>
        </div>
        <button
          type="button"
          onClick={resetForm}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-2 text-sm text-slate-200 transition hover:border-slate-500"
        >
          <PlusCircle className="h-4 w-4" /> New Client
        </button>
      </div>

      {message && !error && <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-300">{message}</div>}
      {error && <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-300">{error}</div>}

      <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-800 bg-slate-950/50 p-6 space-y-4">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-2">
            <label className="block text-sm font-medium text-slate-300">Client Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-100"
              placeholder="Client name"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">Website URL</label>
            <div className="relative">
              <input
                type="url"
                value={form.website}
                onChange={(e) => setForm((prev) => ({ ...prev, website: e.target.value }))}
                className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-100"
                placeholder="https://example.com"
              />
              <Globe2 className="pointer-events-none absolute right-4 top-3.5 h-4 w-4 text-slate-500" />
            </div>
          </div>

        </div>

        <div className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">Logo Upload</label>
            <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-dashed border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-200 transition hover:border-cyan-500 hover:text-cyan-200">
              <span>{form.logoFile ? form.logoFile.name : 'Upload logo image'}</span>
              <Upload className="h-4 w-4" />
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoSelect} />
            </label>
            <p className="text-sm text-slate-500">Recommended ratio: 2:1. PNG, JPG, WEBP are supported.</p>
          </div>
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="flex items-center justify-between gap-3 text-sm font-medium text-slate-300">
              <span>Logo Preview</span>
              {form.logoPreview && (
                <button type="button" onClick={() => setForm((prev) => ({ ...prev, logoFile: null, logoPreview: '' }))} className="rounded-full bg-slate-800 p-2 text-slate-400 transition hover:bg-slate-700">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="mt-4 flex h-28 items-center justify-center overflow-hidden rounded-3xl bg-slate-950/80">
              {form.logoPreview ? (
                <img src={form.logoPreview} alt="Logo preview" className="max-h-full max-w-full object-contain" />
              ) : (
                <span className="text-sm text-slate-500">No logo selected.</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center rounded-2xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:bg-slate-700"
          >
            {saving ? 'Saving...' : form.id ? 'Update Client' : 'Add Client'}
          </button>
          {form.id && (
            <button type="button" onClick={resetForm} className="inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-950/80 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-500">
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-lg font-semibold text-white">Client List</h3>
          <span className="text-sm text-slate-400">Reorder clients with Move Up / Move Down</span>
        </div>
        {loading ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-950/50 p-6 text-sm text-slate-400">Loading clients...</div>
        ) : clients.length === 0 ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-950/50 p-6 text-sm text-slate-400">No clients have been added yet.</div>
        ) : (
          <div className="space-y-3">
            {clients.map((client, index) => (
              <div key={client.id} className="grid gap-4 rounded-3xl border border-slate-800 bg-slate-950/50 p-4 md:grid-cols-[1fr_auto] md:items-center">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                  <div className="flex h-16 w-24 items-center justify-center overflow-hidden rounded-3xl bg-slate-900 p-3">
                    <img src={resolveImageUrl(client.logo)} alt={client.name} className="max-h-full max-w-full object-contain" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">{client.name}</div>
                    <div className="text-sm text-slate-400">{client.website || 'No website provided'}</div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <button
                    type="button"
                    onClick={() => moveClient(index, index - 1)}
                    disabled={index === 0}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-3 py-2 text-slate-200 transition hover:border-cyan-500 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ArrowUp className="h-4 w-4" /> Move Up
                  </button>
                  <button
                    type="button"
                    onClick={() => moveClient(index, index + 1)}
                    disabled={index === clients.length - 1}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-3 py-2 text-slate-200 transition hover:border-cyan-500 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ArrowDown className="h-4 w-4" /> Move Down
                  </button>
                  <button type="button" onClick={() => handleEdit(client)} className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-3 py-2 text-slate-200 transition hover:border-cyan-500 hover:text-cyan-300">
                    <Pencil className="h-4 w-4" /> Edit
                  </button>
                  <button type="button" onClick={() => handleDelete(client.id)} className="inline-flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-rose-300 transition hover:bg-rose-500/20">
                    <Trash2 className="h-4 w-4" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
