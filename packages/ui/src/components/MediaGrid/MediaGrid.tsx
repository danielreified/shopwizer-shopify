import React from 'react';
import { SkeletonBlock } from '../Skeleton';

// ============================================================
// Types
// ============================================================

export type MediaGridImage = {
  src: string;
  alt?: string;
};

export interface MediaGridProps {
  /** Array of images to display */
  images: MediaGridImage[];
  /** Maximum number of visible tiles before showing overflow badge */
  maxVisible?: number;
  /** Height of each tile row in px */
  tileSizePx?: number;
  /** Additional CSS class */
  className?: string;
  /** Show skeleton loading state */
  loading?: boolean;
}

// ============================================================
// Component
// ============================================================

/**
 * 6-column image grid with hero tile (2x2) and overflow badge.
 * Supports skeleton loading state.
 */
export function MediaGrid({
  images,
  maxVisible = 9,
  tileSizePx = 90,
  className = '',
  loading = false,
}: MediaGridProps) {
  if (loading) {
    return <MediaGridSkeleton tileSizePx={tileSizePx} className={className} />;
  }

  if (!images?.length) return null;

  const overflow = Math.max(0, images.length - maxVisible);
  const visible = overflow > 0 ? images.slice(0, maxVisible) : images;

  return (
    <div
      className={`grid grid-cols-6 gap-2 ${className}`}
      style={{ gridAutoRows: `${tileSizePx}px` }}
    >
      {visible.map((img, i) => {
        const isHero = i === 0;
        const isLast = i === visible.length - 1;
        const showOverflowBadge = isLast && overflow > 0;
        const spans = isHero ? 'col-span-2 row-span-2' : '';

        return (
          <div
            key={`${img.src}-${i}`}
            className={`relative ${spans} overflow-hidden rounded-lg`}
            style={{
              border: '1px solid var(--p-color-border-subdued)',
              backgroundColor: 'var(--p-color-bg-surface)',
            }}
          >
            <img
              src={img.src}
              alt={img.alt ?? ''}
              className="h-full w-full object-contain"
              draggable={false}
            />

            {showOverflowBadge && (
              <div
                className="absolute inset-0 flex items-center justify-center bg-black/45 backdrop-blur-sm"
                style={{ borderRadius: 'inherit' }}
              >
                <span className="text-white/70 text-md font-semibold">+{overflow}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// Skeleton
// ============================================================

function MediaGridSkeleton({
  tileSizePx,
  className = '',
}: {
  tileSizePx: number;
  className?: string;
}) {
  const base = 'rounded-lg overflow-hidden';

  return (
    <div
      className={`grid grid-cols-6 gap-2 ${className}`}
      style={{ gridAutoRows: `${tileSizePx}px` }}
    >
      <div className={`col-span-2 row-span-2 ${base}`}>
        <SkeletonBlock width="100%" height="100%" />
      </div>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className={base}>
          <SkeletonBlock width="100%" height="100%" />
        </div>
      ))}
    </div>
  );
}

export default MediaGrid;
