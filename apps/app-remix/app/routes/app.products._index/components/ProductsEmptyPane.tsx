import { BlockStack, Box, Text } from "@shopify/polaris";

export function ProductsEmptyPane() {
  return (
    <Box padding="600">
      <BlockStack gap="200" align="center">
        <Text variant="headingMd" as="h3" alignment="center">
          Product Details
        </Text>
        <Text variant="bodySm" tone="subdued" alignment="center" as="p">
          Select a product from the list to view its AI enrichment, recommendations,
          and bundles configuration.
        </Text>
      </BlockStack>
    </Box>
  );
}
