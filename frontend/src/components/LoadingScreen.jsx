import React from 'react';
import Logo from './Logo';

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-[#030712]">
      <div className="absolute h-40 w-40 animate-pulse bg-[#38BDF8]/10 blur-3xl" />
      <div className="relative flex flex-col items-center gap-5">
        <Logo size="loader" />
        <div className="h-px w-32 overflow-hidden bg-white/10">
          <div className="h-full w-1/2 animate-pulse bg-[#38BDF8]" />
        </div>
      </div>
    </div>
  );
}
