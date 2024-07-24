// components/SkeletonLoader.tsx
import React from 'react';

interface SkeletonLoaderProps {
  width: string;
  height: string;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ width, height }) => {
  return (
    <div
      style={{
        width,
        height,
        backgroundColor: '#333',
        borderRadius: '4px',
      }}
      className="animate-pulse"
    />
  );
};

export default SkeletonLoader;
