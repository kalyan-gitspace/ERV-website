import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { PublicLayout } from '../../layouts/PublicLayout';
import api from '../../services/api';
import { Search as SearchIcon, ShieldAlert, Cpu, Image, Briefcase, ChevronRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  
  const [query, setQuery] = useState(queryParam);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({ products: [], gallery: [], careers: [] });
  const [error, setError] = useState('');

  const executeSearch = async (searchTerm) => {
    if (!searchTerm.trim()) {
      setResults({ products: [], gallery: [], careers: [] });
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Query backend search APIs concurrently
      const [prodRes, gallRes, carRes] = await Promise.allSettled([
        api.get(`/products/search?q=${encodeURIComponent(searchTerm)}`),
        api.get(`/gallery/search?q=${encodeURIComponent(searchTerm)}`),
        api.get(`/careers/search?q=${encodeURIComponent(searchTerm)}`),
      ]);

      const products = prodRes.status === 'fulfilled' && prodRes.value.success ? prodRes.value.data : [];
      const gallery = gallRes.status === 'fulfilled' && gallRes.value.success ? gallRes.value.data : [];
      const careers = carRes.status === 'fulfilled' && carRes.value.success ? carRes.value.data : [];

      setResults({ products, gallery, careers });
    } catch (err) {
      console.error('Search query execution failure:', err);
      setError('Failed to fetch search results. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchParams({ q: query });
  };

  // Run search when the URL query parameter changes
  useEffect(() => {
    setQuery(queryParam);
    executeSearch(queryParam);
  }, [queryParam]);

  const totalResults = results.products.length + results.gallery.length + results.careers.length;

  return (
    <PublicLayout>
      <div className="relative min-h-screen bg-slate-950 py-16 px-6 font-sans">
        <div className="absolute top-10 left-10 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl animate-pulse" />

        <div className="relative max-w-4xl mx-auto space-y-12">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text text-transparent sm:text-5xl">
              Search Catalog
            </h1>
            <p className="max-w-md mx-auto text-sm text-slate-400 font-light">
              Explore path visual intelligence products, gallery archives, and career vacancies.
            </p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto">
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Search LiDAR, Highway scanners, NSV, Engineering jobs..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-5 pr-14 py-4 bg-slate-900/60 backdrop-blur-md border border-slate-800 focus:border-indigo-500 rounded-2xl text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 transition-all text-sm"
              />
              <button
                type="submit"
                disabled={loading}
                className="absolute right-3 p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all cursor-pointer"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <SearchIcon className="w-5 h-5" />}
              </button>
            </div>
          </form>

          {/* Error Notice */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/25 text-red-300 rounded-2xl text-xs flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              {error}
            </div>
          )}

          {/* Search Results Summary */}
          {queryParam && !loading && (
            <p className="text-xs text-slate-500 font-light pl-2">
              Found {totalResults} result{totalResults !== 1 ? 's' : ''} matching "{queryParam}"
            </p>
          )}

          {/* Results Sections */}
          <div className="space-y-8">
            {/* Products matches */}
            {results.products.length > 0 && (
              <section className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2 pl-2">
                  <Cpu className="w-4 h-4" />
                  Product Showcases ({results.products.length})
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {results.products.map((product) => (
                    <Link
                      key={product.id}
                      to={`/products/${product.slug}`}
                      className="p-5 bg-slate-900/40 hover:bg-slate-900/70 border border-slate-900 hover:border-slate-800 rounded-2xl transition-all flex justify-between items-center group"
                    >
                      <div>
                        <h4 className="font-semibold text-slate-200 group-hover:text-white transition-colors">
                          {product.name}
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-1 mt-1 font-light">
                          {product.summary || product.description}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-655 group-hover:text-white transition-all transform group-hover:translate-x-1" />
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Gallery matches */}
            {results.gallery.length > 0 && (
              <section className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2 pl-2">
                  <Image className="w-4 h-4" />
                  Gallery Records ({results.gallery.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {results.gallery.map((item) => (
                    <a
                      key={item.id}
                      href="/#gallery"
                      className="p-4 bg-slate-900/40 border border-slate-900 rounded-2xl flex gap-4 items-center hover:bg-slate-900/70 transition-colors"
                    >
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-16 h-12 object-cover rounded-lg border border-slate-800"
                      />
                      <div>
                        <h4 className="font-medium text-sm text-slate-200">{item.title}</h4>
                        <span className="inline-block text-[10px] text-slate-500 font-light mt-0.5">
                          Category: {item.category_name}
                        </span>
                      </div>
                    </a>
                  ))}
                </div>
              </section>
            )}

            {/* Careers matches */}
            {results.careers.length > 0 && (
              <section className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2 pl-2">
                  <Briefcase className="w-4 h-4" />
                  Career Vacancies ({results.careers.length})
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {results.careers.map((job) => (
                    <a
                      key={job.id}
                      href="/#careers"
                      className="p-5 bg-slate-900/40 hover:bg-slate-900/70 border border-slate-900 hover:border-slate-800 rounded-2xl transition-all flex justify-between items-center group"
                    >
                      <div>
                        <div className="flex gap-2 items-center">
                          <h4 className="font-semibold text-slate-200 group-hover:text-white transition-colors">
                            {job.title}
                          </h4>
                          <span className="text-[9px] bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-slate-400">
                            {job.department}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 font-light">
                          Location: {job.location} | Experience: {job.experience_required}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-655 group-hover:text-white transition-all transform group-hover:translate-x-1" />
                    </a>
                  ))}
                </div>
              </section>
            )}

            {/* Empty state */}
            {queryParam && !loading && totalResults === 0 && (
              <div className="text-center py-16 bg-slate-900/20 border border-slate-900/60 rounded-3xl space-y-2">
                <SearchIcon className="w-10 h-10 mx-auto text-slate-700" />
                <h3 className="text-base font-semibold text-slate-300">No results found</h3>
                <p className="text-xs text-slate-500 font-light max-w-sm mx-auto px-4">
                  We couldn't find anything matching "{queryParam}". Check your spelling or try search tags like "LiDAR" or "Highway".
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
export default Search;
