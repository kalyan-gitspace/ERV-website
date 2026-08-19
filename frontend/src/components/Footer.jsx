import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Linkedin, Mail, MapPin, Instagram, Facebook } from 'lucide-react';
import Logo from './Logo';
import api, { fetchSettings } from '../services/api';

const footerLinks = {
  Quick: [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about' },
    { label: 'Gallery', href: '/gallery' },
    { label: 'Careers', href: '/careers' },
  ],
  Products: [
    { label: 'LDD', href: '/products/ldd' },
    { label: 'NSV', href: '/products/nsv' },
    { label: 'Search', href: '/search' },
  ],
  Company: [
    { label: 'Privacy', href: '/privacy' },
    { label: 'Terms', href: '/terms' },
  ],
};

const SOCIAL_KEYS = {
  linkedin: 'social_linkedin',
  instagram: 'social_instagram',
  facebook: 'social_facebook',
};

export function Footer() {
  const [socialLinks, setSocialLinks] = useState({ linkedin: '', instagram: '', facebook: '' });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const settings = await fetchSettings();
        if (!mounted) return;
        setSocialLinks({
          linkedin: settings?.[SOCIAL_KEYS.linkedin] || '',
          instagram: settings?.[SOCIAL_KEYS.instagram] || '',
          facebook: settings?.[SOCIAL_KEYS.facebook] || '',
        });
      } catch (err) {
        // silently ignore
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <footer id="site-footer" className="border-t border-white/10 bg-[#000000]">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.2fr_.8fr]">
        <div className="space-y-8">
          <Link to="/" aria-label="ERV home" className="inline-flex">
            <Logo size="lg" />
          </Link>
          <div className="grid gap-6 text-sm text-slate-400 sm:grid-cols-2">
            <p className="max-w-sm leading-7">
              Precision route intelligence, edge visual systems, and survey technology for critical infrastructure teams.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-slate-400">
                <Mail className="h-4 w-4" />
                <span>info@edgeroutevision.com</span>
              </div>
              <a
                href="https://maps.app.goo.gl/vymEhQFAfmZbZquK9"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-slate-400 transition-colors hover:text-cyan-200"
              >
                <MapPin className="h-4 w-4" />
                Edge Route Vision Pvt. Ltd.
              </a>
            </div>
          </div>
        </div>

        <div className="grid gap-8 sm:grid-cols-3">
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="mb-4 text-xs font-extrabold uppercase text-slate-200">{title}</h3>
              <ul className="space-y-3 text-sm text-slate-500">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link to={link.href} className="transition-colors hover:text-cyan-200">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-y border-white/10 bg-white/[0.02]">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div />

          <div className="flex items-center gap-3">
            {socialLinks.linkedin ? (
              <a
                href={socialLinks.linkedin}
                target="_blank"
                rel="noreferrer noopener"
                className="icon-button"
                aria-label="LinkedIn"
                title="LinkedIn"
              >
                <Linkedin className="h-4 w-4" />
              </a>
            ) : (
              <div className="icon-button opacity-40" aria-hidden>
                <Linkedin className="h-4 w-4" />
              </div>
            )}

            {socialLinks.instagram ? (
              <a
                href={socialLinks.instagram}
                target="_blank"
                rel="noreferrer noopener"
                className="icon-button"
                aria-label="Instagram"
                title="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
            ) : (
              <div className="icon-button opacity-40" aria-hidden>
                <Instagram className="h-4 w-4" />
              </div>
            )}

            {socialLinks.facebook ? (
              <a
                href={socialLinks.facebook}
                target="_blank"
                rel="noreferrer noopener"
                className="icon-button"
                aria-label="Facebook"
                title="Facebook"
              >
                <Facebook className="h-4 w-4" />
              </a>
            ) : (
              <div className="icon-button opacity-40" aria-hidden>
                <Facebook className="h-4 w-4" />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>Copyright 2026 Edge Route Vision Pvt. Ltd. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;
