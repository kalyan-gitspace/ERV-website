import React, { useEffect, useState } from 'react';
import { Menu, Search, X } from 'lucide-react';
import Logo from './Logo';

const navItems = ['Home', 'About Us', 'Products', 'Gallery', 'Careers', 'Contact'];

export function Navbar() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const closeOnResize = () => {
      if (window.innerWidth >= 768) setOpen(false);
    };

    window.addEventListener('resize', closeOnResize);
    return () => window.removeEventListener('resize', closeOnResize);
  }, []);

  return (
    <header className="fixed left-0 top-0 z-50 h-[72px] w-full bg-[#000000]">
      <nav className="mx-auto flex h-full max-w-[1440px] items-center justify-between px-6 sm:px-12" aria-label="Primary navigation">
        <a href="#home" aria-label="ERV home" className="flex shrink-0 items-center">
          <Logo size="nav" />
        </a>

        <div className="hidden items-center gap-[34px] md:flex">
          {navItems.map((item) => {
            const active = item === 'Home';
            return (
              <a
                key={item}
                href={item === 'Search' ? '/search' : `#${item.toLowerCase().replace(/\s/g, '')}`}
                className={`relative py-2 text-[17px] font-semibold tracking-normal transition-colors duration-300 ${
                  active ? 'text-[#38BDF8]' : 'text-white hover:text-[#60A5FA]'
                }`}
              >
                {item}
                {active ? (
                  <span className="absolute -bottom-4 left-0 h-px w-full bg-[#38BDF8]" />
                ) : null}
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
