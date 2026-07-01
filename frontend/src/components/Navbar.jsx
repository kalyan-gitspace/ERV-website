import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, Search, X } from 'lucide-react';
import Logo from './Logo';

const navItems = ['Home', 'About Us', 'Products', 'Gallery', 'Careers', 'Contact'];

const productDropdownItems = [
  'Network Survey Vehicle (NSV)',
  'Mobile Bridge Inspecting Unit (MBIU)',
  'Falling Weight Deflectometer (FWD)',
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('Home');
  const [productsOpen, setProductsOpen] = useState(false);

  const handleProductsHover = (value) => setProductsOpen(value);

  useEffect(() => {
    const closeOnResize = () => {
      if (window.innerWidth >= 768) setOpen(false);
    };

    const normalized = (value) => value.toLowerCase().replace(/\s/g, '');
    const updateActiveFromHash = () => {
      const hash = window.location.hash.slice(1).toLowerCase();
      const section = navItems.find((item) => normalized(item) === hash);
      if (section) {
        setActiveSection(section);
      } else if (!hash) {
        setActiveSection('Home');
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleSections = entries.filter((entry) => entry.isIntersecting);
        if (visibleSections.length > 0) {
          const bestSection = visibleSections.reduce((best, entry) =>
            entry.intersectionRatio > best.intersectionRatio ? entry : best
          );
          const sectionId = bestSection.target.id;
          const section = navItems.find((item) => normalized(item) === sectionId);
          if (section) setActiveSection(section);
        }
      },
      {
        root: null,
        rootMargin: '-45% 0px -45% 0px',
        threshold: [0.25, 0.5, 0.75],
      }
    );

    const sectionIds = navItems.map((item) => normalized(item));
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
  }, []);

  return (
    <header className="fixed left-0 top-0 z-50 h-[72px] w-full bg-[#000000]">
      <nav className="mx-auto flex h-full max-w-[1440px] items-center justify-between px-6 sm:px-12" aria-label="Primary navigation">
        <a href="#home" aria-label="ERV home" className="flex shrink-0 items-center">
          <Logo size="nav" />
        </a>

        <div className="hidden items-center gap-[34px] md:flex">
          {navItems.map((item) => {
            const active = activeSection === item;
            if (item === 'Products') {
              return (
                <div
                  key={item}
                  className="relative"
                  onMouseEnter={() => handleProductsHover(true)}
                  onMouseLeave={() => handleProductsHover(false)}
                >
                  <a
                    href={`#${item.toLowerCase().replace(/\s/g, '')}`}
                    className={`group relative py-2 text-[17px] font-semibold tracking-normal transition-colors duration-300 ${
                      active ? 'text-[#38BDF8]' : 'text-white hover:text-[#60A5FA]'
                    }`}
                  >
                    {item}
                    <span
                      className="absolute -bottom-4 left-0 h-[2px] w-0 bg-[#38BDF8] origin-left transition-all duration-300 group-hover:w-full"
                    />
                  </a>

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
                            <a
                              key={product}
                              href={`#${product.toLowerCase().replace(/\s/g, '')}`}
                              className="block rounded-2xl px-3 py-3 text-white transition-all duration-300 hover:text-[#38BDF8] hover:translate-x-1"
                            >
                              {product}
                            </a>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            }

            return (
              <a
                key={item}
                href={item === 'Search' ? '/search' : `#${item.toLowerCase().replace(/\s/g, '')}`}
                className={`group relative py-2 text-[17px] font-semibold tracking-normal transition-colors duration-300 ${
                  active ? 'text-[#38BDF8]' : 'text-white hover:text-[#60A5FA]'
                }`}
              >
                {item}
                <span
                  className="absolute -bottom-4 left-0 h-[2px] w-0 bg-[#38BDF8] origin-left transition-all duration-300 group-hover:w-full"
                />
              </a>
            );
          })}

          <a
            href="/search"
            className="inline-flex h-[46px] items-center gap-2 rounded-full border border-white bg-transparent px-[22px] text-[17px] font-semibold text-white transition-colors duration-300 hover:text-[#60A5FA]"
            aria-label="Search"
          >
            <Search className="h-5 w-5" strokeWidth={2} />
            Search
          </a>
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
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/\s/g, '')}`}
                onClick={() => setOpen(false)}
                className="py-3 text-[17px] font-semibold text-white transition-colors duration-300 hover:text-[#60A5FA]"
              >
                {item}
              </a>
            ))}
            <a
              href="/search"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-full border border-white px-4 py-3 text-[17px] font-semibold text-white transition-colors duration-300 hover:text-[#60A5FA]"
            >
              <Search className="h-5 w-5" />
              Search
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;
