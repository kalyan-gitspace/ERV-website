import React from 'react';

const SIZE_CLASSES = {
  nav: 'max-h-[54px] w-auto',
  hero: 'max-h-[54px] w-auto',
  loader: 'h-80 w-80 sm:h-96 sm:w-96',
  footer: 'h-auto w-56 max-w-full sm:w-64',
};

export function Logo({ size = 'nav', variant = 'header', className = '', alt = 'ERV' }) {
  const isFullLogo = variant === 'footer' || variant === 'loader';

  return (
    <img
      src={isFullLogo ? '/logo.png' : '/erv-logo.png'}
      alt={alt}
      draggable="false"
      className={`${SIZE_CLASSES[size] || SIZE_CLASSES.nav} ${className}`}
      style={{ objectFit: 'contain', aspectRatio: isFullLogo ? '1 / 1' : undefined }}
    />
  );
}

export default Logo;
