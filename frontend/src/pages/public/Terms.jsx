import React from 'react';
import { PublicLayout } from '../../layouts/PublicLayout';

export function Terms() {
  return (
    <PublicLayout>
      <div className="relative min-h-screen bg-slate-950 py-20 px-6 font-sans">
        {/* Glow shapes */}
        <div className="absolute top-10 left-10 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto space-y-8">
          <div className="border-b border-slate-900 pb-6">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-100 sm:text-4xl">
              Terms of Service
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Last Updated: June 30, 2026
            </p>
          </div>

          <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed space-y-6">
            <p>
              Welcome to the official digital portal of Edge Route Vision Pvt. Ltd. ("ERV"). By accessing or navigating this website (<a href="https://www.edgeroutevision.com" className="text-brand-cyan hover:underline">www.edgeroutevision.com</a>), you agree to comply with and be bound by the following Terms of Service.
            </p>

            <h3 className="text-lg font-bold text-slate-200 uppercase tracking-wide pt-4 border-t border-slate-900/60">
              1. Intellectual Property
            </h3>
            <p>
              All content on this website, including but not limited to the ERV symbol logo, metallic visual designs, path telemetry software descriptions, product spec sheets, and text layout, is the exclusive intellectual property of Edge Route Vision Pvt. Ltd. and is protected by international trademark and copyright laws.
            </p>

            <h3 className="text-lg font-bold text-slate-200 uppercase tracking-wide pt-4 border-t border-slate-900/60">
              2. Permitted Use & Restrictions
            </h3>
            <p>
              You are granted a limited license to access information and download product brochures for internal, evaluation, or procurement planning purposes. You must not:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Modify, scrape, reverse-engineer, or duplicate website code or specs without written permission.</li>
              <li>Impersonate or submit false company details via contact forms.</li>
              <li>Decompile LDD or NSV device firmware or schemas listed.</li>
            </ul>

            <h3 className="text-lg font-bold text-slate-200 uppercase tracking-wide pt-4 border-t border-slate-900/60">
              3. Disclaimer & Warranty
            </h3>
            <p>
              While we update specs dynamically, all specifications, brochures, and documents are provided "as-is" without warranty. Final product performance parameters are verified during client-level systems engineering integrations.
            </p>

            <h3 className="text-lg font-bold text-slate-200 uppercase tracking-wide pt-4 border-t border-slate-900/60">
              4. Governing Law
            </h3>
            <p>
              These Terms of Service shall be governed by and construed in accordance with the laws applicable to Edge Route Vision's primary corporate registration location.
            </p>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
export default Terms;
