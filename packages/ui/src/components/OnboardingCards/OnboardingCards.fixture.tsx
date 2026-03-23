import { BlockStack, Text, Badge } from '@shopify/polaris';
import {
  CheckCircleIcon,
  ClockIcon,
  OrderIcon,
  ProductIcon,
  ChartLineIcon,
  MagicIcon,
} from '@shopify/polaris-icons';
import { PolarisFixtureProvider } from '../PolarisFixtureProvider';
import { OverviewItem, ShopOverviewCard, InsightItem, GrowthInsightsCard } from './OnboardingCards';

export default function OnboardingCardsFixture() {
  return (
    <PolarisFixtureProvider>
      <BlockStack gap="600">
        <Text as="h2" variant="headingMd">
          OnboardingCards
        </Text>

        <ShopOverviewCard title="Shop Overview">
          <OverviewItem
            icon={CheckCircleIcon}
            title="Growth Plan"
            label="Current subscription"
            badge={
              <Badge tone="success" size="small">
                Active
              </Badge>
            }
            onClick={() => alert('Navigate to plans')}
          />
          <OverviewItem
            icon={ClockIcon}
            title="14 Days"
            label="Trial period remaining"
            onClick={() => alert('Navigate to plans')}
          />
          <OverviewItem
            icon={OrderIcon}
            title="250 / 1000"
            label="Orders this month"
            subValue="25% of limit used"
            onClick={() => alert('Navigate to plans')}
          />
          <OverviewItem
            icon={ProductIcon}
            title="1,234"
            label="Synced products"
            onClick={() => alert('Navigate to products')}
          />
        </ShopOverviewCard>

        <GrowthInsightsCard title="Growth Insights">
          <InsightItem
            icon={ChartLineIcon}
            title="Revenue Insight"
            description="Your revenue from recommendations is up 12% this week!"
            iconTone="info"
          />
          <InsightItem
            icon={MagicIcon}
            title="Optimization Tip"
            description="Try adding 'Complete the Look' bundles to your PDPs for higher AOV."
            iconBgColor="var(--p-color-bg-fill-magic-secondary)"
            iconTone="magic"
          />
        </GrowthInsightsCard>
      </BlockStack>
    </PolarisFixtureProvider>
  );
}
