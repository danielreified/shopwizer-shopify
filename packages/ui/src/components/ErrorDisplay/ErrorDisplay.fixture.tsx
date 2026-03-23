import { BlockStack, Text, Card } from '@shopify/polaris';
import { PolarisFixtureProvider } from '../PolarisFixtureProvider';
import { ErrorDisplay } from './ErrorDisplay';

export default function ErrorDisplayFixture() {
  return (
    <PolarisFixtureProvider>
      <BlockStack gap="400">
        <Text as="h2" variant="headingMd">
          ErrorDisplay
        </Text>

        <Card>
          <BlockStack gap="300">
            <Text as="h3" variant="headingSm">
              Generic error
            </Text>
            <ErrorDisplay onReload={() => alert('Reload clicked')} />
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="300">
            <Text as="h3" variant="headingSm">
              404 Not Found
            </Text>
            <ErrorDisplay
              statusCode={404}
              statusText="Not Found"
              message="The page you're looking for doesn't exist."
              onReload={() => alert('Reload clicked')}
            />
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="300">
            <Text as="h3" variant="headingSm">
              500 Server Error (no reload)
            </Text>
            <ErrorDisplay
              statusCode={500}
              statusText="Internal Server Error"
              message="Our servers encountered an issue. Please try again later."
              hideReload
            />
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="300">
            <Text as="h3" variant="headingSm">
              Custom title and message
            </Text>
            <ErrorDisplay
              title="Sync failed"
              message="Unable to sync products from your store. Check your API credentials."
              onReload={() => alert('Reload clicked')}
            />
          </BlockStack>
        </Card>
      </BlockStack>
    </PolarisFixtureProvider>
  );
}
