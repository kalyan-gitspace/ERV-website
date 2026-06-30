import React from 'react';
import { Link } from 'react-router-dom';
import { PublicLayout } from '../../layouts/PublicLayout';

export function Sitemap() {
  const links = [
    { title: 'Home Page', path: '/' },
    { title: 'About Section', path: '/#about' },
    { title: 'Careers', path: '/#careers' },
    { title: 'Global Search Catalog', path: '/search' },
    { title: 'Contact Us', path: '/#contact' },
    { title: 'Products Showcase', path: '/#products' },
    { title: 'Gallery masonry', path: '/#gallery' },
    { title: 'NSV Dynamic detail', path: '/products/nsv' },
    { title: 'LDD Dynamic detail', path: '/products/ldd' },
    { title: 'Privacy Policy', path: '/privacy' },
    { title: 'Terms & Conditions', path: '/terms' },
    { title: 'Admin login (Protected)', path: '/admin/login' },
    { title: 'Admin dashboard (Protected)', path: '/admin' },
  ];

  return (
    <PublicLayout>
      <div className="relative min-h-screen bg-slate-950 py-20 px-6 font-sans">
        <div className="absolute top-10 left-10 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto space-y-8">
          <div className="border-b border-slate-900 pb-6">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-100 sm:text-4xl">
              Sitemap
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Complete index of ERV web structures.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="p-4 bg-slate-900/40 hover:bg-slate-900/80 border border-slate-900 hover:border-slate-800 rounded-2xl transition-all flex justify-between items-center text-sm font-medium text-slate-300 hover:text-white"
              >
                <span>{link.title}</span>
                <span className="text-xs font-mono text-slate-500">{link.path}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
export default Sitemap;
