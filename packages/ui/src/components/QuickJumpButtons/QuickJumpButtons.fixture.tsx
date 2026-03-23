import { BlockStack, Text, Card } from '@shopify/polaris';
import { PolarisFixtureProvider } from '../PolarisFixtureProvider';
import { QuickJumpButtons } from './QuickJumpButtons';

const sampleButtons = [
  { label: 'Similar Products', id: 'similar' },
  { label: 'Best Sellers', id: 'sellers' },
  { label: 'Trending', id: 'trending' },
  { label: 'New Arrivals', id: 'new-arrivals' },
];

export default function QuickJumpButtonsFixture() {
  return (
    <PolarisFixtureProvider>
      <BlockStack gap="400">
        <Text as="h2" variant="headingMd">
          QuickJumpButtons
        </Text>

        <Card>
          <QuickJumpButtons
            buttons={sampleButtons}
            onScrollTo={(id) => alert(`Scroll to: ${id}`)}
          />
        </Card>
      </BlockStack>
    </PolarisFixtureProvider>
  );
}
