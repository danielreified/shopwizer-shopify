import { Badge, Box, Button, InlineStack, Text } from "@shopify/polaris";

interface EditorTopBarProps {
  onExit: () => void;
  onPreview: () => void;
  onSave: () => void;
  saveDisabled: boolean;
}

export function EditorTopBar({ onExit, onPreview, onSave, saveDisabled }: EditorTopBarProps) {
  return (
    <Box padding="400" background="bg-surface" borderBlockEndWidth="025" borderColor="border">
      <InlineStack align="space-between" blockAlign="center">
        <InlineStack gap="300" blockAlign="center">
          <Button variant="tertiary" onClick={onExit}>
            ← Exit Editor
          </Button>
          <Text as="p" variant="bodyMd" fontWeight="semibold">
            Developer CSS Editor
          </Text>
          <Badge tone="info">Advanced</Badge>
        </InlineStack>
        <InlineStack gap="200">
          <Button onClick={onPreview}>Preview Store</Button>
          <Button variant="primary" onClick={onSave} disabled={saveDisabled}>
            Save Changes
          </Button>
        </InlineStack>
      </InlineStack>
    </Box>
  );
}
