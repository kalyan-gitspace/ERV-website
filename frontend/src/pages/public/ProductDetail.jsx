import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PublicLayout } from '../../layouts/PublicLayout';
import api, { resolveImageUrl } from '../../services/api';
import { Cpu, ArrowLeft, RefreshCw } from 'lucide-react';
import { removeEditorOnlyArticleUi, normalizeHtmlImageSources } from '../../utils/richText';

const getProductContentHtml = (content) => {
  if (typeof content === 'string') return content;
  if (content && typeof content === 'object' && !Array.isArray(content)) return content.html || '';
  return '';
};

export function ProductDetail() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        // Try calling the backend endpoint first
        const res = await api.get(`/products/${slug}`);
        const apiProduct = res?.data || res;
        if (apiProduct?.name) {
          setProduct({
            ...apiProduct,
            tagline: apiProduct.sub_heading || apiProduct.tagline,
            description: apiProduct.introduction || apiProduct.description || apiProduct.short_description,
            specs: apiProduct.specs || apiProduct.specifications || [],
            advantages: apiProduct.advantages || apiProduct.benefits || [],
            hero_image: apiProduct.hero_image || apiProduct.hero_url || '',
            content: getProductContentHtml(apiProduct.content)
          });
        } else setProduct(null);
      } catch (err) {
        console.error('Product fetch error:', err);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);

  if (loading) {
    return (
      <PublicLayout>
        <div className="min-h-screen flex items-center justify-center bg-black">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
            <p className="text-sm text-slate-500 font-light">Loading technical specifications...</p>
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (!product) {
    return (
      <PublicLayout>
        <div className="min-h-screen flex flex-col items-center justify-center bg-black text-center px-4">
          <Cpu className="w-12 h-12 text-slate-700 mb-4" />
          <h2 className="text-2xl font-bold text-slate-300">Product Not Found</h2>
          <p className="text-sm text-slate-500 mt-2 max-w-sm">The product page you are seeking is either relocated or in development.</p>
          <Link to="/" className="mt-6 flex items-center gap-2 text-sm text-brand-cyan hover:underline">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="bg-black font-sans min-h-screen relative pb-24">
        {/* Visual glow backgrounds */}
        <div className="absolute top-0 right-1/4 w-100 h-100 bg-blue-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-100 h-100 bg-cyan-600/5 rounded-full blur-3xl" />

        {/* Hero Section */}
        <section className="relative border-b border-slate-900 bg-black py-20">
          <div className="max-w-375 mx-auto px-6">
            <Link to="/" className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white mb-8 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Products
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-12 items-center">
              <div className="space-y-6">
                <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
                  {product.name}
                </h1>
                {product.tagline && <p className="section-eyebrow">{product.tagline}</p>}
                <p className="text-sm text-slate-400 leading-relaxed font-light">
                  {product.description}
                </p>
                
              </div>

              <div className="relative flex justify-center lg:justify-end">
                {product.hero_image ? <img src={resolveImageUrl(product.hero_image)} alt={product.name} className="w-full max-w-162.5 h-87.5 rounded-3xl border border-slate-800 object-cover shadow-2xl" /> : <div className="relative flex aspect-4/3 w-full max-w-sm items-center justify-center overflow-hidden rounded-3xl border border-slate-800 bg-linear-to-br from-slate-900 to-slate-950 p-6 shadow-2xl group">
                  <div className="absolute inset-0 bg-linear-to-tr from-indigo-600/10 to-cyan-500/10 opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  {/* Technology schematics graphic */}
                  <div className="w-32 h-32 rounded-full border border-dashed border-slate-800 flex items-center justify-center relative animate-spin-slow">
                    <div className="w-24 h-24 rounded-full border border-indigo-500/20 flex items-center justify-center" />
                  </div>

                  <Cpu className="absolute w-12 h-12 text-indigo-400" />

                  {/* Casing corner frames */}
                  <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-slate-800" />
                  <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-slate-800" />
                  <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-slate-800" />
                  <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-slate-800" />
                </div>}
              </div>
            </div>
          </div>
        </section>

        {product.content && (
          <section className="mx-auto max-w-375 space-y-16 px-6 pt-20">
            <article
              className="project-case-study-article"
              dangerouslySetInnerHTML={{
                __html: normalizeHtmlImageSources(removeEditorOnlyArticleUi(product.content), resolveImageUrl)
              }}
            />
          </section>
        )}
      </div>
    </PublicLayout>
  );
}
export default ProductDetail;
