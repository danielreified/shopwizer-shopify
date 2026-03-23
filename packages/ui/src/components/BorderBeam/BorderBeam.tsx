// BorderBeam.tsx (single file, no CSS imports)
import React, { useEffect, useRef } from 'react';

type BorderBeamProps = {
  children: React.ReactNode;
  className?: string; // e.g. "rounded-2xl bg-white p-8 shadow-xl"
  borderWidth?: number; // px
  speed?: number; // degrees per second
  colors?: string[]; // gradient stops
};

export function BorderBeam({
  children,
  className = 'rounded-2xl',
  borderWidth = 3,
  speed = 60,
  colors = ['#6366f1', '#ec4899', '#f59e0b', '#22d3ee', '#6366f1'],
}: BorderBeamProps) {
  const ringRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();

    const tick = (t: number) => {
      const elapsed = (t - start) / 1000; // seconds
      const angle = (elapsed * speed) % 360;
      ringRef.current?.style.setProperty('--bb-angle', `${angle}deg`);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    // ensure border-only mask works in all browsers
    const el = ringRef.current;
    if (el) {
      el.style.setProperty('-webkit-mask-composite', 'xor');
      el.style.setProperty('mask-composite', 'exclude');
    }
    return () => cancelAnimationFrame(raf);
  }, [speed]);

  const gradient = `conic-gradient(from var(--bb-angle,0deg), ${colors.join(',')})`;

  return (
    <div className={`relative ${className}`} style={{ borderRadius: '1rem' }}>
      {/* animated border ring */}
      <span
        ref={ringRef}
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          padding: `${borderWidth}px`, // thickness of the ring
          borderRadius: 'inherit',
          pointerEvents: 'none',
          background: gradient,
          // Show only the border stroke via masks (no external CSS)
          WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
          mask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
          // -webkit-mask-composite / mask-composite set in effect above
          filter: 'saturate(1.2)',
          willChange: 'background',
        }}
      />
      {children}
    </div>
  );
}
