import { useEffect } from 'react';

const setMeta = (name, content, attribute = 'name') => {
  if (!content) return;
  let element = document.querySelector(`meta[${attribute}="${name}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, name);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
};

export function SEO({ title, description, path = '/', image = '/logo.png', schema }) {
  useEffect(() => {
    const siteTitle = title ? `${title} | ERV` : 'ERV | Engineering Smarter Roads';
    const canonicalUrl = `${window.location.origin}${path}`;

    document.title = siteTitle;
    setMeta('description', description);
    setMeta('robots', 'index, follow');
    setMeta('og:title', siteTitle, 'property');
    setMeta('og:description', description, 'property');
    setMeta('og:type', 'website', 'property');
    setMeta('og:url', canonicalUrl, 'property');
    setMeta('og:image', image, 'property');
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', siteTitle);
    setMeta('twitter:description', description);

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', canonicalUrl);

    let schemaTag = document.getElementById('page-schema');
    if (schema) {
      if (!schemaTag) {
        schemaTag = document.createElement('script');
        schemaTag.type = 'application/ld+json';
        schemaTag.id = 'page-schema';
        document.head.appendChild(schemaTag);
      }
      schemaTag.textContent = JSON.stringify(schema);
    } else if (schemaTag) {
      schemaTag.remove();
    }
  }, [title, description, path, image, schema]);

  return null;
}

export default SEO;
