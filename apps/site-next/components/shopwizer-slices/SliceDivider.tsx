'use client';

import { motion } from 'framer-motion';
import styles from './shopwizer.module.css';

interface SliceDividerProps {
  num: string;
  label: string;
}

const ease = [0.25, 0.46, 0.45, 0.94];

export function SliceDivider({ num, label }: SliceDividerProps) {
  return (
    <motion.div
      className={styles.sliceDivider}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.5 }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.1 } },
      }}
    >
      <motion.span
        className={styles.num}
        variants={{
          hidden: { opacity: 0, y: 10 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease } },
        }}
      >
        {num}
      </motion.span>
      <motion.span
        className={styles.label}
        variants={{
          hidden: { opacity: 0, y: 10 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease } },
        }}
      >
        {label}
      </motion.span>
      <motion.span
        className={styles.line}
        variants={{
          hidden: { scaleX: 0 },
          visible: { scaleX: 1, transition: { duration: 0.8, ease } },
        }}
        style={{ transformOrigin: 'left' }}
      />
    </motion.div>
  );
}
