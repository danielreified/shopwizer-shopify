import { Badge, BlockStack, Box, Button, Card, Divider, InlineStack, Text } from "@shopify/polaris";
import { ThreePaneLayout } from "@repo/ui/components/ThreePaneLayout";

interface PlanSummaryPaneProps {
  plan: {
    name?: string;
    price?: number;
    isFree?: boolean;
  } | null;
  onContactSupport: () => void;
}

export function PlanSummaryPane({ plan, onContactSupport }: PlanSummaryPaneProps) {
  const isFree = plan?.isFree ?? true;
  const planName = plan?.name || "Free Plan";
  const price = plan?.price ?? 0;

  return (
    <BlockStack gap="500">
      <BlockStack gap="200">
        <ThreePaneLayout.SectionHeader>Current Plan</ThreePaneLayout.SectionHeader>
        <Card padding="400">
          <BlockStack gap="300">
            <InlineStack align="space-between" blockAlign="center">
              <Text as="p" variant="bodyMd" fontWeight="bold">
                {planName}
              </Text>
              <Badge tone={isFree ? "info" : "success"}>{isFree ? "Active" : "Paid"}</Badge>
            </InlineStack>
            <Text as="p" variant="bodySm" tone="subdued">
              {isFree
                ? "You are on the free tier with basic features."
                : `Your next charge of $${price} will be on your next Shopify invoice.`}
            </Text>
          </BlockStack>
        </Card>
      </BlockStack>

      <BlockStack gap="200">
        <ThreePaneLayout.SectionHeader>Why Upgrade?</ThreePaneLayout.SectionHeader>
        <Card padding="400">
          <BlockStack gap="300">
            <InlineStack gap="200" blockAlign="start">
              <Text as="span">🚀</Text>
              <BlockStack gap="100">
                <Text as="p" variant="bodySm" fontWeight="bold">
                  Unlock AI features
                </Text>
                <Text as="p" variant="bodyXs" tone="subdued">
                  Get access to premium recommendation models.
                </Text>
              </BlockStack>
            </InlineStack>
            <Divider />
            <InlineStack gap="200" blockAlign="start">
              <Text as="span">📊</Text>
              <BlockStack gap="100">
                <Text as="p" variant="bodySm" fontWeight="bold">
                  Advanced Analytics
                </Text>
                <Text as="p" variant="bodyXs" tone="subdued">
                  Deep dive into your sales and basket data.
                </Text>
              </BlockStack>
            </InlineStack>
          </BlockStack>
        </Card>
      </BlockStack>

      <BlockStack gap="200">
        <ThreePaneLayout.SectionHeader>Need Help?</ThreePaneLayout.SectionHeader>
        <Box padding="400" background="bg-fill-secondary" borderRadius="300">
          <BlockStack gap="200">
            <Text as="p" variant="bodySm">
              Have questions about billing or need a custom enterprise plan?
            </Text>
            <Button variant="plain" onClick={onContactSupport}>
              Contact Support
            </Button>
          </BlockStack>
        </Box>
      </BlockStack>
    </BlockStack>
  );
}
