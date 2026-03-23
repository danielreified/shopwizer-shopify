'use client';

import { useEffect, useRef } from 'react';
import { useInView, animate } from 'framer-motion';

interface AnimatedCounterProps {
  target: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  decimals?: number;
  className?: string;
}

export function AnimatedCounter({
  target,
  suffix = '',
  prefix = '',
  duration = 2,
  decimals = 0,
  className,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isInView || hasAnimated.current || !ref.current) return;
    hasAnimated.current = true;

    const node = ref.current;
    const controls = animate(0, target, {
      duration,
      ease: [0.25, 0.46, 0.45, 0.94],
      onUpdate(value) {
        node.textContent = `${prefix}${value.toFixed(decimals)}${suffix}`;
      },
    });

    return () => controls.stop();
  }, [isInView, target, suffix, prefix, duration, decimals]);

  return (
    <div ref={ref} className={className}>
      {prefix}0{suffix}
    </div>
  );
}
