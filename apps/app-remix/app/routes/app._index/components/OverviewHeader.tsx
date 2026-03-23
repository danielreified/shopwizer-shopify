import { BlockStack, Text } from "@shopify/polaris";

interface OverviewHeaderProps {
  shopName: string;
}

export function OverviewHeader({ shopName }: OverviewHeaderProps) {
  return (
    <BlockStack gap="200">
      <Text as="h1" variant="headingLg">
        Welcome back, {shopName}
      </Text>
      <Text as="p" variant="bodyMd" tone="subdued">
        Here's how your shop is performing with Shopwise recommendations.
      </Text>
    </BlockStack>
  );
}
