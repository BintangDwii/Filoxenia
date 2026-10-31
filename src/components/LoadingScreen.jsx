import React, { useState, useEffect } from 'react';
import Logo from './Logo';

const LoadingScreen = ({ message = 'Memuat data...' }) => {
  const [rotating, setRotating] = useState(false);

  useEffect(() => {
    setRotating(true);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--ocean-mist)] p-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg var(--surface)">
          <Logo width={32} height={32} />
          <i
            className="ph ph-circle-notch absolute -bottom-1 -right-1 animate-spin rounded-full bg-white text-lg text var(--danger)"
          />
        </div>
        <p className="text-sm font-medium text var(--ink)">{message}</p>
      </div>
    </div>
  );
};

export default LoadingScreen;