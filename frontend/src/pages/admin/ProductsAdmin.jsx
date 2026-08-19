import React, { useEffect, useRef, useState } from 'react';
import { Eye, Pencil, PlusCircle, Save, Trash2, Upload, X } from 'lucide-react';
import api, { resolveImageUrl } from '../../services/api';
import RichTextEditor from '../../components/RichTextEditor';
import { getEditableHtml } from '../../utils/richText';

const slugify = (value) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const legacyBlocksToHtml = (blocks = []) => blocks.map((block) => {
  const heading = block.heading ? `<h2>${block.heading}</h2>` : '';
  const paragraph = block.paragraph ? `<p>${block.paragraph}</p>` : '';
  const bullets = Array.isArray(block.bullets) && block.bullets.length ? `<ul>${block.bullets.map((bullet) => `<li>${bullet}</li>`).join('')}</ul>` : '';
  const image = block.image ? `<p><img src="${block.image}" alt="" /></p>` : '';
  return `${heading}${paragraph}${bullets}${image}`;
}).join('');

const getProductContentHtml = (content) => {
  if (typeof content === 'string') return getEditableHtml(content);
  if (content && typeof content === 'object' && !Array.isArray(content)) return getEditableHtml(content.html || '');
  if (Array.isArray(content)) return legacyBlocksToHtml(content);
  return '';
};

export function ProductsAdmin() {
  const [products, setProducts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [name, setName] = useState('');
  const [subHeading, setSubHeading] = useState('');
  const [introduction, setIntroduction] = useState('');
  const [heroImage, setHeroImage] = useState('');
  const [content, setContent] = useState('');
  const [legacyFields, setLegacyFields] = useState({ specifications: {}, applications: [], benefits: [], features: [] });
  const [status, setStatus] = useState('enabled');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ success: '', error: '' });
  const editorRef = useRef(null);
  const nameInputRef = useRef(null);

  const loadProducts = async () => {
    try {
      const response = await api.get('/products?admin=true');
      const nextProducts = Array.isArray(response) ? response : response?.data || [];
      setProducts(nextProducts);
      return true;
    } catch (error) {
      setMessage({ success: '', error: error.message || 'Products could not be loaded.' });
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProducts(); }, []);

  const resetForm = () => {
    setEditingId(null);
    setEditorOpen(false);
    setName('');
    setSubHeading('');
    setIntroduction('');
    setHeroImage('');
    setContent('');
    setLegacyFields({ specifications: {}, applications: [], benefits: [], features: [] });
    setStatus('enabled');
    setMessage({ success: '', error: '' });
  };

  const openNewProduct = () => {
    resetForm();
    setEditorOpen(true);
  };

  useEffect(() => {
    if (!editorOpen) return undefined;
    const frame = window.requestAnimationFrame(() => {
      editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      nameInputRef.current?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [editorOpen, editingId]);

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/media/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    const media = response?.data || response?.media;
    const url = media?.url || media?.secure_url || media?.path;
    if (!url) throw new Error('Image upload did not return a permanent URL.');
    return resolveImageUrl(url);
  };

  const chooseImage = async (event, onUploaded) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setMessage({ success: '', error: '' });
      onUploaded(await uploadImage(file));
    } catch (error) {
      setMessage({ success: '', error: error.message || 'Image upload failed.' });
    } finally {
      event.target.value = '';
    }
  };

  const editProduct = (product) => {
    setEditingId(product.id);
    setName(product.name || '');
    setSubHeading(product.sub_heading || '');
    setIntroduction(product.introduction || product.short_description || '');
    setHeroImage(product.hero_image || product.hero_url || '');
    setContent(getProductContentHtml(product.content));
    setLegacyFields({ specifications: product.specifications || {}, applications: product.applications || [], benefits: product.benefits || [], features: product.features || [] });
    setStatus(product.status || 'enabled');
    setMessage({ success: '', error: '' });
    setEditorOpen(true);
  };

  const saveProduct = async (event) => {
    event.preventDefault();
    if (!name.trim() || !subHeading.trim() || !introduction.trim()) {
      setMessage({ success: '', error: 'Product name, sub heading, and introduction are required.' });
      return;
    }
    if (saving) return;
    setSaving(true);
    setMessage({ success: '', error: '' });
    const payload = {
      name: name.trim(),
      slug: editingId ? products.find((product) => product.id === editingId)?.slug || slugify(name) : slugify(name),
      sub_heading: subHeading.trim(),
      introduction: introduction.trim(),
      short_description: introduction.trim(),
      full_description: introduction.trim(),
      hero_image: heroImage || null,
      content,
      status,
      specifications: legacyFields.specifications,
      applications: legacyFields.applications,
      benefits: legacyFields.benefits,
      features: legacyFields.features
    };
    try {
      const response = editingId ? await api.put(`/products/${editingId}`, payload) : await api.post('/products', payload);
      const savedProduct = response?.product || response?.data?.product;
      if (response?.success === false || !savedProduct?.id) {
        throw new Error(response?.message || 'Unable to save product. Your changes were not saved. Please try again.');
      }
      const refreshed = await loadProducts();
      if (!refreshed) throw new Error('Unable to refresh products after saving. Your changes were saved, but the list could not be refreshed.');
      resetForm();
      setMessage({ success: 'Product saved successfully.', error: '' });
      window.setTimeout(() => setMessage((current) => current.success === 'Product saved successfully.' ? { success: '', error: '' } : current), 3000);
    } catch (error) {
      const statusCode = error.status || error.response?.status;
      const message = statusCode === 413 || statusCode === 429
        ? 'Unable to save product. Your changes were not saved. Please try again.'
        : error.response?.data?.message || error.message || 'Unable to save product. Your changes were not saved. Please try again.';
      setMessage({ success: '', error: message });
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (product) => {
    if (!window.confirm(`Delete ${product.name}?`)) return;
    try {
      await api.delete(`/products/${product.id}`);
      if (editingId === product.id) resetForm();
      await loadProducts();
    } catch (error) {
      setMessage({ success: '', error: error.response?.data?.message || error.message || 'Product could not be deleted.' });
    }
  };

  return (
    <section className="space-y-6 rounded-3xl border border-slate-800 bg-slate-900/50 p-6 text-slate-100 shadow-2xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><h2 className="text-2xl font-semibold text-white">Products</h2><p className="mt-2 text-sm text-slate-400">Manage public product pages and their ordered content blocks.</p></div>
        <button type="button" onClick={openNewProduct} className="flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-500"><PlusCircle className="h-4 w-4" /> Add Product</button>
      </div>
      {message.success && <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">{message.success}</p>}
      {editorOpen && <form ref={editorRef} onSubmit={saveProduct} className="scroll-mt-24 space-y-5 rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
        <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-cyan-400"><Pencil className="h-4 w-4" /> {editingId ? 'Edit Product' : 'Add Product'}</div><button type="button" onClick={resetForm} className="text-xs text-slate-400 hover:text-white">Cancel</button></div>
        <div className="grid gap-4 md:grid-cols-2"><label className="space-y-2 text-sm text-slate-300">Product Name<input ref={nameInputRef} required value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-white" /></label><label className="space-y-2 text-sm text-slate-300">Sub Heading<input required value={subHeading} onChange={(e) => setSubHeading(e.target.value)} className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-white" /></label></div>
        <label className="block space-y-2 text-sm text-slate-300">Introduction<textarea required rows="4" value={introduction} onChange={(e) => setIntroduction(e.target.value)} className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-white" /></label>
        <div className="space-y-3"><div className="text-sm font-semibold text-slate-200">Main Hero Image</div><div className="flex flex-wrap items-center gap-3"><label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-700 px-4 py-3 text-sm text-slate-300 hover:border-cyan-500"><Upload className="h-4 w-4" /> Upload / Replace<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(e) => chooseImage(e, setHeroImage)} /></label>{heroImage && <button type="button" onClick={() => setHeroImage('')} className="flex items-center gap-2 rounded-xl border border-rose-500/30 px-4 py-3 text-sm text-rose-300"><X className="h-4 w-4" /> Delete</button>}</div>{heroImage && <img src={resolveImageUrl(heroImage)} alt="Hero preview" className="h-40 w-full rounded-xl object-cover" />}</div>
        <div className="space-y-2"><div className="text-sm font-semibold text-slate-200">Product Content</div><RichTextEditor value={content} onChange={setContent} onUploadImage={uploadImage} placeholder="Write product details here..." /></div>
        <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" checked={status === 'enabled'} onChange={(e) => setStatus(e.target.checked ? 'enabled' : 'disabled')} /> Published</label>
        {message.error && <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">{message.error}</p>}
        <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white disabled:bg-slate-700"><Save className="h-4 w-4" /> {saving ? 'Saving Product...' : 'Save Product'}</button>
      </form>}
      <div className="space-y-3"><div className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-400">Product List</div>{loading ? <div className="text-sm text-slate-500">Loading products...</div> : products.length === 0 ? <div className="text-sm text-slate-500">No products added yet.</div> : products.map((product) => <div key={product.id} className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-950/50 p-4 md:flex-row md:items-center"><div className="h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-slate-900">{(product.hero_image || product.hero_url) && <img src={resolveImageUrl(product.hero_image || product.hero_url)} alt={product.name} className="h-full w-full object-cover" />}</div><div className="min-w-0 flex-1"><div className="font-semibold text-white">{product.name}</div><div className="mt-1 text-sm text-cyan-300">{product.sub_heading || 'No sub heading saved'}</div><div className="mt-1 text-xs text-slate-500">{product.status || 'enabled'}</div></div><div className="flex gap-2"><a href={`/products/${product.slug}`} target="_blank" rel="noreferrer" title="View public product" className="rounded-lg border border-slate-700 p-2 text-slate-300"><Eye className="h-4 w-4" /></a><button type="button" onClick={() => editProduct(product)} title="Edit product" className="rounded-lg border border-slate-700 p-2 text-slate-300"><Pencil className="h-4 w-4" /></button><button type="button" onClick={() => deleteProduct(product)} title="Delete product" className="rounded-lg border border-rose-500/30 p-2 text-rose-300"><Trash2 className="h-4 w-4" /></button></div></div>)}</div>
    </section>
  );
}

export default ProductsAdmin;
