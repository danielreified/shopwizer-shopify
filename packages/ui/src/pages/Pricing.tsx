import { useState, useCallback } from 'react';
import { Page, Button, InlineGrid } from '@shopify/polaris';
import { ChevronDownIcon } from '@shopify/polaris-icons';
import { Sparkles, Check } from 'lucide-react';

import Modal from '../components/Modal/Modal';
import { Footer } from '../components/Footer/Footer';
import { MarketingCard } from '../components/MarketingCard/MarketingCard';

const YEARLY_DISCOUNT = 0.2;

const plans = [
  {
    name: 'Starter',
    price: 14,
    period: 'month',
    features: [
      'Everything in Free +',
      'Unlimited appointments',
      'Unlimited services',
      'Admin rescheduling & cancelling',
      'Bundle booking',
      'Subscription booking',
      'Booking without checkout',
      'Send invoice for manual bookings',
      'Service weekly schedule',
      'Google Calendar integration',
      'Consecutive slots booking',
    ],
    more: 'Show more',
    trial: '7-day free trial',
    highlighted: false,
  },
  {
    name: 'Business',
    price: 27,
    period: 'month',
    features: [
      'Everything in Starter +',
      'Customer reschedule & cancel bookings',
      'Book from any page',
      'Co-staffed option',
      'Sync cancellation with Shopify',
      'Multiple timezones',
      'Team portal',
      'Outlook integration',
      'SMS/WhatsApp Notification ($0.07/SMS for the US)',
      'Add-on products',
      'POS integration',
    ],
    more: 'Show more',
    trial: '7-day free trial',
    highlighted: true,
    label: 'Most popular',
  },
  {
    name: 'Enterprise',
    price: 47,
    period: 'month',
    features: [
      'Everything in Business +',
      'Deposit booking',
      'Custom email senders',
      'Klaviyo automation marketing',
      'Multiple bookings',
      'Teams integration',
      'Seasonal pricing',
      'Separate calendar page',
      'Auto email translation',
      'Advanced variants selection',
      'Subscription discount',
    ],
    more: null,
    trial: '7-day free trial',
    highlighted: false,
  },
];

export default function PricingPage() {
  // const [interval, setInterval] = useState("monthly");
  const [cycle] = useState<'monthly' | 'yearly'>('monthly');

  const [modalOpen, setModalOpen] = useState(false);
  const toggleModal = useCallback(() => setModalOpen((open) => !open), []);

  return (
    <Page
      title="Pricing"
      primaryAction={{ content: 'Add code', onAction: toggleModal }}
      secondaryActions={[{ content: 'Skip', onAction: () => {} }]}
    >
      {modalOpen && <Modal />}
      <Layout>
        <Layout.Section>
          <MarketingCard
            title="You still on your trial period"
            description="Create campaigns to evaluate how marketing initiatives drive business goals. Capture online and offline touchpoints, add campaign activities from multiple marketing channels, and monitor results."
            ctaLabel="Go to dashboard"
            onCta={() => alert('Create campaign')}
            imageSrc="https://cdn.shopify.com/shopifycloud/web/assets/v1/vite/client/en/assets/campaign-folder-empty-CXtBhz9-KBSx.svg"
            imageAlt=""
          />
        </Layout.Section>

        <Layout.Section>
          <InlineGrid columns={3} gap="300">
            {plans.map((plan) => {
              const isYearly = cycle === 'yearly';
              const discounted = plan.price * (1 - YEARLY_DISCOUNT);

              return (
                <div key={plan.name}>
                  <div
                    className={`relative bg-white p-6 ${plan.highlighted ? 'border-4 border-blue-500 scale-104 shadow-lg' : 'border border-gray-300 mt-4 shadow-sm'} rounded-md transform transition-transform`}
                  >
                    {plan.label && (
                      <div
                        className={`absolute left-1/2 -translate-x-1/2 ${plan.label ? 'top-[-12px]' : ''} inline-block bg-blue-500 text-white text-xs font-medium px-3 py-1 rounded-full`}
                      >
                        <span className="flex gap-1 items-center">
                          {plan.label} <Sparkles size={12} className="text-yellow-400" />
                        </span>
                      </div>
                    )}
                    {isYearly && (
                      <div className="absolute right-3 top-3">
                        <span
                          className="rounded-md bg-blue-500 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-white shadow"
                          aria-label="20% off"
                        >
                          20% off
                        </span>
                      </div>
                    )}

                    <div style={{ fontWeight: 700, fontSize: '1.125rem' }}>{plan.name}</div>
                    <div
                      style={{
                        color: '#6b7280',
                        fontSize: '0.875rem',
                        marginBottom: 16,
                      }}
                    >
                      {plan.description || ''}
                    </div>

                    <div className="text-[2rem] font-bold text-blue-500 mb-1">
                      ${(isYearly ? discounted : plan.price).toFixed(2)}
                      <span className="text-xs text-gray-500">/month</span>
                    </div>
                    {isYearly && (
                      <div className="mb-2 text-xs text-gray-500">
                        Billed yearly •{' '}
                        <span className="line-through">${plan.price.toFixed(2)}</span>
                        /mo
                      </div>
                    )}

                    <div className="mt-4">
                      <Button
                        variant="primary"
                        fullWidth
                        onClick={() => console.log('Trial clicked')}
                      >
                        Start {plan.trial}
                      </Button>
                    </div>

                    <ul className="mt-8 mb-6 text-sm text-gray-700 flex flex-col gap-2">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center">
                          <span>
                            <Check size={16} className="text-green-500 mr-2" />
                          </span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button icon={ChevronDownIcon} fullWidth variant="tertiary">
                      Show more
                    </Button>
                  </div>
                </div>
              );
            })}
          </InlineGrid>
        </Layout.Section>
      </Layout>
      <Footer
        text="Learn more about"
        linkLabel="fulfilling orders"
        linkUrl="https://help.shopify.com/manual/orders/fulfill-orders"
      />
    </Page>
  );
}
