'use client';

import styles from './shopwizer.module.css';
import { AnimatedSection } from './AnimatedSection';
import { StaggerContainer, StaggerItem } from './StaggerContainer';

export function SliceSteps() {
  const steps = [
    {
      step: '01',
      title: 'Install in One Click',
      description:
        'Add ShopWise to your Shopify store in seconds. No coding required, no technical expertise needed.',
    },
    {
      step: '02',
      title: 'AI Learns Your Store',
      description:
        'Our AI analyzes your products, customer behavior, and sales data to understand your unique business.',
    },
    {
      step: '03',
      title: 'Customize & Configure',
      description:
        'Fine-tune recommendation strategies, placement, and design to match your brand perfectly.',
    },
    {
      step: '04',
      title: 'Watch Sales Grow',
      description:
        'Sit back as intelligent recommendations drive conversions, increase AOV, and delight your customers.',
    },
  ];

  return (
    <section className={styles.stepsSlice}>
      <AnimatedSection>
        <div className={styles.stepsHeader}>
          <h2>Get started in minutes</h2>
        </div>
      </AnimatedSection>
      <StaggerContainer className={styles.stepsGrid}>
        {steps.map((item, idx) => (
          <StaggerItem key={idx} className={styles.stepCard}>
            <div className={styles.stepNum}>{item.step}</div>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </section>
  );
}
