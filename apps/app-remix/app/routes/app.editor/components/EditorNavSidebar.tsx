import { BlockStack, Box, Text } from "@shopify/polaris";

interface NavItem {
  key: string;
  label: string;
  description: string;
  group: string;
}

interface EditorNavSidebarProps {
  navItems: NavItem[];
  activeKey: string;
  onSelect: (key: string) => void;
}

export function EditorNavSidebar({ navItems, activeKey, onSelect }: EditorNavSidebarProps) {
  const groups = Array.from(new Set(navItems.map((item) => item.group)));

  return (
    <Box background="bg-surface" borderInlineEndWidth="025" borderColor="border" padding="400">
      <div style={{ width: "260px", height: "100%", overflowY: "auto" }}>
        <BlockStack gap="400">
          {groups.map((group) => {
            const groupItems = navItems.filter((item) => item.group === group);
            if (groupItems.length === 0) return null;
            return (
              <BlockStack gap="100" key={group}>
                <Text as="h3" variant="headingXs" tone="subdued">
                  {group.toUpperCase()}
                </Text>
                {groupItems.map((item) => (
                  <div
                    key={item.key}
                    onClick={() => onSelect(item.key)}
                    style={{
                      padding: "10px 12px",
                      borderRadius: "8px",
                      cursor: "pointer",
                      backgroundColor: activeKey === item.key ? "#edeef0" : "transparent",
                      transition: "background-color 0.2s",
                    }}
                  >
                    <BlockStack gap="025">
                      <Text
                        as="span"
                        variant="bodySm"
                        fontWeight={activeKey === item.key ? "bold" : "regular"}
                      >
                        {item.label}
                      </Text>
                      <Text as="span" variant="bodyXs" tone="subdued">
                        {item.description}
                      </Text>
                    </BlockStack>
                  </div>
                ))}
              </BlockStack>
            );
          })}
        </BlockStack>
      </div>
    </Box>
  );
}
