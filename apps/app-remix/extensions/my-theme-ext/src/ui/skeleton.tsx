// src/ui/skeleton.tsx

/** @jsxImportSource preact */
import { h } from "preact";

export function SkeletonCard() {
  return (
    <div class="sw-skel-card">
      <div class="sw-skel-media"></div>
      <div class="sw-skel-line"></div>
      <div class="sw-skel-line short"></div>
    </div>
  );
}

export function SkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div class="sw-grid">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
