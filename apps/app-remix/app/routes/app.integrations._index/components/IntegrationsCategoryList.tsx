import { Badge, BlockStack, InlineStack, Text } from "@shopify/polaris";

interface CategoryInfo {
  id: string;
  label: string;
  description: string;
}

interface IntegrationsCategoryListProps {
  categories: CategoryInfo[];
  selectedCategory: string;
  counts: Record<string, number>;
  onSelect: (id: string) => void;
}

export function IntegrationsCategoryList({
  categories,
  selectedCategory,
  counts,
  onSelect,
}: IntegrationsCategoryListProps) {
  return (
    <BlockStack gap="200">
      {categories.map((category) => {
        const count = counts[category.id] ?? 0;
        const isActive = selectedCategory === category.id;
        return (
          <div
            key={category.id}
            onClick={() => onSelect(category.id)}
            style={{
              padding: "12px",
              borderRadius: "8px",
              cursor: "pointer",
              backgroundColor: isActive ? "#edeef0" : "transparent",
              transition: "background-color 0.2s",
            }}
          >
            <InlineStack gap="300" blockAlign="center">
              <BlockStack gap="050">
                <InlineStack gap="200" blockAlign="center">
                  <Text as="span" variant="bodySm" fontWeight={isActive ? "bold" : "regular"}>
                    {category.label}
                  </Text>
                  {count > 0 && (
                    <Badge tone="success" size="small">
                      {count} active
                    </Badge>
                  )}
                </InlineStack>
                <Text as="span" variant="bodyXs" tone="subdued">
                  {category.description}
                </Text>
              </BlockStack>
            </InlineStack>
          </div>
        );
      })}
    </BlockStack>
  );
}
