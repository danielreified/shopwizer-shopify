'use client';

import styles from './shopwizer.module.css';
import { AnimatedSection } from './AnimatedSection';
import { AmbientBackground } from './AmbientBackground';

export function SliceWidget() {
  return (
    <section className={styles.widgetSlice}>
      <AmbientBackground />
      <div className={styles.widgetLayout}>
        <AnimatedSection direction="left">
          <div className={styles.widgetText}>
            <h2>
              Recommends while
              <br />
              they shop
            </h2>
            <p>
              Don&apos;t wait for the checkout. Shopwizer suggests complementary items as customers
              browse, increasing cart size effortlessly.
            </p>
            <ul className={styles.widgetFeatures}>
              <li>
                <span className={styles.featDot}></span> Context-aware recommendations
              </li>
              <li>
                <span className={styles.featDot}></span> One-click add to cart
              </li>
              <li>
                <span className={styles.featDot}></span> Customized to your brand look
              </li>
            </ul>
          </div>
        </AnimatedSection>

        <AnimatedSection direction="right" delay={0.15}>
          <div className={styles.widgetPreview}>
            <div className={styles.widgetPreviewHeader}>
              <h4>Complete the look</h4>
              <div className={styles.powered}>
                Powered by
                <svg viewBox="-170 -170 340 340">
                  <g transform="rotate(45)">
                    <path
                      d="M -3,-115 C -40,-115 -80,-100 -95,-85 C -100,-80 -115,-40 -115,-3 L -40,0 Q 0,0 0,-40 Z"
                      fill="#9CA3AF"
                    />
                    <path
                      d="M 115,-3 C 115,-40 100,-80 85,-95 C 80,-100 40,-115 3,-115 L 0,-40 Q 0,0 40,0 Z"
                      fill="#9CA3AF"
                    />
                    <path
                      d="M 3,115 C 40,115 80,100 95,85 C 100,80 115,40 115,3 L 40,0 Q 0,0 0,40 Z"
                      fill="#9CA3AF"
                    />
                    <path
                      d="M -115,3 C -115,40 -100,80 -85,95 C -80,100 -40,115 -3,115 L 0,40 Q 0,0 -40,0 Z"
                      fill="#9CA3AF"
                    />
                  </g>
                </svg>
              </div>
            </div>

            <div className={styles.widgetItems}>
              <div className={styles.widgetItem}>
                <img
                  src="https://images.unsplash.com/photo-1617125722802-58814777e482?w=200&h=250&fit=crop&q=80"
                  alt="Belt"
                  loading="lazy"
                />
                <div className={styles.itemInfo}>
                  <div className={styles.itemName}>Classic Leather Belt</div>
                  <div className={styles.itemPrice}>$45</div>
                  <div className={styles.itemMatch}>Frequent pair</div>
                </div>
                <button className={styles.itemAdd}>+ Add</button>
              </div>

              <div className={styles.widgetItem}>
                <img
                  src="https://images.unsplash.com/photo-1605763240004-7e93b172d754?w=200&h=250&fit=crop&q=80"
                  alt="Socks"
                  loading="lazy"
                />
                <div className={styles.itemInfo}>
                  <div className={styles.itemName}>Merino Wool Socks</div>
                  <div className={styles.itemPrice}>$22</div>
                  <div className={styles.itemMatch}>Trending match</div>
                </div>
                <button className={styles.itemAdd}>+ Add</button>
              </div>

              <div className={styles.widgetItem}>
                <img
                  src="https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=200&h=250&fit=crop&q=80"
                  alt="Shirt"
                  loading="lazy"
                />
                <div className={styles.itemInfo}>
                  <div className={styles.itemName}>Linen Button-down</div>
                  <div className={styles.itemPrice}>$85</div>
                  <div className={styles.itemMatch}>Best seller</div>
                </div>
                <button className={styles.itemAdd}>+ Add</button>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
