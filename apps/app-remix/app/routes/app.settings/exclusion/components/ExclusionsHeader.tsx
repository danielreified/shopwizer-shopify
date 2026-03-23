import { BlockStack, Text } from "@shopify/polaris";

export function ExclusionsHeader() {
  return (
    <BlockStack gap="200">
      <Text variant="headingLg" as="h1">
        Exclusions
      </Text>
      <Text variant="bodyMd" as="p" tone="subdued">
        Define rules to prevent specific products, categories, or tags from appearing in recommendations.
      </Text>
    </BlockStack>
  );
}
