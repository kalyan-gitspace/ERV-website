import React from 'react';
import { PublicLayout } from '../../layouts/PublicLayout';

export function Privacy() {
  return (
    <PublicLayout>
      <div className="relative min-h-screen bg-slate-950 py-20 px-6 font-sans">
        {/* Glow shapes */}
        <div className="absolute top-10 left-10 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto space-y-8">
          <div className="border-b border-slate-900 pb-6">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-100 sm:text-4xl">
              Privacy Policy
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Last Updated: June 30, 2026
            </p>
          </div>

          <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed space-y-6">
            <p>
              Edge Route Vision Pvt. Ltd. ("ERV", "we", "us", or "our") values and respects your privacy. This Privacy Policy details how we collect, utilize, log, and protect information when you access or interact with our public website (<a href="https://www.edgeroutevision.com" className="text-brand-cyan hover:underline">www.edgeroutevision.com</a>) and use our pathway optical visual intelligence sensors, products, and associated system resources.
            </p>

            <h3 className="text-lg font-bold text-slate-200 uppercase tracking-wide pt-4 border-t border-slate-900/60">
              1. Information Collection
            </h3>
            <p>
              We collect information to deliver world-class path diagnostics telemetry and customer-specific solutions. This includes:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Contact Inquiry Information:</strong> Full name, company affiliation, email address, phone details, and message details you voluntarily provide through our contact form.</li>
              <li><strong>Device Analytics:</strong> IP address, browser metadata, operating systems, and page navigation trends gathered through persistent web analytics packages.</li>
            </ul>

            <h3 className="text-lg font-bold text-slate-200 uppercase tracking-wide pt-4 border-t border-slate-900/60">
              2. Use of Information
            </h3>
            <p>
              Your data is processed under strict corporate security protocols:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>To fulfill product demonstrations and engineering inquiries.</li>
              <li>To enhance the performance, visual layouts, and loading speeds of our web systems.</li>
              <li>To deliver newsletters and careers openings updates if requested.</li>
            </ul>

            <h3 className="text-lg font-bold text-slate-200 uppercase tracking-wide pt-4 border-t border-slate-900/60">
              3. Data Security & Storage
            </h3>
            <p>
              We implement industry-standard database encryption and physical security limits to ensure route meta-data and credentials remain completely secure. We never sell, lease, or monetize user data with third-party networks.
            </p>

            <h3 className="text-lg font-bold text-slate-200 uppercase tracking-wide pt-4 border-t border-slate-900/60">
              4. Contact Privacy Officer
            </h3>
            <p>
              For privacy audits, data deletion requests, or compliance inquiries, please get in touch with our corporate office at:
              <br />
              <strong>Email:</strong> privacy@edgeroutevision.com
            </p>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
export default Privacy;
