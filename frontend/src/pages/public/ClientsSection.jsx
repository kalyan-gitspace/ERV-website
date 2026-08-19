import React, { useEffect, useMemo, useState } from 'react';
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

  const marqueeClients = useMemo(() => {
    if (!clients.length) return [];
    return [...clients, ...clients];
  }, [clients]);

  if (loading || !clients.length) {
    return null;
  }

  return (
    <section className="relative w-full bg-black py-24">
      <div className="mx-auto max-w-[1720px] px-6 sm:px-8 lg:px-12">
        <div className="mb-10 max-w-190">
          <p className="section-eyebrow mb-4">Our Clients</p>
          <h2 className="max-w-190 text-[clamp(1.9rem,3.2vw,2.7rem)] font-semibold leading-[1.08] text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Trusted by businesses across
            <br className="hidden sm:block" />
            infrastructure, energy, and transportation.
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-[1.75] text-[#C8D0D9]">
            We partner with the industry’s leading engineers, contractors, and agencies to deliver intelligent survey, inspection, and road asset management solutions.
          </p>
        </div>

        <div className="overflow-hidden rounded-4xl border border-white/10 bg-[#030303] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.35)] sm:p-8">
          <div className="clients-marquee relative overflow-hidden">
            <div className="clients-marquee-track flex w-max items-center gap-4 sm:gap-6">
              {marqueeClients.map((client, index) => {
                const logoUrl = resolveImageUrl(client.logo);
                const hasWebsite = Boolean(client.website?.trim());
                return (
                  <div
                    key={`${client.id || client.name}-${index}`}
                    className="flex h-24 w-[clamp(144px,16vw,220px)] shrink-0 items-center justify-center px-4 py-5"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (!hasWebsite) return;
                        window.open(client.website, '_blank', 'noopener,noreferrer');
                      }}
                      className="flex h-full w-full items-center justify-center focus:outline-none"
                      aria-label={hasWebsite ? `Visit ${client.name}` : client.name}
                    >
                      {logoUrl ? (
                        <img
                          src={logoUrl}
                          alt={client.name}
                          className="max-h-12 w-full max-w-30 object-contain opacity-75 transition duration-300 hover:opacity-100"
                          style={{ filter: 'grayscale(100%) brightness(0) invert(1) opacity(0.75)' }}
                        />
                      ) : null}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
