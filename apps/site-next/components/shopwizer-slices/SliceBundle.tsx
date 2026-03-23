'use client';

import styles from './shopwizer.module.css';
import { AnimatedSection } from './AnimatedSection';
import { motion } from 'framer-motion';

const ease = [0.25, 0.46, 0.45, 0.94];

export function SliceBundle() {
  return (
    <section className={styles.bundleSlice}>
      <AnimatedSection>
        <div className={styles.bundleHeader}>
          <h2>
            Bundles that
            <br />
            sell themselves
          </h2>
          <span className={styles.bundleTag}>↑ 31% attach rate</span>
        </div>
      </AnimatedSection>

      <motion.div
        className={styles.bundleContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
        }}
      >
        {/* Product 1 */}
        <motion.div
          className={styles.bundleProduct}
          variants={{
            hidden: { opacity: 0, y: 30 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
          }}
        >
          <img
            className={styles.productImg}
            src="https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&h=530&fit=crop&q=80"
            alt="Wool overcoat"
            loading="lazy"
          />
          <div className={styles.productInfo}>
            <div className={styles.productBrand}>Studio Collection</div>
            <div className={styles.productName}>Wool Overcoat</div>
            <div className={styles.productPrice}>$289</div>
            <div className={styles.productMatch}>
              <span className={styles.matchDot}></span> Primary item
            </div>
          </div>
        </motion.div>

        <motion.div
          className={styles.bundlePlus}
          variants={{
            hidden: { opacity: 0, scale: 0 },
            visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease } },
          }}
        >
          +
        </motion.div>

        {/* Product 2 */}
        <motion.div
          className={styles.bundleProduct}
          variants={{
            hidden: { opacity: 0, y: 30 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
          }}
        >
          <img
            className={styles.productImg}
            src="https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=530&fit=crop&q=80"
            alt="Cashmere scarf"
            loading="lazy"
          />
          <div className={styles.productInfo}>
            <div className={styles.productBrand}>Studio Collection</div>
            <div className={styles.productName}>Cashmere Scarf</div>
            <div className={styles.productPrice}>$95</div>
            <div className={styles.productMatch}>
              <span className={styles.matchDot}></span> 78% co-purchase
            </div>
          </div>
        </motion.div>

        <motion.div
          className={styles.bundlePlus}
          variants={{
            hidden: { opacity: 0, scale: 0 },
            visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease } },
          }}
        >
          +
        </motion.div>

        {/* Product 3 */}
        <motion.div
          className={styles.bundleProduct}
          variants={{
            hidden: { opacity: 0, y: 30 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
          }}
        >
          <img
            className={styles.productImg}
            src="https://images.unsplash.com/photo-1603252109303-2751441dd157?w=400&h=530&fit=crop&q=80"
            alt="Leather gloves"
            loading="lazy"
          />
          <div className={styles.productInfo}>
            <div className={styles.productBrand}>Studio Collection</div>
            <div className={styles.productName}>Leather Gloves</div>
            <div className={styles.productPrice}>$68</div>
            <div className={styles.productMatch}>
              <span className={styles.matchDot}></span> 54% co-purchase
            </div>
          </div>
        </motion.div>

        <motion.div
          className={styles.bundleEquals}
          variants={{
            hidden: { opacity: 0, scale: 0 },
            visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease } },
          }}
        >
          <span>=</span>
        </motion.div>

        {/* Bundle Summary */}
        <motion.div
          className={styles.bundleSummary}
          variants={{
            hidden: { opacity: 0, x: 30 },
            visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease } },
          }}
        >
          <div className={styles.summaryLabel}>Bundle price</div>
          <div className={styles.summaryOriginal}>$452.00</div>
          <div className={styles.summaryPrice}>$389</div>
          <div className={styles.summarySave}>Save $63 (14%)</div>
          <button className={styles.summaryBtn}>Add bundle to cart</button>
          <div className={styles.summaryAttach}>31% of customers add this</div>
        </motion.div>
      </motion.div>
    </section>
  );
}
