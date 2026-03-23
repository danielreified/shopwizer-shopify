'use client';

import styles from './shopwizer.module.css';
import { AnimatedCounter } from './AnimatedCounter';
import { AnimatedSection } from './AnimatedSection';

export function SliceResults() {
  return (
    <section className={styles.resultsSlice}>
      <AnimatedSection className={styles.resultsInner}>
        <div className={styles.resultItem}>
          <AnimatedCounter target={15} suffix="%" className={styles.resultNum} />
          <div className={styles.resultLabel}>Increase in RPV</div>
        </div>
        <div className={styles.resultItem}>
          <AnimatedCounter target={24} prefix="+" suffix="%" className={styles.resultNum} />
          <div className={styles.resultLabel}>Bundle Conversion</div>
        </div>
        <div className={styles.resultItem}>
          <AnimatedCounter target={1.8} suffix="×" decimals={1} className={styles.resultNum} />
          <div className={styles.resultLabel}>Pages per session</div>
        </div>
        <div className={styles.resultItem}>
          <AnimatedCounter target={12} suffix="ms" className={styles.resultNum} />
          <div className={styles.resultLabel}>Processing time</div>
        </div>
      </AnimatedSection>
    </section>
  );
}
