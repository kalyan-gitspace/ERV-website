import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Linkedin, Mail, MapPin, Instagram, Facebook, Youtube } from 'lucide-react';
import Logo from './Logo';
import api, { fetchSettings } from '../services/api';

const quickFooterLinks = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'Careers', href: '/careers' },
];

const companyFooterLinks = [
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
];

const extractProductLabel = (name) => {
  if (typeof name !== 'string') return '';
  const match = name.match(/\(([^)]+)\)/);
  if (match?.[1]?.trim()) return match[1].trim();
  return name.trim();
};

const SOCIAL_KEYS = {
  linkedin: 'social_linkedin',
  instagram: 'social_instagram',
  facebook: 'social_facebook',
  youtube: 'social_youtube',
};

export function Footer() {
  const [socialLinks, setSocialLinks] = useState({ linkedin: '', instagram: '', facebook: '', youtube: '' });
  const [productLinks, setProductLinks] = useState([]);

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
          youtube: settings?.[SOCIAL_KEYS.youtube] || '',
        });
      } catch (err) {
        // silently ignore
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadProducts = async () => {
      try {
        const response = await api.get('/products');
        const records = Array.isArray(response) ? response : response?.data || [];

        const links = records
          .filter((product) => product?.status === 'enabled' && product?.slug && product?.name)
          .slice(0, 4)
          .map((product) => ({
            key: product.id || product.slug,
            label: extractProductLabel(product.name),
            href: `/products/${product.slug}`,
          }))
          .filter((link) => link.label && link.href);

        if (mounted) setProductLinks(links);
      } catch (err) {
        if (mounted) setProductLinks([]);
      }
    };

    loadProducts();
    return () => { mounted = false; };
  }, []);

  const footerSections = [
    { title: 'Quick', links: quickFooterLinks },
    { title: 'Products', links: productLinks },
    { title: 'Company', links: companyFooterLinks },
  ];

  return (
    <footer id="site-footer" className="border-t border-white/10 bg-[#000000]">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.2fr_.8fr]">
        <div className="space-y-8">
          <Link to="/" aria-label="ERV home" className="inline-flex">
            <Logo variant="footer" size="footer" alt="Edge Route Vision Pvt. Ltd." />
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
          {footerSections.map(({ title, links }) => (
            <div key={title}>
              <h3 className="mb-4 text-xs font-extrabold uppercase text-slate-200">{title}</h3>
              <ul className="space-y-3 text-sm text-slate-500">
                {links.map((link) => (
                  <li key={link.key || link.href}>
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

            {socialLinks.youtube ? (
              <a
                href={socialLinks.youtube}
                target="_blank"
                rel="noreferrer noopener"
                className="icon-button"
                aria-label="YouTube"
                title="YouTube"
              >
                <Youtube className="h-4 w-4" />
              </a>
            ) : (
              <div className="icon-button opacity-40" aria-hidden>
                <Youtube className="h-4 w-4" />
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
