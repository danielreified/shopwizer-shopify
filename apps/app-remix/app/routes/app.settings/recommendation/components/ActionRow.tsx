import { Badge, BlockStack, Box, Button, InlineStack, Text } from "@shopify/polaris";

interface ActionRowProps {
  label: string;
  description: string;
  actionText: string;
  onAction?: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: any;
  status?: { label: string; tone: "success" | "attention" | "info" | "critical" | "subdued" };
}

export function ActionRow({
  label,
  description,
  actionText,
  onAction,
  disabled,
  loading,
  icon: IconComponent,
  status,
}: ActionRowProps) {
  return (
    <Box padding="400">
      <InlineStack align="space-between" blockAlign="center" gap="400">
        <InlineStack gap="400" blockAlign="center">
          {IconComponent && (
            <div
              style={{
                width: "40px",
                height: "40px",
                backgroundColor: "#f6f6f7",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid #e1e3e5",
              }}
            >
              <IconComponent size={20} color="#616161" />
            </div>
          )}
          <BlockStack gap="050">
            <InlineStack gap="150" blockAlign="center" align="start">
              <Text as="span" variant="bodyMd" fontWeight="bold">
                {label}
              </Text>
              {status && (
                <Badge tone={status.tone as any} size="small">
                  {status.label}
                </Badge>
              )}
            </InlineStack>
            <Text as="span" variant="bodySm" tone="subdued">
              {description}
            </Text>
          </BlockStack>
        </InlineStack>
        <Button variant="secondary" onClick={onAction} disabled={disabled} loading={loading}>
          {actionText}
        </Button>
      </InlineStack>
    </Box>
  );
}
