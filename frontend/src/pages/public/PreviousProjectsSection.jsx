import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api, { resolveImageUrl } from '../../services/api';

export default function PreviousProjectsSection() {
  const [projects, setProjects] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        console.log('[projects] loading public projects');
        const res = await api.get('/projects');
        console.log('[projects] public list response', res);
        if (res?.success && Array.isArray(res.data)) {
          setProjects(res.data);
        }
      } catch (error) {
        console.error('[projects] unable to load public projects', error);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
    const handleProjectsUpdated = () => {
      loadProjects();
    };

    window.addEventListener('projects:updated', handleProjectsUpdated);
    return () => {
      window.removeEventListener('projects:updated', handleProjectsUpdated);
    };
  }, []);

  const visibleProjects = useMemo(() => projects.slice(index, index + 3), [index, projects]);
  const canGoLeft = index > 0;
  const canGoRight = index + 3 < projects.length;

  if (loading || !projects.length) {
    return null;
  }

  return (
    <section className="relative w-full bg-[#01030A] py-24">
      <div className="mx-auto max-w-[1720px] px-6 sm:px-8 lg:px-12">
        <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-[760px]">
            <h2 className="mt-4 text-[40px] font-[550] leading-[1.05] text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Our Previous Projects
            </h2>
          </div>
          {projects.length > 3 && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIndex((current) => Math.max(0, current - 1))}
                className={`flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition ${canGoLeft ? 'hover:border-[#2EA7FF]/50 hover:text-[#2EA7FF]' : 'cursor-not-allowed opacity-40'}`}
                disabled={!canGoLeft}
                aria-label="Show previous projects"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => setIndex((current) => Math.min(projects.length - 3, current + 1))}
                className={`flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition ${canGoRight ? 'hover:border-[#2EA7FF]/50 hover:text-[#2EA7FF]' : 'cursor-not-allowed opacity-40'}`}
                disabled={!canGoRight}
                aria-label="Show next projects"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>

        <div className="relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.3 }}
              className="grid gap-6 lg:grid-cols-3"
            >
              {visibleProjects.map((project) => {
                const mainImageUrl = resolveImageUrl(project.main_image);

                return (
                  <a
                    key={project.id}
                    href={`/projects/${project.slug}`}
                    className="group overflow-hidden rounded-[28px] border border-white/10 bg-[rgba(255,255,255,0.04)] shadow-[0_30px_80px_rgba(0,0,0,0.28)] transition duration-300 hover:-translate-y-1 hover:border-[#2EA7FF]/50"
                  >
                    <div className="relative h-56 overflow-hidden">
                      {mainImageUrl && (
                        <img
                          src={mainImageUrl}
                          alt={project.title}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#01030A]/90 via-[#01030A]/20 to-transparent" />
                    </div>
                    <div className="p-6">
                      <h3 className="text-[22px] font-semibold text-white">{project.title}</h3>
                      <div className="relative mt-3">
                        <p className="line-clamp-2 text-[15px] leading-7 text-[#C8D0D9]">
                          {project.short_description || 'View project details.'}
                        </p>
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[#01030A] to-transparent" />
                      </div>
                      <div className="mt-6 inline-flex items-center gap-2 text-[15px] font-semibold text-[#2EA7FF]">
                        View More
                        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                      </div>
                    </div>
                  </a>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
