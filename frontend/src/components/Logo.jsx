import React from 'react';

const SIZE_CLASSES = {
  nav: 'max-h-[54px] w-auto',
  hero: 'max-h-[54px] w-auto',
  loader: 'h-20 w-auto',
};

export function Logo({ size = 'nav', className = '', alt = 'ERV' }) {
  return (
    <img
      src="/erv-logo.png"
      alt={alt}
      draggable="false"
      className={`${SIZE_CLASSES[size] || SIZE_CLASSES.nav} ${className}`}
      style={{ objectFit: 'contain' }}
    />
  );
}

export default Logo;
