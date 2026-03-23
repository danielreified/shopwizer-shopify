import { Badge, BlockStack, Box, Card, InlineStack, Select, Text } from "@shopify/polaris";

type ThemeRole = "MAIN" | "UNPUBLISHED" | "DEMO" | "DEVELOPMENT";

interface ShopifyTheme {
  id: string;
  name: string;
  role: ThemeRole;
}

interface EditorThemeSidebarProps {
  themes: ShopifyTheme[];
  selectedThemeId: string;
  onSelectTheme: (id: string) => void;
}

export function EditorThemeSidebar({
  themes,
  selectedThemeId,
  onSelectTheme,
}: EditorThemeSidebarProps) {
  const selectedTheme = themes.find((theme) => theme.id === selectedThemeId);

  return (
    <Box background="bg-surface" borderInlineStartWidth="025" borderColor="border" padding="400">
      <div style={{ width: "280px" }}>
        <BlockStack gap="500">
          <BlockStack gap="200">
            <Text as="h3" variant="headingSm" tone="subdued">
              EDITING THEME
            </Text>
            <Card padding="300">
              <BlockStack gap="300">
                <Select
                  label="Select Theme"
                  labelHidden
                  options={themes.map((theme) => ({ label: theme.name, value: theme.id }))}
                  onChange={onSelectTheme}
                  value={selectedThemeId}
                />
                <InlineStack gap="100">
                  {selectedTheme?.role === "MAIN" && <Badge tone="success">Live</Badge>}
                  {selectedTheme?.role === "UNPUBLISHED" && <Badge tone="attention">Draft</Badge>}
                  {selectedTheme?.role === "DEVELOPMENT" && <Badge tone="info">Dev</Badge>}
                  {selectedTheme?.role === "DEMO" && <Badge tone="info">Demo</Badge>}
                  <Badge tone="magic">Editing</Badge>
                </InlineStack>
              </BlockStack>
            </Card>
          </BlockStack>

          <BlockStack gap="200">
            <Text as="h3" variant="headingSm" tone="subdued">
              QUICK TIPS
            </Text>
            <Card padding="300">
              <BlockStack gap="200">
                <Text as="p" variant="bodySm">
                  💡 Use <code>!important</code> if your styles aren't applying.
                </Text>
                <Text as="p" variant="bodySm">
                  💡 Preview changes by clicking <strong>Preview Store</strong> after saving.
                </Text>
              </BlockStack>
            </Card>
          </BlockStack>

          <BlockStack gap="200">
            <Text as="h3" variant="headingSm" tone="subdued">
              HELPFUL CLASSES
            </Text>
            <Box padding="200" background="bg-fill-secondary" borderRadius="200">
              <BlockStack gap="100">
                <Text as="p" variant="bodySm">
                  <code>.sw-card</code> - Main product card
                </Text>
                <Text as="p" variant="bodySm">
                  <code>.sw-price</code> - Price display
                </Text>
                <Text as="p" variant="bodySm">
                  <code>.sw-heading</code> - Widget title
                </Text>
                <Text as="p" variant="bodySm">
                  <code>.sw-bundle__item</code> - Bundle items
                </Text>
                <Text as="p" variant="bodySm">
                  <code>.sw-modal</code> - Quick view modal
                </Text>
              </BlockStack>
            </Box>
          </BlockStack>
        </BlockStack>
      </div>
    </Box>
  );
}
