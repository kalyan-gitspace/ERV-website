import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { PublicLayout } from '../../layouts/PublicLayout';
import api, { resolveImageUrl, fetchSettings } from '../../services/api';

const HERO_SETTING_KEY = 'gallery_hero_image';
const IMAGES_SETTING_KEY = 'gallery_images';

const normalizeGalleryItems = (value) => {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (typeof item === 'string') {
        return { image: item, alt: '' };
      }

      if (item && typeof item === 'object') {
        return { image: item.image || item.url || '', alt: item.alt || item.alt_text || '' };
      }

      return null;
    })
    .filter(Boolean)
    .filter((item) => item.image);
};

const getGallerySettingValue = (settings = {}, key) => {
  const value = settings?.[key];
  if (value && typeof value === 'object' && !Array.isArray(value) && Object.prototype.hasOwnProperty.call(value, 'value')) {
    return value.value;
  }
  return value || '';
};

export function GalleryPage() {
  const [heroImage, setHeroImage] = useState('');
  const [galleryItems, setGalleryItems] = useState([]);
  const [activeImage, setActiveImage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadGallery = async () => {
      try {
        setLoading(true);
        const settings = await fetchSettings();
        setHeroImage(getGallerySettingValue(settings, HERO_SETTING_KEY));
        setGalleryItems(normalizeGalleryItems(getGallerySettingValue(settings, IMAGES_SETTING_KEY) || []));
      } catch (error) {
        console.error('[gallery-page] failed to load gallery', error);
      } finally {
        setLoading(false);
      }
    };

    loadGallery();

    const handleGalleryUpdated = () => {
      loadGallery();
    };

    window.addEventListener('gallery:updated', handleGalleryUpdated);
    return () => window.removeEventListener('gallery:updated', handleGalleryUpdated);
  }, []);

  useEffect(() => {
    if (!activeImage) {
      document.body.style.overflow = '';
      return;
    }

    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setActiveImage(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeImage]);

  const heroPreview = useMemo(() => (heroImage ? resolveImageUrl(heroImage) : ''), [heroImage]);

  return (
    <PublicLayout>
      <section className="min-h-screen bg-[#000000] px-5 py-8 text-white sm:px-8 sm:py-10 lg:px-10 lg:py-12">
        <div className="mx-auto max-w-[1480px]">
          <div className="mx-auto flex min-h-[460px] max-w-[1480px] items-center justify-center px-5 py-8 sm:min-h-[560px] sm:px-8 sm:py-10 lg:min-h-[700px] lg:px-10 lg:py-12">
            {heroPreview ? (
              <button
                type="button"
                onClick={() => setActiveImage({ image: heroImage, alt: 'ERV gallery hero' })}
                className="flex h-full w-full cursor-pointer items-center justify-center overflow-hidden rounded-[24px] border border-white/10 bg-black px-4 py-4 sm:px-6 lg:px-8"
              >
                <img
                  src={heroPreview}
                  alt="ERV gallery hero"
                  className="h-full max-h-[680px] w-full object-contain"
                />
              </button>
            ) : (
              <div className="flex h-full min-h-[220px] w-full items-center justify-center rounded-[24px] border border-white/10 bg-black px-4 py-8 text-center text-sm text-slate-400 sm:min-h-[260px] lg:min-h-[300px]">
                Gallery hero image coming soon.
              </div>
            )}
          </div>

          <div className="mt-6">
            {loading ? (
              <div className="rounded-[24px] border border-white/10 bg-[#111111] px-6 py-8 text-center text-sm text-slate-400">
                Loading gallery...
              </div>
            ) : galleryItems.length === 0 ? (
              <div className="rounded-[24px] border border-white/10 bg-[#111111] px-6 py-8 text-center text-sm text-slate-400">
                Gallery images will appear here soon.
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {galleryItems.map((item, index) => (
                  <button
                    key={`${item.image}-${index}`}
                    type="button"
                    onClick={() => setActiveImage(item)}
                    className="group overflow-hidden rounded-[24px] border border-white/10 bg-[#111111] p-2 text-left"
                  >
                    <div className="aspect-[16/9] overflow-hidden rounded-[20px] bg-black">
                      <img
                        src={resolveImageUrl(item.image)}
                        alt={item.alt || 'ERV gallery image'}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <AnimatePresence>
          {activeImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[80] flex items-center justify-center bg-[rgba(0,0,0,0.95)] px-4 py-6"
              onClick={() => setActiveImage(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2 }}
                className="relative flex max-h-[90vh] max-w-[90vw] items-center justify-center"
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setActiveImage(null)}
                  className="absolute right-3 top-3 z-10 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/70 text-white transition hover:bg-white/10"
                  aria-label="Close image viewer"
                >
                  <X className="h-6 w-6" />
                </button>
                <img
                  src={resolveImageUrl(activeImage.image)}
                  alt={activeImage.alt || 'ERV gallery image'}
                  className="max-h-[90vh] max-w-[90vw] rounded-[24px] object-contain"
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </PublicLayout>
  );
}

export default GalleryPage;
