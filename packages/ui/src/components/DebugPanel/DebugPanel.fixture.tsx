import { BlockStack, Text } from '@shopify/polaris';
import { PolarisFixtureProvider } from '../PolarisFixtureProvider';
import { DebugPanel } from './DebugPanel';

const sampleDebug = {
  logs: [
    { label: 'Recommendation request', data: { shopId: 'shop-123', productId: '456' } },
    { label: 'Similar products', data: { count: 12, latency: '45ms' } },
    { label: 'Ranking applied', data: { model: 'xgboost-v2', features: 24 } },
  ],
};

export default function DebugPanelFixture() {
  return (
    <PolarisFixtureProvider>
      <BlockStack gap="400">
        <Text as="h2" variant="headingMd">
          DebugPanel (fixed bottom-right)
        </Text>
        <Text as="p" variant="bodySm" tone="subdued">
          The debug panel appears at the bottom-right of the viewport.
        </Text>
      </BlockStack>
      <DebugPanel debug={sampleDebug} title="Rec Debug" />
    </PolarisFixtureProvider>
  );
}
