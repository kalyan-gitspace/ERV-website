import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, MessageCircle, Phone, Search, X } from 'lucide-react';
import Logo from './Logo';

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'About Us', to: '/about' },
  { label: 'Products', to: '/products/ldd' },
  { label: 'Gallery', to: '/gallery' },
  { label: 'Careers', to: '/careers' },
  { label: 'Contact', to: '#contact' },
];

const productDropdownItems = [
  { label: 'Network Survey Vehicle (NSV)', to: '/products/nsv' },
  { label: 'Mobile Bridge Inspecting Unit (MBIU)', to: '/products/mbiu' },
  { label: 'Laser Dynamic Deflectometer (LDD)', to: '/products/ldd' },
  { label: 'Pothole Filling Machine (PFM)', to: '/products/pfm' },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('Home');
  const [productsOpen, setProductsOpen] = useState(false);
  const location = useLocation();

  const handleProductsHover = (value) => setProductsOpen(value);

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
    <header className="fixed left-0 top-0 z-50 h-[72px] w-full bg-[#000000]">
      <nav className="mx-auto flex h-full max-w-[1440px] items-center justify-between px-6 sm:px-12" aria-label="Primary navigation">
        <Link to="/" aria-label="ERV home" className="flex shrink-0 items-center">
          <Logo size="nav" />
        </Link>

        <div className="hidden flex-1 items-center justify-start md:flex">
          <div className="ml-50 flex flex-1 items-center gap-[18px] lg:gap-[24px]">
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
                    <Link
                      to={item.to}
                      className={`group relative py-2 text-[17px] font-semibold tracking-normal transition-colors duration-300 ${
                        active ? 'text-[#38BDF8]' : 'text-white hover:text-[#60A5FA]'
                      }`}
                    >
                      {item.label}
                      <span
                        className="absolute -bottom-4 left-0 h-[2px] w-0 bg-[#38BDF8] origin-left transition-all duration-300 group-hover:w-full"
                      />
                    </Link>

                    <AnimatePresence>
                      {productsOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.3, ease: 'easeOut' }}
                          className="absolute left-0 top-full z-50 mt-3 w-[300px] rounded-2xl border border-white/10 bg-[#111111]/[0.98] p-4 shadow-[0_30px_80px_rgba(0,0,0,0.32)]"
                        >
                          <div className="absolute left-6 top-[-8px] h-3 w-3 rotate-45 rounded-sm bg-[#111111]/[0.98] border-l border-t border-white/10" />
                          <div className="flex flex-col gap-2">
                            {productDropdownItems.map((product) => (
                              <Link
                                key={product.label}
                                to={product.to}
                                className="block rounded-2xl px-3 py-3 text-white transition-all duration-300 hover:text-[#38BDF8] hover:translate-x-1"
                              >
                                {product.label}
                              </Link>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              }

              return (
                <Link
                  key={item.label}
                  to={item.to.startsWith('#') ? '/' : item.to}
                  className={`group relative py-2 text-[17px] font-semibold tracking-normal transition-colors duration-300 ${
                    active ? 'text-[#38BDF8]' : 'text-white hover:text-[#60A5FA]'
                  }`}
                >
                  {item.label}
                  <span
                    className="absolute -bottom-4 left-0 h-[2px] w-0 bg-[#38BDF8] origin-left transition-all duration-300 group-hover:w-full"
                  />
                </Link>
              );
            })}

            <div className="ml-auto flex items-center gap-3">
              <a
                href="tel:+918921084025"
                className="inline-flex h-[42px] items-center gap-2 rounded-full border border-[#38BDF8]/40 bg-transparent px-[14px] text-[14px] font-semibold text-[#38BDF8] transition-all duration-300 hover:border-[#38BDF8] hover:bg-[#38BDF8]/10 hover:text-[#7DD3FC]"
              >
                <Phone className="h-4 w-4" strokeWidth={2} />
                +91 8921084025
              </a>
              <a
                href="https://wa.me/918921084025"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-[42px] items-center gap-2 rounded-full border border-[#25D366]/40 bg-transparent px-[14px] text-[14px] font-semibold text-[#25D366] transition-all duration-300 hover:border-[#25D366] hover:bg-[#25D366]/10 hover:text-[#4ADE80]"
              >
                <MessageCircle className="h-4 w-4" strokeWidth={2} />
                +91 8921084025
              </a>
              <Link
                to="/search"
                className="inline-flex h-[42px] items-center gap-2 rounded-full border border-white/20 bg-transparent px-[14px] text-[14px] font-semibold text-white transition-all duration-300 hover:border-[#60A5FA] hover:bg-[#60A5FA]/10 hover:text-[#60A5FA]"
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
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.to.startsWith('#') ? '/' : item.to}
                onClick={() => setOpen(false)}
                className="py-3 text-[17px] font-semibold text-white transition-colors duration-300 hover:text-[#60A5FA]"
              >
                {item.label}
              </Link>
            ))}
            <a
              href="tel:+918921084025"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-full border border-[#38BDF8]/40 px-4 py-3 text-[17px] font-semibold text-[#38BDF8] transition-colors duration-300 hover:border-[#38BDF8] hover:bg-[#38BDF8]/10"
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
