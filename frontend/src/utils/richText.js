const htmlTagPattern = /<\/?[a-z][\s\S]*>/i;

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

export const hasHtmlMarkup = (value = '') => htmlTagPattern.test(String(value));

export const plainTextToHtml = (value = '') => {
  const blocks = String(value)
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, '<br>')}</p>`)
    .join('');
};

export const getEditableHtml = (value = '') => {
  if (!value) {
    return '';
  }

  return hasHtmlMarkup(value) ? value : plainTextToHtml(value);
};

export const htmlToPlainText = (html = '') => {
  if (!html) {
    return '';
  }

  if (typeof document !== 'undefined') {
    const element = document.createElement('div');
    element.innerHTML = html;
    return (element.textContent || element.innerText || '').replace(/\u00a0/g, ' ').trim();
  }

  return String(html).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
};

export const normalizeHtmlImageSources = (html = '', resolveImageUrl) => {
  if (!html || typeof document === 'undefined' || typeof resolveImageUrl !== 'function') {
    return html;
  }

  const wrapper = document.createElement('div');
  wrapper.innerHTML = html;
  wrapper.querySelectorAll('img[src]').forEach((image) => {
    image.setAttribute('src', resolveImageUrl(image.getAttribute('src')));
  });

  return wrapper.innerHTML;
};

const isEmptyNode = (node) => {
  if (node.nodeType === Node.TEXT_NODE) {
    return !node.textContent.trim();
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return true;
  }

  return !node.textContent.trim() && !node.querySelector('img, hr, iframe, video');
};

const nodesToHtml = (nodes) =>
  nodes
    .map((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        return escapeHtml(node.textContent);
      }

      return node.outerHTML || '';
    })
    .join('');

export const createEditorialArticleFlow = (html = '', galleryImages = []) => {
  if (!html || typeof document === 'undefined') {
    return {
      introHtml: html,
      sections: [],
      tailHtml: '',
    };
  }

  const wrapper = document.createElement('div');
  wrapper.innerHTML = html;
  const contentNodes = Array.from(wrapper.childNodes).filter((node) => !isEmptyNode(node));
  const images = Array.isArray(galleryImages) ? galleryImages.filter(Boolean) : [];

  if (!images.length || contentNodes.length < 3) {
    return {
      introHtml: nodesToHtml(contentNodes),
      sections: [],
      tailHtml: '',
    };
  }

  const introCount = contentNodes.length > images.length
    ? Math.min(2, Math.max(1, contentNodes.length - images.length))
    : 0;
  const bodyNodes = contentNodes.slice(introCount);
  const chunkCount = images.length + 1;
  const chunks = Array.from({ length: chunkCount }, () => []);

  bodyNodes.forEach((node, index) => {
    const chunkIndex = Math.min(chunkCount - 1, Math.floor((index * chunkCount) / bodyNodes.length));
    chunks[chunkIndex].push(node);
  });

  const sections = images.map((image, index) => ({
    image,
    align: index % 2 === 0 ? 'right' : 'left',
    html: nodesToHtml(chunks[index] || []),
  }));

  return {
    introHtml: nodesToHtml(contentNodes.slice(0, introCount)),
    sections,
    tailHtml: nodesToHtml(chunks[chunkCount - 1] || []),
  };
};
