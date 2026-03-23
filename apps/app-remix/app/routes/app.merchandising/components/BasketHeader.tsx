import { Badge, Box, Icon, InlineStack, Text } from "@shopify/polaris";
interface BasketHeaderProps {
  label: string;
  multiplier: string;
  badgeTone: string;
  icon: any;
  productCount: number;
}

export function BasketHeader({
  label,
  multiplier,
  badgeTone,
  icon,
  productCount,
}: BasketHeaderProps) {
  return (
    <InlineStack align="space-between" blockAlign="center">
      <InlineStack gap="200" blockAlign="center">
        <Box
          background="bg-fill-info-secondary"
          padding="100"
          borderRadius="200"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "24px",
            height: "24px",
          }}
        >
          <Icon source={icon} tone="info" />
        </Box>
        <Text variant="bodyMd" as="p" fontWeight="bold">
          {label} Basket
        </Text>
        <Badge tone={badgeTone as any}>{multiplier}</Badge>
      </InlineStack>
      <Text tone="subdued" variant="bodySm" as="p">
        {productCount} products
      </Text>
    </InlineStack>
  );
}
