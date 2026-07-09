import React, { useEffect, useState } from 'react';
import api, { resolveImageUrl } from '../../services/api';

export default function ClientsSection() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadClients = async () => {
      try {
        const response = await api.get('/clients');
        const nextClients = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
          ? response.data
          : response?.clients || [];
        setClients(nextClients || []);
      } catch (error) {
        console.error('[clients] unable to load clients', error);
      } finally {
        setLoading(false);
      }
    };

    loadClients();

    const handleClientsUpdated = () => {
      loadClients();
    };

    window.addEventListener('clients:updated', handleClientsUpdated);
    return () => window.removeEventListener('clients:updated', handleClientsUpdated);
  }, []);

  if (loading || !clients.length) {
    return null;
  }

  return (
    <section className="relative w-full bg-black py-24">
      <div className="mx-auto max-w-[1720px] px-6 sm:px-8 lg:px-12">
        <div className="mb-10 max-w-3xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.28em] text-[#60A5FA]">Our Clients</p>
          <h2 className="text-[40px] font-[550] leading-[1.05] text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Trusted by businesses across infrastructure, energy, and transportation.
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-[1.75] text-[#C8D0D9]">
            We partner with the industry’s leading engineers, contractors, and agencies to deliver intelligent survey, inspection, and road asset management solutions.
          </p>
        </div>

        <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[#050505] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.35)]">
          <div className="flex items-center gap-4 overflow-x-auto pb-4 pr-2 text-center scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
            {clients.map((client) => {
              const logoUrl = resolveImageUrl(client.logo);
              return (
                <a
                  key={client.id}
                  href={client.website || '#'}
                  target={client.website ? '_blank' : '_self'}
                  rel={client.website ? 'noreferrer noopener' : undefined}
                  className="flex min-w-[170px] flex-col items-center justify-center gap-4 rounded-[22px] border border-white/10 bg-white/5 px-4 py-6 text-white transition duration-300 hover:border-[#2EA7FF]/40 hover:bg-white/10"
                >
                  <div className="flex h-20 w-full items-center justify-center rounded-3xl bg-[#0C1420] p-4">
                    {logoUrl ? (
                      <img src={logoUrl} alt={client.name} className="max-h-14 max-w-full object-contain" />
                    ) : (
                      <span className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">{client.name}</span>
                    )}
                  </div>
                  <span className="text-sm font-medium text-[#C8D0D9]">{client.name}</span>
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
