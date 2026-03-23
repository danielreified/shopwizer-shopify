import { BlockStack, Card, Divider, InlineStack, Text } from "@shopify/polaris";
import { HelpCircle } from "lucide-react";

const HelpCircleIcon = HelpCircle as any;

export function RecommendationTipsPane() {
  return (
    <BlockStack gap="400">
      <Card>
        <BlockStack gap="300">
          <InlineStack gap="200" blockAlign="center">
            <div style={{ display: "flex" }}>
              <HelpCircleIcon size={18} />
            </div>
            <Text variant="bodyMd" fontWeight="bold">
              Did you know?
            </Text>
          </InlineStack>
          <Divider />
          <BlockStack gap="200">
            <Text variant="bodySm" fontWeight="bold">
              Caching Performance
            </Text>
            <Text variant="bodySm" tone="subdued">
              Clearing the cache ensures that any recent logic or attribute changes are reflected
              immediately on your storefront. We recommend clearing it after significant catalog
              updates.
            </Text>
          </BlockStack>
          <BlockStack gap="200">
            <Text variant="bodySm" fontWeight="bold">
              Catalog Accuracy
            </Text>
            <Text variant="bodySm" tone="subdued">
              A full resync re-builds our understanding of your inventory. This is useful if you've
              done a large bulk edit of your product data in Shopify.
            </Text>
          </BlockStack>
          <BlockStack gap="200">
            <Text variant="bodySm" fontWeight="bold">
              Product Bundles
            </Text>
            <Text variant="bodySm" tone="subdued">
              Bundles use historical order data to suggest items that are frequently bought together,
              increasing your Average Order Value (AOV).
            </Text>
          </BlockStack>
        </BlockStack>
      </Card>
    </BlockStack>
  );
}
