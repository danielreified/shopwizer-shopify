import { BlockStack, Text } from '@shopify/polaris';
import { ChartLineIcon, MagicIcon } from '@shopify/polaris-icons';
import { PolarisFixtureProvider } from '../PolarisFixtureProvider';
import { AccountStatusCard } from './AccountStatusCard';

export default function AccountStatusCardFixture() {
  return (
    <PolarisFixtureProvider>
      <BlockStack gap="400">
        <Text as="h2" variant="headingMd">
          AccountStatusCard
        </Text>

        <div style={{ maxWidth: 320 }}>
          <AccountStatusCard
            planName="Growth"
            trialDays={14}
            orders={250}
            limit={1000}
            products={1234}
            onNavigate={(path) => alert(`Navigate to ${path}`)}
            insights={[
              {
                icon: ChartLineIcon,
                title: 'Revenue Insight',
                description: 'Your revenue from recommendations is up 12% this week!',
                iconTone: 'info',
              },
              {
                icon: MagicIcon,
                title: 'Optimization Tip',
                description: "Try adding 'Complete the Look' bundles to your PDPs for higher AOV.",
                iconBgColor: 'var(--p-color-bg-fill-magic-secondary)',
                iconTone: 'magic',
              },
            ]}
          />
        </div>

        <Text as="h3" variant="headingSm">
          Free plan (no trial, no limit, no insights)
        </Text>
        <div style={{ maxWidth: 320 }}>
          <AccountStatusCard
            planName="Free"
            trialDays={0}
            orders={42}
            products={89}
            onNavigate={(path) => alert(`Navigate to ${path}`)}
          />
        </div>
      </BlockStack>
    </PolarisFixtureProvider>
  );
}
