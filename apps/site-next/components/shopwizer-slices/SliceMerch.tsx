'use client';

import styles from './shopwizer.module.css';
import { AnimatedSection } from './AnimatedSection';
import { StaggerContainer, StaggerItem } from './StaggerContainer';

export function SliceMerch() {
  return (
    <section className={styles.merchSlice}>
      <AnimatedSection>
        <div className={styles.merchHeader}>
          <h2>
            Curated for{' '}
            <em style={{ fontFamily: 'var(--font-dm-serif), serif', fontStyle: 'italic' }}>each</em>{' '}
            customer
          </h2>
          <p>
            Shopwizer rearranges your product grid based on what each visitor is most likely to buy.
          </p>
        </div>
      </AnimatedSection>

      <StaggerContainer className={styles.merchGrid}>
        {/* Featured large card */}
        <StaggerItem className={`${styles.merchCard} ${styles.featured}`}>
          <img
            className={styles.cardImage}
            src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&h=1000&fit=crop&q=80"
            alt="Featured product"
            loading="lazy"
          />
          <div className={styles.cardBody}>
            <div className={styles.cardBrand}>Maison Moderne</div>
            <div className={styles.cardName}>Tailored Blazer — Oatmeal</div>
            <div className={styles.cardPrice}>$345</div>
            <div className={styles.cardScore}>
              <div className={styles.scoreBar}>
                <div className={styles.fill} style={{ width: '94%' }}></div>
              </div>
              94% match
            </div>
          </div>
        </StaggerItem>

        <StaggerItem className={styles.merchCard}>
          <img
            className={styles.cardImage}
            src="https://images.unsplash.com/photo-1434389677669-e08b4cda3a99?w=400&h=530&fit=crop&q=80"
            alt="Product"
            loading="lazy"
          />
          <div className={styles.cardBody}>
            <div className={styles.cardBrand}>Studio</div>
            <div className={styles.cardName}>Silk Midi Skirt</div>
            <div className={styles.cardPrice}>$185</div>
            <div className={styles.cardScore}>
              <div className={styles.scoreBar}>
                <div className={styles.fill} style={{ width: '87%' }}></div>
              </div>
              87% match
            </div>
          </div>
        </StaggerItem>

        <StaggerItem className={styles.merchCard}>
          <img
            className={styles.cardImage}
            src="https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=530&fit=crop&q=80"
            alt="Product"
            loading="lazy"
          />
          <div className={styles.cardBody}>
            <div className={styles.cardBrand}>Essentials</div>
            <div className={styles.cardName}>Cotton Turtleneck</div>
            <div className={styles.cardPrice}>$89</div>
            <div className={styles.cardScore}>
              <div className={styles.scoreBar}>
                <div className={styles.fill} style={{ width: '82%' }}></div>
              </div>
              82% match
            </div>
          </div>
        </StaggerItem>

        <StaggerItem className={styles.merchCard}>
          <img
            className={styles.cardImage}
            src="https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=530&fit=crop&q=80"
            alt="Product"
            loading="lazy"
          />
          <div className={styles.cardBody}>
            <div className={styles.cardBrand}>Artisan</div>
            <div className={styles.cardName}>Leather Tote Bag</div>
            <div className={styles.cardPrice}>$240</div>
            <div className={styles.cardScore}>
              <div className={styles.scoreBar}>
                <div className={styles.fill} style={{ width: '76%' }}></div>
              </div>
              76% match
            </div>
          </div>
        </StaggerItem>

        <StaggerItem className={styles.merchCard}>
          <img
            className={styles.cardImage}
            src="https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&h=530&fit=crop&q=80"
            alt="Product"
            loading="lazy"
          />
          <div className={styles.cardBody}>
            <div className={styles.cardBrand}>Sole</div>
            <div className={styles.cardName}>Suede Ankle Boots</div>
            <div className={styles.cardPrice}>$265</div>
            <div className={styles.cardScore}>
              <div className={styles.scoreBar}>
                <div className={styles.fill} style={{ width: '71%' }}></div>
              </div>
              71% match
            </div>
          </div>
        </StaggerItem>
      </StaggerContainer>

      <AnimatedSection delay={0.3}>
        <div className={styles.merchInsight}>
          <svg viewBox="-170 -170 340 340">
            <g transform="rotate(45)">
              <path
                d="M -3,-115 C -40,-115 -80,-100 -95,-85 C -100,-80 -115,-40 -115,-3 L -40,0 Q 0,0 0,-40 Z"
                fill="#5B8A4A"
              />
              <path
                d="M 115,-3 C 115,-40 100,-80 85,-95 C 80,-100 40,-115 3,-115 L 0,-40 Q 0,0 40,0 Z"
                fill="#5B8A4A"
              />
              <path
                d="M 3,115 C 40,115 80,100 95,85 C 100,80 115,40 115,3 L 40,0 Q 0,0 0,40 Z"
                fill="#5B8A4A"
              />
              <path
                d="M -115,3 C -115,40 -100,80 -85,95 C -80,100 -40,115 -3,115 L 0,40 Q 0,0 -40,0 Z"
                fill="#5B8A4A"
              />
            </g>
          </svg>
          <div className={styles.insightText}>
            <strong>Shopwizer insight:</strong> This visitor browsed blazers and midi skirts in the
            last 7 days. Grid reordered to show highest-converting items first — projected{' '}
            <strong>+34% conversion lift</strong> vs. default sort.
          </div>
        </div>
      </AnimatedSection>
    </section>
  );
}
