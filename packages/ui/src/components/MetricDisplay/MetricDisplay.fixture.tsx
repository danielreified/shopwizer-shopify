import { BlockStack, InlineStack, Text, Card } from '@shopify/polaris';
import { PolarisFixtureProvider } from '../PolarisFixtureProvider';
import { MetricDisplay } from './MetricDisplay';

export default function MetricDisplayFixture() {
  return (
    <PolarisFixtureProvider>
      <BlockStack gap="400">
        <Text as="h2" variant="headingMd">
          MetricDisplay
        </Text>

        <Card>
          <BlockStack gap="300">
            <Text as="h3" variant="headingSm">
              Basic metrics
            </Text>
            <InlineStack gap="800">
              <MetricDisplay value={1234} label="Total orders" />
              <MetricDisplay value={89} label="Products synced" suffix="%" />
              <MetricDisplay value={42500} label="Revenue" prefix="R " isCurrency />
            </InlineStack>
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="300">
            <Text as="h3" variant="headingSm">
              Tones and sizes
            </Text>
            <InlineStack gap="800">
              <MetricDisplay
                value={23}
                label="Conversion rate"
                suffix="%"
                valueTone="success"
                valueVariant="headingLg"
              />
              <MetricDisplay value={-5.2} label="Change" suffix="%" valueTone="critical" />
              <MetricDisplay value={0} label="Errors today" emptyDash valueTone="subdued" />
            </InlineStack>
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="300">
            <Text as="h3" variant="headingSm">
              Centered alignment
            </Text>
            <InlineStack gap="800" align="center">
              <MetricDisplay value={156} label="Clicks" alignment="center" />
              <MetricDisplay value={3200} label="Impressions" alignment="center" />
              <MetricDisplay value={4.8} label="CTR" suffix="%" alignment="center" />
            </InlineStack>
          </BlockStack>
        </Card>
      </BlockStack>
    </PolarisFixtureProvider>
  );
}
