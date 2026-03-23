import { BlockStack, Text, Card } from '@shopify/polaris';
import { PolarisFixtureProvider } from '../PolarisFixtureProvider';
import { ExpandableHtml } from './ExpandableHtml';

const shortHtml = '<p>A brief product description that fits in two lines.</p>';

const longHtml = `
<p>This premium cotton t-shirt features a classic crew neck design with reinforced
stitching for durability. Made from 100% organic cotton, this shirt offers exceptional
comfort and breathability for everyday wear.</p>
<p>Available in multiple colors and sizes. Machine washable at 30°C.
Tumble dry low. Iron on medium heat. Do not bleach.</p>
<ul>
  <li>100% organic cotton</li>
  <li>Reinforced crew neck</li>
  <li>Pre-shrunk fabric</li>
  <li>Ethically manufactured</li>
</ul>
`;

export default function ExpandableHtmlFixture() {
  return (
    <PolarisFixtureProvider>
      <BlockStack gap="400">
        <Text as="h2" variant="headingMd">
          ExpandableHtml
        </Text>

        <Card>
          <BlockStack gap="300">
            <Text as="h3" variant="headingSm">
              Short content (no toggle)
            </Text>
            <ExpandableHtml html={shortHtml} />
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="300">
            <Text as="h3" variant="headingSm">
              Long content (2 lines, expandable)
            </Text>
            <ExpandableHtml html={longHtml} maxLines={2} />
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="300">
            <Text as="h3" variant="headingSm">
              Long content (4 lines)
            </Text>
            <ExpandableHtml html={longHtml} maxLines={4} />
          </BlockStack>
        </Card>
      </BlockStack>
    </PolarisFixtureProvider>
  );
}
