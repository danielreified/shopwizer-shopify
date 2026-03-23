import { BlockStack, Text } from "@shopify/polaris";

type Category = "wishlist" | "reviews";

interface IntegrationsIntroProps {
  category: Category;
}

export function IntegrationsIntro({ category }: IntegrationsIntroProps) {
  const title = category === "wishlist" ? "Wishlist Apps" : "Review Apps";
  const description =
    category === "wishlist"
      ? "Connect your wishlist app to display wishlist buttons on product cards."
      : "Connect your reviews app to display star ratings on product cards.";

  return (
    <BlockStack gap="200">
      <Text variant="headingLg" as="h1">
        {title}
      </Text>
      <Text variant="bodyMd" as="p" tone="subdued">
        {description}
      </Text>
    </BlockStack>
  );
}
