'use client';

import styles from './shopwizer.module.css';
import { AnimatedSection } from './AnimatedSection';

const logos = [
  { src: '/true-classic-tees-logo.jpg', alt: 'True Classic' },
  { src: '/twinings-tea-logo.jpg', alt: 'Twinings Tea' },
  { src: '/charlotte-russe-logo.jpg', alt: 'Charlotte Russe' },
  { src: '/pink-lily-boutique-logo.jpg', alt: 'Pink Lily Boutique' },
  { src: '/road-id-logo.jpg', alt: 'Road ID' },
  { src: '/fabricville-logo.jpg', alt: 'Fabricville' },
  { src: '/uhs-hardware-logo.jpg', alt: 'UHS Hardware' },
  { src: '/lang-companies-logo.jpg', alt: 'Lang Companies' },
];

export function SliceLogoBar() {
  return (
    <AnimatedSection direction="none" delay={0.3}>
      <div className={styles.logoBar}>
        <div className={styles.logoBarLabel}>Trusted by leading brands</div>
        <div className={styles.logoTrackWrapper}>
          <div className={styles.logoTrack}>
            {/* Duplicate logos for seamless loop */}
            {[...logos, ...logos].map((logo, idx) => (
              <img
                key={idx}
                src={logo.src}
                alt={logo.alt}
                className={styles.logoItem}
                loading="lazy"
              />
            ))}
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
}
