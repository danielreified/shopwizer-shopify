import { BlockStack, Text } from "@shopify/polaris";

interface PlansSectionHeaderProps {
  title: string;
  description: string;
}

export function PlansSectionHeader({ title, description }: PlansSectionHeaderProps) {
  return (
    <BlockStack gap="100">
      <Text as="h1" variant="headingLg">
        {title}
      </Text>
      <Text as="p" variant="bodyMd" tone="subdued">
        {description}
      </Text>
    </BlockStack>
  );
}
