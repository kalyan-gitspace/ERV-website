import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, MessageCircle, Phone, Search, X } from 'lucide-react';
import Logo from './Logo';
import api from '../services/api';

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'About Us', to: '/about' },
  { label: 'Products' },
  { label: 'Gallery', to: '/gallery' },
  { label: 'Careers', to: '/careers' },
  { label: 'Contact', to: '#contact' },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('Home');
  const [productsOpen, setProductsOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const location = useLocation();
  
  const handleContactClick = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const tryScroll = () => {
      const el = document.getElementById('site-footer');
      if (el) {
        try {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } catch (err) {
          el.scrollIntoView();
        }
        return true;
      }
      return false;
    };

    if (tryScroll()) return;

    // If footer not yet in DOM, poll for a short time
    let attempts = 0;
    const id = setInterval(() => {
      attempts += 1;
      if (tryScroll() || attempts > 30) {
        clearInterval(id);
      }
    }, 100);
  };

  const handleProductsHover = (value) => setProductsOpen(value);

  useEffect(() => {
    let cancelled = false;

    const loadProducts = async () => {
      try {
        const response = await api.get('/products');
        const records = Array.isArray(response) ? response : response?.data || [];
        const enabledProducts = records.filter((product) => product?.status === 'enabled' && product?.slug);
        if (!cancelled) setProducts(enabledProducts);
      } catch (error) {
        console.error('[navbar] unable to load products', error);
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setProductsLoading(false);
      }
    };

    loadProducts();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const closeOnResize = () => {
      if (window.innerWidth >= 768) setOpen(false);
    };

    const normalized = (value) => value.toLowerCase().replace(/\s/g, '');
    const updateActiveFromHash = () => {
      const hash = window.location.hash.slice(1).toLowerCase();
      const section = navItems.find((item) => normalized(item.label) === hash);
      if (section) {
        setActiveSection(section.label);
      } else if (!hash) {
        setActiveSection('Home');
      }
    };

    if (location.pathname === '/about') {
      setActiveSection('About Us');
      window.removeEventListener('hashchange', updateActiveFromHash);
      window.addEventListener('resize', closeOnResize);
      return () => window.removeEventListener('resize', closeOnResize);
    }

    if (location.pathname === '/gallery') {
      setActiveSection('Gallery');
      window.removeEventListener('hashchange', updateActiveFromHash);
      window.addEventListener('resize', closeOnResize);
      return () => window.removeEventListener('resize', closeOnResize);
    }

    if (location.pathname === '/careers') {
    setActiveSection('Careers');
    window.removeEventListener('hashchange', updateActiveFromHash);
    window.addEventListener('resize', closeOnResize);

    return () => window.removeEventListener('resize', closeOnResize);
    }

    if (location.pathname.startsWith('/products')) {
      setActiveSection('Products');
      window.removeEventListener('hashchange', updateActiveFromHash);
      window.addEventListener('resize', closeOnResize);
      return () => window.removeEventListener('resize', closeOnResize);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleSections = entries.filter((entry) => entry.isIntersecting);
        if (visibleSections.length > 0) {
          const bestSection = visibleSections.reduce((best, entry) =>
            entry.intersectionRatio > best.intersectionRatio ? entry : best
          );
          const sectionId = bestSection.target.id;
          const section = navItems.find((item) => normalized(item.label) === sectionId);
          if (section) setActiveSection(section.label);
        }
      },
      {
        root: null,
        rootMargin: '-45% 0px -45% 0px',
        threshold: [0.25, 0.5, 0.75],
      }
    );

    const sectionIds = navItems.map((item) => normalized(item.label));
    sectionIds.forEach((id) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });

    window.addEventListener('resize', closeOnResize);
    window.addEventListener('hashchange', updateActiveFromHash);
    updateActiveFromHash();

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', closeOnResize);
      window.removeEventListener('hashchange', updateActiveFromHash);
    };
  }, [location.pathname]);

  return (
    <header className="fixed left-0 top-0 z-50 h-18 w-full bg-black">
      <nav className="mx-auto flex h-full max-w-360 items-center justify-between px-6 sm:px-12" aria-label="Primary navigation">
        <Link to="/" aria-label="ERV home" className="flex shrink-0 items-center">
          <Logo size="nav" />
        </Link>

        <div className="hidden flex-1 items-center justify-start md:flex">
          <div className="ml-50 flex flex-1 items-center gap-4.5 lg:gap-6">
            {navItems.map((item) => {
              const active = activeSection === item.label;
              if (item.label === 'Products') {
                return (
                  <div
                    key={item.label}
                    className="relative"
                    onMouseEnter={() => handleProductsHover(true)}
                    onMouseLeave={() => handleProductsHover(false)}
                  >
                    <button
                      type="button"
                      aria-haspopup="menu"
                      aria-expanded={productsOpen}
                      className={`group relative py-2 text-[17px] font-semibold tracking-normal transition-colors duration-300 ${
                        active ? 'text-brand-cyan' : 'text-white hover:text-[#60A5FA]'
                      }`}
                    >
                      {item.label}
                      <span
                        className="absolute -bottom-4 left-0 h-0.5 w-0 bg-brand-cyan origin-left transition-all duration-300 group-hover:w-full"
                      />
                    </button>

                    <AnimatePresence>
                      {productsOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.3, ease: 'easeOut' }}
                          className="absolute left-0 top-full z-50 mt-0 w-75 rounded-2xl border border-white/10 bg-[#111111]/98 p-4 shadow-[0_30px_80px_rgba(0,0,0,0.32)]"
                        >
                          <div className="absolute left-6 -top-2 h-3 w-3 rotate-45 rounded-sm bg-[#111111]/98 border-l border-t border-white/10" />
                          <div className="flex flex-col gap-2">
                            {productsLoading && (
                              <span className="px-3 py-3 text-sm text-slate-400">Loading products...</span>
                            )}
                            {!productsLoading && products.length === 0 && (
                              <span className="px-3 py-3 text-sm text-slate-400">No products available</span>
                            )}
                            {!productsLoading && products.map((product) => (
                              <Link
                                key={product.id || product.slug}
                                to={`/products/${product.slug}`}
                                className="block rounded-2xl px-3 py-3 text-white transition-all duration-300 hover:text-brand-cyan hover:translate-x-1"
                              >
                                {product.name}
                              </Link>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              }

              if (item.label === 'Contact') {
                return (
                  <button
                    key={item.label}
                    onClick={handleContactClick}
                    className={`group relative py-2 text-[17px] font-semibold tracking-normal transition-colors duration-300 ${
                      active ? 'text-brand-cyan' : 'text-white hover:text-[#60A5FA]'
                    }`}
                  >
                    {item.label}
                    <span className="absolute -bottom-4 left-0 h-0.5 w-0 bg-brand-cyan origin-left transition-all duration-300 group-hover:w-full" />
                  </button>
                );
              }

              return (
                <Link
                  key={item.label}
                  to={item.to.startsWith('#') ? '/' : item.to}
                  className={`group relative py-2 text-[17px] font-semibold tracking-normal transition-colors duration-300 ${
                    active ? 'text-brand-cyan' : 'text-white hover:text-[#60A5FA]'
                  }`}
                >
                  {item.label}
                  <span
                    className="absolute -bottom-4 left-0 h-0.5 w-0 bg-brand-cyan origin-left transition-all duration-300 group-hover:w-full"
                  />
                </Link>
              );
            })}

            <div className="ml-auto flex items-center gap-3">
              <a
                href="tel:+918921084025"
                className="inline-flex h-10.5 items-center gap-2 rounded-full border border-brand-cyan/40 bg-transparent px-3.5 text-[14px] font-semibold text-brand-cyan transition-all duration-300 hover:border-brand-cyan hover:bg-brand-cyan/10 hover:text-[#7DD3FC]"
              >
                <Phone className="h-4 w-4" strokeWidth={2} />
                +91 8921084025
              </a>
              <a
                href="https://wa.me/918921084025"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10.5 items-center gap-2 rounded-full border border-[#25D366]/40 bg-transparent px-3.5 text-[14px] font-semibold text-[#25D366] transition-all duration-300 hover:border-[#25D366] hover:bg-[#25D366]/10 hover:text-[#4ADE80]"
              >
                <MessageCircle className="h-4 w-4" strokeWidth={2} />
                +91 8921084025
              </a>
              <Link
                to="/search"
                className="inline-flex h-10.5 items-center gap-2 rounded-full border border-white/20 bg-transparent px-3.5 text-[14px] font-semibold text-white transition-all duration-300 hover:border-[#60A5FA] hover:bg-[#60A5FA]/10 hover:text-[#60A5FA]"
              >
                <Search className="h-4 w-4" strokeWidth={2} />
                Search
              </Link>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center text-white transition-colors duration-300 hover:text-[#60A5FA] md:hidden"
          aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
        >
          {open ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
        </button>
      </nav>

      {open && (
        <div className="mx-5 border border-white/10 bg-[#000000] px-5 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {navItems.map((item) => {
              if (item.label === 'Contact') {
                return (
                  <button
                    key={item.label}
                    onClick={(e) => { handleContactClick(e); setOpen(false); }}
                    className="py-3 text-[17px] font-semibold text-white transition-colors duration-300 hover:text-[#60A5FA]"
                  >
                    {item.label}
                  </button>
                );
              }

              if (item.label === 'Products') {
                return (
                  <div key={item.label} className="space-y-1">
                    <button
                      type="button"
                      onClick={() => setProductsOpen((current) => !current)}
                      className="w-full py-3 text-left text-[17px] font-semibold text-white transition-colors duration-300 hover:text-[#60A5FA]"
                    >
                      {item.label}
                    </button>
                    {productsOpen && (
                      <div className="ml-4 flex flex-col gap-1 border-l border-white/10 pl-4">
                        {productsLoading && <span className="py-2 text-sm text-slate-400">Loading products...</span>}
                        {!productsLoading && products.length === 0 && <span className="py-2 text-sm text-slate-400">No products available</span>}
                        {!productsLoading && products.map((product) => (
                          <Link
                            key={product.id || product.slug}
                            to={`/products/${product.slug}`}
                            onClick={() => setOpen(false)}
                            className="py-2 text-sm text-slate-300 transition-colors duration-300 hover:text-[#60A5FA]"
                          >
                            {product.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={item.label}
                  to={item.to.startsWith('#') ? '/' : item.to}
                  onClick={() => setOpen(false)}
                  className="py-3 text-[17px] font-semibold text-white transition-colors duration-300 hover:text-[#60A5FA]"
                >
                  {item.label}
                </Link>
              );
            })}
            <a
              href="tel:+918921084025"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-full border border-brand-cyan/40 px-4 py-3 text-[17px] font-semibold text-brand-cyan transition-colors duration-300 hover:border-brand-cyan hover:bg-brand-cyan/10"
            >
              <Phone className="h-5 w-5" />
              Call +91 8921084025
            </a>
            <a
              href="https://wa.me/918921084025"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-full border border-[#25D366]/40 px-4 py-3 text-[17px] font-semibold text-[#25D366] transition-colors duration-300 hover:border-[#25D366] hover:bg-[#25D366]/10"
            >
              <MessageCircle className="h-5 w-5" />
              WhatsApp +91 8921084025
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;
