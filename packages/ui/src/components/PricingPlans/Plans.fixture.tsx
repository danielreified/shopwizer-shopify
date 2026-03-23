import { Plans } from './PricingPlans';
import type { PlanBracket, CustomPlan } from './PricingPlans';

const PLAN_BRACKETS: PlanBracket[] = [
  { min: 0, max: 0, price: 0, name: 'Free', slug: 'free', label: '0 orders/month', isFree: true },
  { min: 1, max: 100, price: 9, name: 'Starter', slug: 'starter', label: 'Up to 100 orders/month' },
  {
    min: 101,
    max: 500,
    price: 29,
    name: 'Growth',
    slug: 'growth',
    label: 'Up to 500 orders/month',
  },
  { min: 501, max: 2000, price: 79, name: 'Pro', slug: 'pro', label: 'Up to 2,000 orders/month' },
  {
    min: 2001,
    max: 10000,
    price: 199,
    name: 'Scale',
    slug: 'scale',
    label: 'Up to 10,000 orders/month',
  },
];

const CUSTOM_PLAN: CustomPlan = {
  name: 'Enterprise',
  price: 149,
  currency: 'USD',
  interval: 'MONTHLY',
  code: 'PARTNER2024',
  title: 'Partner discount applied',
};

// Default: Public plans with slider
export default function Default() {
  return (
    <Plans
      planBrackets={PLAN_BRACKETS}
      selectedPlan={{ name: 'Growth' }}
      onSelectPlan={(plan) => console.log('Selected:', plan)}
    />
  );
}

// Loading state
export function Loading() {
  return <Plans loading planBrackets={PLAN_BRACKETS} />;
}

// No plan selected
export function NoPlanSelected() {
  return (
    <Plans planBrackets={PLAN_BRACKETS} onSelectPlan={(plan) => console.log('Selected:', plan)} />
  );
}

// Activating state (button loading)
export function Activating() {
  return (
    <Plans
      planBrackets={PLAN_BRACKETS}
      activating
      onSelectPlan={(plan) => console.log('Selected:', plan)}
    />
  );
}

// Custom plan view
export function CustomPlanView() {
  return (
    <Plans
      customPlan={CUSTOM_PLAN}
      onSelectCustomPlan={(plan) => console.log('Selected custom:', plan)}
    />
  );
}

// Custom plan - free tier
export function CustomPlanFree() {
  return (
    <Plans
      customPlan={{
        ...CUSTOM_PLAN,
        name: 'Free Partner',
        price: 0,
        code: 'FREEPARTNER',
        title: 'Free partner plan',
      }}
    />
  );
}
