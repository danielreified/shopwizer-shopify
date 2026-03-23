'use client';

import styles from './shopwizer.module.css';
import { Check, Plus, Minus } from 'lucide-react';
import { useState } from 'react';

const plans = [
  {
    name: 'Starter',
    price: 'Free',
    description: 'Perfect for trying out ShopWise',
    features: [
      'Up to 1,000 recommendations/month',
      'Basic analytics dashboard',
      'Email support',
      '2 recommendation types',
    ],
    cta: 'Start Free',
    popular: false,
  },
  {
    name: 'Growth',
    price: '$49',
    description: 'For growing Shopify stores',
    features: [
      'Up to 50,000 recommendations/month',
      'Advanced analytics & insights',
      'Priority support',
      'All 6 recommendation types',
      'A/B testing',
    ],
    cta: 'Start 14-Day Trial',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For high-volume stores',
    features: [
      'Unlimited recommendations',
      'Dedicated account manager',
      'Custom AI model training',
      'SLA guarantee',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
];

const faqs = [
  {
    question: 'Do I need a developer to install ShopWise?',
    answer:
      'No! ShopWise is designed to be plug-and-play. Simply install the app from the Shopify App Store, and our setup wizard will guide you through the process in minutes.',
  },
  {
    question: 'Will this replace my current recommendation system?',
    answer:
      'ShopWise works alongside your existing setup or can completely replace it. Our AI-powered recommendations are more accurate and personalized than traditional rule-based systems.',
  },
  {
    question: 'Will it slow down my store?',
    answer:
      'Not at all! ShopWise is optimized for performance with lazy loading and edge caching. Our recommendations load asynchronously.',
  },
  {
    question: 'Is setup a time sink?',
    answer:
      'Setup takes less than 5 minutes. Our intelligent system starts learning from your store data immediately.',
  },
];

export function SlicePricing() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <section className={styles.pricingSlice}>
      <div className={styles.pricingHeader}>
        <h2>Simple, Transparent Pricing</h2>
        <p>
          Choose the perfect plan for your store. All plans include our core AI recommendation
          features with no hidden fees.
        </p>
      </div>

      <div className={styles.pricingGrid}>
        {plans.map((plan, idx) => (
          <div key={idx} className={`${styles.pricingCard} ${plan.popular ? styles.popular : ''}`}>
            <div className={styles.planName}>
              {plan.name}
              {plan.popular && <span className={styles.planPopularTag}>Popular</span>}
            </div>
            <div className={styles.planPrice}>
              {plan.price}
              {plan.price !== 'Free' && plan.price !== 'Custom' && <span>/mo</span>}
            </div>
            <ul className={styles.planFeatures}>
              {plan.features.map((feature, i) => (
                <li key={i}>
                  <Check size={16} /> {feature}
                </li>
              ))}
            </ul>
            <button className={styles.planBtn}>{plan.cta}</button>
          </div>
        ))}
      </div>

      <div className={styles.faqSection}>
        {faqs.map((faq, idx) => {
          const isOpen = openFaq === idx;
          return (
            <div key={idx} className={`${styles.faqItem} ${isOpen ? styles.open : ''}`}>
              <div className={styles.faqQuestion} onClick={() => setOpenFaq(isOpen ? null : idx)}>
                {faq.question}
                {isOpen ? <Minus size={20} /> : <Plus size={20} />}
              </div>
              <div className={styles.faqAnswer}>{faq.answer}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
