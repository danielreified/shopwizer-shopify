import { useState } from 'react';
import { BlockStack, Text, Card, Button } from '@shopify/polaris';
import { PolarisFixtureProvider } from '../PolarisFixtureProvider';
import { MediaGrid } from './MediaGrid';

const sampleImages = Array.from({ length: 12 }, (_, i) => ({
  src: `https://picsum.photos/seed/${i + 1}/200/200`,
  alt: `Sample image ${i + 1}`,
}));

export default function MediaGridFixture() {
  const [loading, setLoading] = useState(false);

  return (
    <PolarisFixtureProvider>
      <BlockStack gap="400">
        <Text as="h2" variant="headingMd">
          MediaGrid
        </Text>

        <Card>
          <BlockStack gap="300">
            <Text as="h3" variant="headingSm">
              Default (12 images, max 9 visible)
            </Text>
            <MediaGrid images={sampleImages} />
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="300">
            <Text as="h3" variant="headingSm">
              Few images (4 images, no overflow)
            </Text>
            <MediaGrid images={sampleImages.slice(0, 4)} />
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="300">
            <Text as="h3" variant="headingSm">
              Loading skeleton
            </Text>
            <Button onClick={() => setLoading(!loading)}>
              {loading ? 'Show images' : 'Show skeleton'}
            </Button>
            <MediaGrid images={sampleImages} loading={loading} />
          </BlockStack>
        </Card>
      </BlockStack>
    </PolarisFixtureProvider>
  );
}
