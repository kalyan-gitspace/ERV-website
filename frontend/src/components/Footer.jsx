import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Linkedin, Mail, MapPin, Send, Twitter, Youtube } from 'lucide-react';
import Logo from './Logo';

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
    { label: 'Specifications', href: '/products' },
    { label: 'Search', href: '/search' },
  ],
  Company: [
    { label: 'Contact', href: '/contact' },
    { label: 'Privacy', href: '/privacy' },
    { label: 'Terms', href: '/terms' },
    { label: 'Sitemap', href: '/sitemap' },
  ],
};

export function Footer() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);

  const subscribe = (event) => {
    event.preventDefault();
    if (!email.trim()) return;
    setDone(true);
    setEmail('');
  };

  return (
    <footer className="border-t border-white/10 bg-[#020617]">
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
              <a href="mailto:info@edgeroutevision.com" className="flex items-center gap-3 text-slate-400 transition-colors hover:text-cyan-200">
                <Mail className="h-4 w-4" />
                info@edgeroutevision.com
              </a>
              <p className="flex items-center gap-3 text-slate-400">
                <MapPin className="h-4 w-4" />
                Global engineering operations
              </p>
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
          <form onSubmit={subscribe} className="grid gap-3 sm:grid-cols-[minmax(0,360px)_auto]">
            <label className="sr-only" htmlFor="footer-newsletter">Email address</label>
            <input
              id="footer-newsletter"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={done ? 'Updates enabled' : 'Engineering updates email'}
              className="h-11 border border-white/10 bg-[#030712]/70 px-3 text-sm text-white outline-none transition-colors placeholder:text-slate-600 focus:border-cyan-300/70"
            />
            <button type="submit" className="inline-flex h-11 items-center justify-center gap-2 bg-[#2563EB] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#60A5FA]">
              <Send className="h-4 w-4" />
              Subscribe
            </button>
          </form>

          <div className="flex items-center gap-2">
            {[
              { href: 'https://linkedin.com/company/edge-route-vision', label: 'LinkedIn', icon: Linkedin },
              { href: 'https://twitter.com/edgeroutevision', label: 'Twitter', icon: Twitter },
              { href: 'https://youtube.com/c/edgeroutevision', label: 'YouTube', icon: Youtube },
            ].map(({ href, label, icon: Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                className="icon-button"
                aria-label={label}
                title={label}
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>Copyright 2026 Edge Route Vision Pvt. Ltd. All rights reserved.</p>
        <Link to="/contact" className="inline-flex items-center gap-2 text-slate-500 transition-colors hover:text-cyan-200">
          Contact Us
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </footer>
  );
}

export default Footer;
