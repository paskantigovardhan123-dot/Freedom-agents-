import React from 'react';

interface LoadingSkeletonProps {
  rows?: number;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ rows = 3 }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="skeleton-shimmer"
          style={{
            height: '64px',
            width: '100%',
            borderRadius: '10px',
            border: '1px solid rgba(148, 163, 184, 0.08)',
          }}
        />
      ))}
    </div>
  );
};
