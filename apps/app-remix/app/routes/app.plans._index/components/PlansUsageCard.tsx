import { BlockStack, Box, Card, Divider, InlineStack, Text } from "@shopify/polaris";

export function PlansUsageCard() {
  return (
    <Card>
      <Box padding="500">
        <BlockStack gap="400">
          <InlineStack align="space-between">
            <Text as="p" variant="bodyMd" fontWeight="bold">
              API Requests
            </Text>
            <Text as="p" variant="bodySm">
              4.2k / 10k
            </Text>
          </InlineStack>
          <Box background="bg-fill-secondary" borderRadius="full" height="8px" width="100%">
            <Box background="bg-fill-success" borderRadius="full" height="100%" width="42%" />
          </Box>
          <Divider />
          <InlineStack align="space-between">
            <Text as="p" variant="bodyMd" fontWeight="bold">
              Product Re-indexing
            </Text>
            <Text as="p" variant="bodySm">
              12 / 50
            </Text>
          </InlineStack>
          <Box background="bg-fill-secondary" borderRadius="full" height="8px" width="100%">
            <Box background="bg-fill-success" borderRadius="full" height="100%" width="24%" />
          </Box>
        </BlockStack>
      </Box>
    </Card>
  );
}
