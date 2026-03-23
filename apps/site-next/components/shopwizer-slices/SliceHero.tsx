'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import styles from './shopwizer.module.css';
import { AnimatedCounter } from './AnimatedCounter';
import { AmbientBackground } from './AmbientBackground';

const ease = [0.25, 0.46, 0.45, 0.94];

const images = [
  {
    src: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&h=750&fit=crop&q=80',
    alt: 'Fashion editorial 1',
    tag: 'Trending now',
  },
  {
    src: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&h=750&fit=crop&q=80',
    alt: 'Fashion editorial 2',
    tag: 'New arrivals',
  },
  {
    src: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=750&fit=crop&q=80',
    alt: 'Fashion editorial 3',
    tag: 'Curated',
  },
  {
    src: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&h=750&fit=crop&q=80',
    alt: 'Fashion editorial 4',
    tag: 'Best sellers',
  },
];

export function SliceHero() {
  const { scrollY } = useScroll();
  const imageY = useTransform(scrollY, [0, 600], [0, -60]);

  return (
    <section className={styles.heroSlice}>
      <AmbientBackground variant="hero" />
      <div className={styles.heroLeft}>
        <motion.div
          className={styles.heroEyebrow}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease }}
        >
          Shopify Merchandising
        </motion.div>
        <motion.h1
          className={styles.heroTitle}
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4, ease }}
        >
          Your products, <em>better</em> arranged.
        </motion.h1>
        <motion.p
          className={styles.heroBody}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6, ease }}
        >
          Shopwizer analyzes purchase patterns, browsing behavior, and inventory to place the right
          products in front of the right customers — automatically.
        </motion.p>
        <motion.div
          className={styles.heroActions}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.8, ease }}
        >
          <button className={styles.btnPrimary}>Start free trial</button>
          <button className={styles.btnGhost}>Watch demo</button>
        </motion.div>
        <motion.div
          className={styles.heroStats}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.0, ease }}
        >
          <div className={styles.heroStat}>
            <AnimatedCounter target={23} prefix="+" suffix="%" className={styles.statNum} />
            <div className={styles.statLabel}>Avg. AOV lift</div>
          </div>
          <div className={styles.heroStat}>
            <AnimatedCounter target={4.2} suffix="×" decimals={1} className={styles.statNum} />
            <div className={styles.statLabel}>Bundle attach rate</div>
          </div>
          <div className={styles.heroStat}>
            <AnimatedCounter target={14} suffix=" days" className={styles.statNum} />
            <div className={styles.statLabel}>To measurable results</div>
          </div>
        </motion.div>
      </div>

      <motion.div className={styles.heroRight} style={{ y: imageY }}>
        <div className={styles.heroImageGrid}>
          {images.map((img, idx) => (
            <motion.div
              key={idx}
              className={styles.imgCell}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 + idx * 0.15, ease }}
            >
              <img src={img.src} alt={img.alt} loading="lazy" />
              <span className={styles.imgTag}>{img.tag}</span>
            </motion.div>
          ))}
        </div>
        <div className={styles.heroOverlay}></div>
      </motion.div>
    </section>
  );
}
