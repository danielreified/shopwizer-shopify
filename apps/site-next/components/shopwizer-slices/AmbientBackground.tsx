'use client';

import { motion } from 'framer-motion';
import styles from './shopwizer.module.css';

interface AmbientBackgroundProps {
  variant?: 'hero' | 'dark';
}

export function AmbientBackground({ variant = 'dark' }: AmbientBackgroundProps) {
  const size = variant === 'hero' ? 700 : 500;
  const opacity = variant === 'hero' ? 0.06 : 0.04;

  return (
    <>
      <motion.div
        className={styles.ambientOrb}
        style={{
          width: size,
          height: size,
          top: '-10%',
          right: '-5%',
          background: `radial-gradient(circle, rgba(91, 138, 74, ${opacity}) 0%, transparent 70%)`,
        }}
        animate={{ y: [0, -30, 0], x: [0, 15, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className={styles.ambientOrb}
        style={{
          width: size * 0.8,
          height: size * 0.8,
          bottom: '5%',
          left: '-5%',
          background: `radial-gradient(circle, rgba(91, 138, 74, ${opacity * 0.5}) 0%, transparent 70%)`,
        }}
        animate={{ y: [0, 20, 0], x: [0, -20, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
      />
    </>
  );
}
