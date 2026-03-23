import { BlockStack, Divider, InlineStack, Text } from "@shopify/polaris";
import { Card } from "@shopify/polaris";
import { HelpCircle } from "lucide-react";

const HelpCircleIcon = HelpCircle as any;

export function HelpfulTipsPane() {
  return (
    <BlockStack gap="400">
      <Card>
        <BlockStack gap="300">
          <InlineStack gap="200" blockAlign="center">
            <div style={{ display: "flex" }}>
              <HelpCircleIcon size={18} />
            </div>
            <Text variant="bodyMd" fontWeight="bold">
              Helpful Tips
            </Text>
          </InlineStack>
          <Divider />
          <BlockStack gap="200">
            <Text variant="bodySm" fontWeight="bold">
              Recommendation Profiles
            </Text>
            <Text variant="bodySm" tone="subdued">
              Product profiles help us group products into the right rails. Auto-detection works best
              if your product titles and tags are descriptive.
            </Text>
          </BlockStack>
          <BlockStack gap="200">
            <Text variant="bodySm" fontWeight="bold">
              Notification Alerts
            </Text>
            <Text variant="bodySm" tone="subdued">
              We'll only notify you of critical events like hitting your recommendation limits or
              major catalog changes.
            </Text>
          </BlockStack>
        </BlockStack>
      </Card>
    </BlockStack>
  );
}
