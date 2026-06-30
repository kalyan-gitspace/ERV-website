import React, { useMemo } from 'react';
import { ArrowRight, CalendarDays, Globe2, Users, Target, MapPin } from 'lucide-react';
import Logo from '../../components/Logo';
import Navbar from '../../components/Navbar';
import SEO from '../../components/SEO';
import heroImage from '../../assets/hero.png';

const heroLines = ['Intelligent Solutions', 'for a Connected Future'];

const stats = [
  { value: '2018', label: 'Established', icon: CalendarDays },
  { value: '100+', label: 'Projects', icon: MapPin },
  { value: '4+', label: 'Countries', icon: Globe2 },
  { value: '50+', label: 'Clients', icon: Users },
  { value: '99.9%', label: 'Accuracy', icon: Target },
];

function HeroHeading() {
  return (
    <div className="relative mt-8 w-[780px] max-w-none z-20">
      {heroLines.map((line) => (
        <p key={line} className="whitespace-nowrap mb-3 last:mb-0 text-[72px] font-[550] leading-[0.92] tracking-[-0.04em] text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
          {line}
        </p>
      ))}
    </div>
  );
}

function StatsCard() {
  return (
    <div className="mt-12 grid w-full grid-cols-2 gap-3 rounded-[24px] border border-white/8 bg-[rgba(10,10,10,0.95)] p-[34px] backdrop-blur-[10px] text-white sm:grid-cols-5 sm:gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.value} className="flex flex-col items-center justify-center gap-3 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[#38BDF8]">
              <Icon className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <p className="text-[28px] font-semibold leading-none">{stat.value}</p>
            <span className="text-sm font-medium uppercase tracking-[0.18em] text-[#D1D5DB]">{stat.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export function HomePage() {
  const pageSchema = useMemo(() => ({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'ERV',
    legalName: 'Edge Route Vision Pvt. Ltd.',
    url: window.location.origin,
  }), []);

  return (
    <main id="home" className="min-h-screen overflow-hidden bg-[#01030A] font-sans text-white">
      <SEO
        title="Engineering Smarter Roads"
        description="ERV delivers advanced road and infrastructure intelligence through cutting-edge engineering, precision surveying technology, and innovative data-driven solutions."
        path="/"
        schema={pageSchema}
      />
      <Navbar />

      <section className="relative min-h-screen bg-[#01030A]">
        <div className="absolute right-0 top-0 bottom-0 bg-[#01030A]" />

        <div className="relative z-10 mx-auto flex min-h-screen max-w-[1720px] flex-col px-6 pt-[104px] sm:px-8 lg:flex-row lg:items-center lg:gap-6 lg:px-12 lg:pt-[72px]">
          <div className="flex w-full flex-col justify-center lg:w-[37%] -mt-70">
            <div className="flex items-center gap-4">
             <div className="h-[2px] w-[44px] rounded-full bg-[#2EA7FF]" />
             <p className="text-[16px] font-medium leading-[26px] tracking-[-0.01em] text-[#2EA7FF] m-0" style={{ fontFamily: 'Inter, sans-serif' }}>
                Engineering Smarter Roads. Powering Intelligent Infrastructure.
             </p>
        </div>
            <HeroHeading />
            <p className="mt-[34px] mb-[30px] max-w-[500px] text-[20px] leading-[1.7] tracking-normal text-[#C8D0D9]">
              ERV delivers advanced road and infrastructure data intelligence through cutting-edge technology, precision systems, and innovative engineering.
            </p>
            <div className="mb-[30px]">
              <a
                href="#solutions"
                className="inline-flex items-center gap-[14px] text-[20px] font-semibold text-white transition-colors duration-300 hover:text-[#60A5FA]"
              >
                Explore Our Solutions
                <ArrowRight className="h-5 w-5 text-[#2EA7FF]" strokeWidth={2} />
              </a>
            </div>
            <div className="mt-[30px] sm:mt-[34px]">
              <StatsCard />
            </div>
          </div>

          <div className="relative mt-0 h-[1100px] w-full lg:w-[100%] overflow-hidden">
            <img
              src={heroImage}
              alt="NSV vehicle"
              className="absolute inset-0 w-full h-[75%] object-contain"
              style={{ top: "-15%",left: "0", objectPosition: "72% center" }}
            />
            <div
              className="absolute inset-y-0 left-0 w-full"
              style={{
                background: 'linear-gradient(90deg, rgba(0,0,0,0.96) 0%, rgba(0,0,0,.88) 14%, rgba(0,0,0,.72) 24%, rgba(0,0,0,.42) 38%, rgba(0,0,0,.12) 52%, rgba(0,0,0,.00) 65%)'
              }}
            />
          </div>
        </div>
      </section>
    </main>
  );
}

export default HomePage;
