'use client';

import { useRef, MouseEvent } from 'react';
import styles from './shopwizer.module.css';
import { Brain, Zap, Target, TrendingUp, Users, Shield } from 'lucide-react';
import { AnimatedSection } from './AnimatedSection';
import { StaggerContainer, StaggerItem } from './StaggerContainer';
import { AmbientBackground } from './AmbientBackground';

export function SliceFeatures() {
  const gridRef = useRef<HTMLDivElement>(null);

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Intelligence',
      description:
        'Advanced machine learning algorithms analyze customer behavior, purchase history, and browsing patterns.',
    },
    {
      icon: Zap,
      title: 'Real-Time Processing',
      description:
        'Lightning-fast recommendation engine processes millions of data points instantly to show the perfect products.',
    },
    {
      icon: Target,
      title: 'Precision Targeting',
      description:
        'Segment customers automatically and deliver tailored product suggestions based on demographics.',
    },
    {
      icon: TrendingUp,
      title: 'Boost Revenue',
      description:
        'Increase average order value and conversion rates with strategic cross-sells, upsells, and complementary product recommendations.',
    },
    {
      icon: Users,
      title: 'Customer Insights',
      description:
        'Gain deep understanding of your customers with comprehensive analytics and actionable insights into shopping patterns.',
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description:
        'Bank-level encryption and GDPR compliance ensure your customer data is always protected and handled responsibly.',
    },
  ];

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    const cards = gridRef.current?.querySelectorAll(`.${styles.featureCard}`);
    cards?.forEach((card) => {
      const rect = (card as HTMLElement).getBoundingClientRect();
      (card as HTMLElement).style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
      (card as HTMLElement).style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
    });
  }

  return (
    <section id="features" className={styles.featuresSlice}>
      <AmbientBackground />
      <AnimatedSection className={styles.featuresHeader}>
        <h2>Everything you need to personalize your store</h2>
        <p>
          Powerful features designed to help you create exceptional shopping experiences and drive
          measurable results.
        </p>
      </AnimatedSection>
      <StaggerContainer>
        <div ref={gridRef} className={styles.featuresGrid} onMouseMove={handleMouseMove}>
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <StaggerItem key={idx} className={styles.featureCard}>
                <div className={styles.featureIcon}>
                  <Icon size={24} />
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </StaggerItem>
            );
          })}
        </div>
      </StaggerContainer>
    </section>
  );
}
