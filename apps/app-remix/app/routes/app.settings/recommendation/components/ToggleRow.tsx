import { BlockStack, Box, InlineStack, Text } from "@shopify/polaris";
import { Switch } from "@repo/ui/components/Switch";

interface ToggleRowProps {
  title: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}

export function ToggleRow({ title, description, checked, onChange }: ToggleRowProps) {
  return (
    <Box width="100%" paddingBlock="300">
      <InlineStack align="space-between" blockAlign="center" gap="400">
        <Box minWidth="0">
          <BlockStack gap="100">
            <Text as="h3" variant="bodyMd" fontWeight="semibold">
              {title}
            </Text>
            <Text variant="bodySm" tone="subdued" truncate title={description}>
              {description}
            </Text>
          </BlockStack>
        </Box>

        <Switch label={title} checked={checked} onChange={onChange} />
      </InlineStack>
    </Box>
  );
}
