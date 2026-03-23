'use client';

import { useState } from 'react';
import { Card, InlineGrid, Text, Button, BlockStack, Badge, Banner } from '@shopify/polaris';
import { CheckCircle2 as Check } from 'lucide-react';
import { SkeletonBlock } from '../Skeleton';

// ---------------------------------------------------------------------------
// CONSTANTS & TYPES
// ---------------------------------------------------------------------------

export const UNIVERSAL_FEATURES = [
  'AI Similar Products',
  'Matching Color',
  'Frequently Bought Together',
  'Trending & New Arrivals',
  'Basic Analytics',
  'Up to 5,000 products',
];

export type PlanBracket = {
  min: number;
  max: number;
  price: number;
  name: string;
  slug: string;
  label: string;
  isFree?: boolean;
};

export type CustomPlan = {
  name: string;
  slug: string;
  price: number;
  currency: string;
  interval: 'MONTHLY' | 'YEARLY';
  code?: string;
  title?: string;
};

export type PlansProps = {
  // State
  loading?: boolean;
  activating?: boolean;
  cancelling?: boolean;

  // For public plans
  planBrackets?: PlanBracket[];
  selectedPlan?: { name: string } | null;
  onSelectPlan?: (plan: PlanBracket) => void;

  // For custom plans (when redeemed)
  customPlan?: CustomPlan | null;
  onSelectCustomPlan?: (plan: CustomPlan) => void;

  // For active custom plan
  isCustomPlanActive?: boolean;
  onCancelSubscription?: () => void;
};

// ---------------------------------------------------------------------------
// LOADING STATE
// ---------------------------------------------------------------------------

function LoadingState() {
  return (
    <Card>
      <InlineGrid columns={2} gap="400">
        <div className="bg-white p-6 rounded-xl border border-gray-300 relative">
          <SkeletonBlock height={380} />
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-300 flex">
          <SkeletonBlock height={380} />
        </div>
      </InlineGrid>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// CUSTOM PLAN VIEW
// ---------------------------------------------------------------------------

function CustomPlanView({
  plan,
  activating,
  cancelling,
  isActive,
  onSelectPlan,
  onCancel,
}: {
  plan: CustomPlan;
  activating?: boolean;
  cancelling?: boolean;
  isActive?: boolean;
  onSelectPlan?: (plan: CustomPlan) => void;
  onCancel?: () => void;
}) {
  const isFree = Number(plan.price) === 0;

  return (
    <BlockStack gap="300">
      {plan.code && (
        <Banner tone="info" title={`Redeemed code: ${plan.code}`}>
          <p>
            This shop is on a custom pricing plan activated with a private code. Billing and upgrade
            options are managed manually.
          </p>
        </Banner>
      )}
      <Card>
        <InlineGrid columns={2} gap="400">
          {/* LEFT COLUMN — MAIN PLAN CARD */}
          <div className="bg-white p-6 rounded-xl border border-gray-300 relative">
            <BlockStack gap="300">
              <div className="flex items-center gap-2">
                <Text as="h2" variant="headingLg">
                  {plan.name}
                </Text>
                {isFree && <Badge tone="success">Always free</Badge>}
                {!isFree && <Badge tone="info">Custom plan</Badge>}
              </div>

              <div className="flex items-end mt-2">
                <span className="text-[2.5rem] font-bold">{isFree ? '$0' : `$${plan.price}`}</span>
                {!isFree && (
                  <div className="ml-2 pb-2">
                    <Text as="span" variant="bodySm" tone="subdued">
                      /month
                    </Text>
                  </div>
                )}
              </div>

              <Text as="p" tone="subdued">
                {isFree ? 'Free forever plan' : 'Custom monthly flat rate'}
              </Text>

              <div className="mt-2 flex flex-col gap-2">
                {isActive ? (
                  <>
                    <Button fullWidth disabled size="large">
                      Activate Plan
                    </Button>
                    {onCancel && (
                      <Button
                        fullWidth
                        variant="tertiary"
                        tone="critical"
                        loading={cancelling}
                        onClick={onCancel}
                      >
                        Cancel Subscription
                      </Button>
                    )}
                  </>
                ) : (
                  <Button
                    loading={activating}
                    fullWidth
                    size="large"
                    onClick={() => onSelectPlan?.(plan)}
                  >
                    Activate Plan
                  </Button>
                )}
              </div>

              <hr className="my-2 border-gray-200" />

              <ul className="text-sm text-gray-700 flex flex-col gap-3">
                {UNIVERSAL_FEATURES.map((ft) => (
                  <li key={ft} className="flex items-center">
                    <Check size={18} className="text-green-600 mr-2" />
                    {ft}
                  </li>
                ))}
              </ul>
            </BlockStack>
          </div>

          {/* RIGHT COLUMN — EXPLANATION CARD */}
          <div className="bg-white p-6 rounded-xl border border-gray-300 flex">
            <div className="flex flex-1 flex-col">
              <div className="flex flex-1 flex-col">
                <BlockStack gap="300">
                  <Text as="h2" variant="headingLg">
                    {plan.title ?? 'Custom pricing for your store'}
                  </Text>
                  <Text as="p" tone="subdued">
                    This shop is on a manually negotiated pricing plan. Custom plans do not vary
                    with monthly order volume, and upgrades are handled on request.
                  </Text>
                </BlockStack>
              </div>

              <div className="flex flex-col">
                <BlockStack gap="300">
                  <div>
                    <Banner tone="info" title="No automatic upgrades">
                      <p>
                        Your plan is fixed at the agreed rate. If your needs change, contact us to
                        adjust your plan.
                      </p>
                    </Banner>
                    <Banner title="No extra charges" tone="info">
                      <p>
                        We never charge extra or add unexpected fees. Your plan is fixed and if
                        you're approaching your monthly limit, we'll notify you before any upgrade
                        is needed.
                      </p>
                    </Banner>
                  </div>

                  <div className="rounded-lg border border-gray-300 px-4 py-2 bg-gray-50 flex justify-center">
                    <Text as="span" variant="bodyMd">
                      Your current plan: <b>{plan.name}</b>
                    </Text>
                  </div>
                </BlockStack>
              </div>
            </div>
          </div>
        </InlineGrid>
      </Card>
    </BlockStack>
  );
}

// ---------------------------------------------------------------------------
// PUBLIC PLANS VIEW (with slider)
// ---------------------------------------------------------------------------

function PublicPlansView({
  planBrackets,
  selectedPlan,
  activating,
  onSelectPlan,
  onCancelSubscription,
}: {
  planBrackets: PlanBracket[];
  selectedPlan?: { name: string } | null;
  activating?: boolean;
  onSelectPlan?: (plan: PlanBracket) => void;
  onCancelSubscription?: () => void;
}) {
  // Extract base plan name (e.g., "pro (monthly)" → "pro")
  const getBaseName = (name: string) => {
    const match = name.match(/^([^(]+)/);
    return (match ? match[1].trim() : name).toLowerCase();
  };

  // Find the index of the current plan
  const findPlanIndex = () => {
    if (!selectedPlan?.name) return 1;
    const baseName = getBaseName(selectedPlan.name);
    const idx = planBrackets.findIndex(
      (p) => p.name.toLowerCase() === baseName || p.slug === baseName,
    );
    return idx >= 0 ? idx : 1;
  };

  const [sliderIndex, setSliderIndex] = useState(findPlanIndex);

  const plan = planBrackets[sliderIndex];
  const currentPlanBaseName = selectedPlan?.name ? getBaseName(selectedPlan.name) : null;
  const isSelected =
    currentPlanBaseName === plan.name.toLowerCase() || currentPlanBaseName === plan.slug;
  const isFree = plan.isFree === true;

  const sliderPct = planBrackets.length > 1 ? (sliderIndex / (planBrackets.length - 1)) * 100 : 0;

  return (
    <Card>
      <InlineGrid columns={2} gap="400">
        <div className="bg-white p-6 rounded-xl border border-gray-300 relative">
          <BlockStack gap="100">
            <div className="flex items-center gap-2">
              <Text as="h2" variant="headingLg">
                {plan.name}
              </Text>
              {isFree && <Badge tone="success">Always free</Badge>}
            </div>

            <BlockStack gap="100">
              <div className="flex items-end">
                <span className="text-[2.5rem] font-bold">${plan.price}</span>
                <div className="ml-2 pb-2">
                  <Text as="span" variant="bodySm" tone="subdued">
                    /month
                  </Text>
                </div>
              </div>

              <Text as="p" tone="subdued">
                {plan.label}
              </Text>
            </BlockStack>

            <div className="mt-4">
              {isFree ? (
                isSelected ? (
                  <Button fullWidth disabled size="large">
                    Your current plan
                  </Button>
                ) : (
                  <Button
                    fullWidth
                    size="large"
                    loading={activating}
                    onClick={() => {
                      console.log('🔽 [PricingPlans] Downgrade to Free clicked!');
                      console.log('   onCancelSubscription exists:', !!onCancelSubscription);
                      onCancelSubscription?.();
                    }}
                  >
                    Downgrade to Free
                  </Button>
                )
              ) : (
                <Button
                  variant={isSelected ? 'secondary' : 'primary'}
                  loading={activating}
                  fullWidth
                  size="large"
                  disabled={isSelected}
                  onClick={() => onSelectPlan?.(plan)}
                >
                  {isSelected ? 'Your current plan' : 'Activate plan'}
                </Button>
              )}
            </div>

            <hr className="my-4 border-gray-200" />

            <ul className="text-sm text-gray-700 flex flex-col gap-3">
              {UNIVERSAL_FEATURES.map((ft) => (
                <li key={ft} className="flex items-center">
                  <Check size={18} className="text-green-600 mr-2" />
                  {ft}
                </li>
              ))}
            </ul>
          </BlockStack>
        </div>

        {/* RIGHT — SLIDER */}
        <div className="bg-white p-6 rounded-xl border border-gray-300 flex flex-col justify-between h-full">
          <div>
            <BlockStack gap="200">
              <Text as="h2" variant="headingLg">
                Adjust your plan based on your monthly orders
              </Text>
              <Text as="p" variant="bodyMd" tone="subdued">
                Your pricing updates automatically based on your order volume.
              </Text>
            </BlockStack>

            {/* SLIDER */}
            <div className="mt-6">
              <div className="relative w-full pt-4 pb-2">
                <div className="relative h-4 rounded-full overflow-hidden bg-gray-200">
                  <div
                    className="absolute left-0 top-0 h-full bg-black transition-all z-10 pointer-events-none"
                    style={{ width: `${sliderPct}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-between px-[6px] z-0 pointer-events-none">
                    {planBrackets.map((_, i) => {
                      const isEdge = i === 0 || i === planBrackets.length - 1;
                      return (
                        <div
                          key={i}
                          className={`
                            ${isEdge ? 'w-1 h-1 bg-transparent border-none' : 'w-3 h-3 bg-white border border-gray-300'}
                            rounded-full
                          `}
                        />
                      );
                    })}
                  </div>
                </div>

                <input
                  type="range"
                  min={0}
                  max={planBrackets.length - 1}
                  step={1}
                  value={sliderIndex}
                  onChange={(e) => setSliderIndex(Number(e.target.value))}
                  className="absolute left-0 top-0 w-full h-8 opacity-0 cursor-pointer"
                />

                <div
                  className="absolute h-7 w-7 rounded-full bg-black border-2 border-white shadow-md pointer-events-none transition-all z-20"
                  style={{
                    left: `${sliderPct}%`,
                    top: '60%',
                    transform: 'translate(-50%, -50%)',
                  }}
                />
              </div>

              <div className="mt-4 text-center">
                <Text as="p" variant="bodyLg">
                  {plan.label}
                </Text>
              </div>
            </div>
          </div>

          {selectedPlan && (
            <div className="mt-8">
              <BlockStack gap="400">
                <Banner title="No extra charges" tone="info">
                  <p>
                    We never charge extra or add unexpected fees. Your plan is fixed and if you're
                    approaching your monthly limit, we'll notify you before any upgrade is needed.
                  </p>
                </Banner>

                <div className="rounded-lg border border-gray-300 px-4 py-2 bg-gray-50 text-center">
                  <Text as="p" variant="bodyMd">
                    Your current plan: <b>{selectedPlan.name}</b>
                  </Text>
                </div>
              </BlockStack>
            </div>
          )}
        </div>
      </InlineGrid>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// MAIN UNIFIED COMPONENT
// ---------------------------------------------------------------------------

export function Plans({
  loading,
  activating,
  cancelling,
  planBrackets,
  selectedPlan,
  onSelectPlan,
  customPlan,
  onSelectCustomPlan,
  isCustomPlanActive,
  onCancelSubscription,
}: PlansProps) {
  return (
    <>
      {/* Loading state */}
      {loading && <LoadingState />}

      {/* Custom plan (if redeemed) */}
      {!loading && customPlan && (
        <CustomPlanView
          plan={customPlan}
          activating={activating}
          cancelling={cancelling}
          isActive={isCustomPlanActive}
          onSelectPlan={onSelectCustomPlan}
          onCancel={onCancelSubscription}
        />
      )}

      {/* Public plans (default) */}
      {!loading && !customPlan && planBrackets && (
        <PublicPlansView
          planBrackets={planBrackets}
          selectedPlan={selectedPlan}
          activating={activating}
          onSelectPlan={onSelectPlan}
          onCancelSubscription={onCancelSubscription}
        />
      )}
    </>
  );
}

// Legacy exports for backwards compatibility
export { CustomPlanView as CustomPlans };
export { LoadingState as LoadingPlans };
export { PublicPlansView as PricingPlans };
