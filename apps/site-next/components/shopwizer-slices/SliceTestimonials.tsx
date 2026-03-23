'use client';

import styles from './shopwizer.module.css';
import { Star } from 'lucide-react';
import { AnimatedSection } from './AnimatedSection';
import { StaggerContainer, StaggerItem } from './StaggerContainer';

export function SliceTestimonials() {
  const testimonials = [
    {
      quote:
        'ShopWise transformed our store overnight. We saw a 42% increase in conversions within the first month.',
      company: 'Luxe Fashion',
      location: 'United Kingdom',
      rating: 5,
    },
    {
      quote:
        "The best investment we've made for our Shopify store. Our average order value increased by 2.8x.",
      company: 'TechGear Pro',
      location: 'Canada',
      rating: 5,
    },
    {
      quote:
        'Implementation was seamless, and the results speak for themselves. Our repeat purchase rate doubled.',
      company: 'Beauty Essentials',
      location: 'United States',
      rating: 5,
    },
    {
      quote:
        'I have brought in over $200,000 of revenue by using this app since I started using it consistently a year ago.',
      company: 'Fashion Hub',
      location: 'United States',
      rating: 5,
    },
    {
      quote: 'The app is super easy to use and set up. The recommendations are spot-on.',
      company: 'Home Decor Plus',
      location: 'Canada',
      rating: 5,
    },
    {
      quote: 'Awesome app, my ShopWise experience has been nothing but positive.',
      company: 'Sports Gear Co',
      location: 'Australia',
      rating: 5,
    },
  ];

  return (
    <section className={styles.testimonialsSlice}>
      <AnimatedSection>
        <div className={styles.testiHeader}>
          <h2>
            Trusted by over <span className={styles.testiHighlight}>500,000</span> merchants
            worldwide
          </h2>
        </div>
      </AnimatedSection>

      <StaggerContainer className={styles.testiGrid}>
        {testimonials.map((t, idx) => (
          <StaggerItem key={idx} className={styles.testiCard}>
            <div className={styles.testiRating}>
              {[...Array(t.rating)].map((_, i) => (
                <Star key={i} size={16} fill="currentColor" />
              ))}
            </div>
            <p className={styles.testiQuote}>&ldquo;{t.quote}&rdquo;</p>
            <div className={styles.testiAuthor}>
              {t.company}
              <span>{t.location}</span>
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </section>
  );
}
