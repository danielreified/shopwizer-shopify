import { HoverInfoButton } from './HoverInfoButton';
import { Text, InlineStack, Card } from '@shopify/polaris';
import { PolarisFixtureProvider } from '../PolarisFixtureProvider';

export default function HoverInfoButtonFixture() {
  return (
    <PolarisFixtureProvider>
      <Card>
        <InlineStack align="start" gap="200">
          <Text as="h3" variant="headingSm">
            Hover for info
          </Text>
          <HoverInfoButton label="More details">
            <Text as="p" variant="bodySm">
              This setting controls how recommendations are blended across rails.
            </Text>
          </HoverInfoButton>
        </InlineStack>
      </Card>
    </PolarisFixtureProvider>
  );
}
