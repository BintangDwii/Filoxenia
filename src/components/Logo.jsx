import React from 'react';

const Logo = ({ className = '', width = 32, height = 32, alt = 'Filoxenia' }) => {
  return (
    <img
      src="/maui-hook-logo.svg"
      alt={alt}
      width={width}
      height={height}
      className={className}
      style={{
        display: 'block',
        fill: 'currentColor'
      }}
    />
  );
};

export default Logo;
