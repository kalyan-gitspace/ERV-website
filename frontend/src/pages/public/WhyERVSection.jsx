import React from 'react';
import { BarChart3, ShieldCheck, Sparkles } from 'lucide-react';

export default function WhyERVSection() {
  const cards = [
    {
      title: 'Advanced Expertise',
      description:
        'Decades of road assessment and surveying experience drive smarter infrastructure decisions and maintenance planning.',
      icon: BarChart3,
    },
    {
      title: 'Proven Solutions',
      description:
        'Trusted, tested, and deployed technology that delivers measurable results for road asset management worldwide.',
      icon: ShieldCheck,
    },
    {
      title: 'Safety First',
      description:
        'Intelligent systems built to extend asset life and create safer journeys through data-driven road intelligence.',
      icon: Sparkles,
    },
  ];

  return (
    <section className="relative -mt-[230px] w-full bg-[#01030A] pt-[-100px] pb-24">
      <div className="mx-auto max-w-[1720px] px-6 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[960px] text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#2EA7FF]">Why ERV</p>
          <h2 className="mt-6 text-[44px] font-[550] leading-[1.05] text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Reveal Hidden Road Risks: ERV&apos;s Data-Powered Intelligence
          </h2>
          <p className="mx-auto mt-6 max-w-[740px] text-[20px] leading-[1.75] text-[#C8D0D9]">
            Our solutions uncover unseen issues, optimize maintenance strategies, and keep infrastructure safer with precision insights.
          </p>
        </div>

        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.title} className="rounded-[24px] border border-white/10 bg-white/5 p-8 text-white shadow-[0_40px_120px_rgba(0,0,0,0.25)]">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#111827] text-[#2EA7FF]">
                  <Icon className="h-6 w-6" strokeWidth={1.8} />
                </div>
                <h3 className="mt-6 text-[22px] font-semibold leading-tight">{card.title}</h3>
                <p className="mt-4 text-[17px] leading-[1.75] text-[#C8D0D9]">{card.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
