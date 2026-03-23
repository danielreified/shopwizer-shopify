import { BlockStack, Box, Button, Card, Icon, Text } from "@shopify/polaris";
import { PlusIcon } from "@shopify/polaris-icons";
import { ProductCard } from "@repo/ui";
import type { BasketKey } from "../../../lib/merchandising";

interface Product {
  id: string;
  title: string;
  handle: string;
  imageUrl: string;
  price: string;
  vendor: string;
}

interface BasketContentProps {
  activeBasket: BasketKey;
  activeLabel: string;
  products: Product[];
  onAddProducts: () => void;
  onMoveProduct: (product: Product) => void;
  onRemoveProduct: (productId: string) => void;
  badgeTone: string;
}

function getEmptyMessage(activeBasket: BasketKey) {
  if (activeBasket === "exclude") return "hide them from";
  if (activeBasket === "sink" || activeBasket === "bury" || activeBasket === "anchor") {
    return "demote them in";
  }
  return "boost them in";
}

export function BasketContent({
  activeBasket,
  activeLabel,
  products,
  onAddProducts,
  onMoveProduct,
  onRemoveProduct,
  badgeTone,
}: BasketContentProps) {
  if (products.length === 0) {
    return (
      <Card>
        <Box padding="800">
          <BlockStack gap="400" align="center">
            <Text variant="headingLg" as="h3" alignment="center">
              📦 No products here
            </Text>
            <Text variant="bodyMd" as="p" alignment="center" tone="subdued">
              Add products to {getEmptyMessage(activeBasket)} recommendations.
            </Text>
            <Button variant="primary" onClick={onAddProducts}>
              Add Products
            </Button>
          </BlockStack>
        </Box>
      </Card>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        gap: "16px",
      }}
    >
      {products.map((product) => (
        <ProductCard
          key={product.id}
          id={product.id}
          title={product.title}
          imageUrl={product.imageUrl}
          vendor={product.vendor}
          price={product.price}
          badge={{
            label: activeLabel,
            tone: badgeTone as any,
            onClick: () => onMoveProduct(product),
          }}
          onRemove={() => onRemoveProduct(product.id)}
        />
      ))}

      <div
        onClick={onAddProducts}
        style={{
          border: "2px dashed var(--p-color-border-secondary)",
          borderRadius: "var(--p-border-radius-200)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          minHeight: "280px",
          background: "var(--p-color-bg-surface)",
          transition: "all 0.2s ease",
          gap: "12px",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "var(--p-color-border-info)";
          e.currentTarget.style.background = "var(--p-color-bg-surface-secondary)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--p-color-border-secondary)";
          e.currentTarget.style.background = "var(--p-color-bg-surface)";
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            background: "var(--p-color-bg-fill-info-secondary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--p-color-icon-info)",
          }}
        >
          <Icon source={PlusIcon} />
        </div>
        <BlockStack gap="050" align="center">
          <Text variant="bodySm" as="p" fontWeight="bold">
            Add Product
          </Text>
          <Text variant="bodyXs" as="p" tone="subdued">
            to {activeLabel} basket
          </Text>
        </BlockStack>
      </div>
    </div>
  );
}
