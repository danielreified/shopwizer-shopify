import { Badge, BlockStack, Button, Divider, Icon, InlineStack, Text, Thumbnail } from "@shopify/polaris";
import { EditIcon } from "@shopify/polaris-icons";
import { Card, Chip } from "@repo/ui";
import { BASKETS } from "../../../lib/merchandising";
import MerchandisingModal from "../../../components/MerchandisingModal.app";
import type { Variant } from "../../../components/products";
import { Image as LucideImageIcon, Zap as LucideZap } from "lucide-react";

const ImageIcon = LucideImageIcon as any;
const Zap = LucideZap as any;

interface MerchandisingTarget {
  id: string;
  title: string;
  basket: string;
}

interface ProductDetailsPaneProps {
  product: any;
  variants: Variant[];
  shopifyProductUrl: string;
  shopifyCategoryUrl: string;
  merchandisingTarget: MerchandisingTarget | null;
  onMerchandisingTargetChange: (next: MerchandisingTarget | null) => void;
  onSelectBasket: (basket: string, targetId: string) => void;
}

export function ProductDetailsPane({
  product,
  variants,
  shopifyProductUrl,
  shopifyCategoryUrl,
  merchandisingTarget,
  onMerchandisingTargetChange,
  onSelectBasket,
}: ProductDetailsPaneProps) {
  const currentBasket = !product.enabled
    ? "exclude"
    : product.merchandisingBasket || "none";

  const config = BASKETS.find((b: any) => b.key === currentBasket) || BASKETS[0];

  return (
    <BlockStack gap="600">
      <BlockStack gap="100">
        <Text variant="headingLg" as="h2" fontWeight="bold">
          {product.title.toUpperCase()}
        </Text>
        <Text variant="bodySm" tone="subdued" as="p">
          ID: {product.id}
        </Text>
      </BlockStack>

      <Divider />

      <BlockStack gap="400">
        <InlineStack align="space-between" blockAlign="center">
          <Text variant="headingMd" as="h3">
            Merchandising
          </Text>
        </InlineStack>

        <BlockStack gap="300">
          <div
            onClick={() =>
              onMerchandisingTargetChange({
                id: product.id,
                title: product.title,
                basket: currentBasket,
              })
            }
            style={{
              padding: "12px",
              backgroundColor: "var(--p-color-bg-surface-secondary)",
              borderRadius: "8px",
              border: "1px solid var(--p-color-border-subdued)",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor =
                "var(--p-color-bg-surface-selected)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor =
                "var(--p-color-bg-surface-secondary)")
            }
          >
            <InlineStack gap="200" blockAlign="center" align="start">
              <div style={{ flex: 1, display: "flex", gap: 4 }}>
                <Badge tone={config.badgeTone as any}>{config.multiplier}</Badge>
                <Text variant="bodyMd" fontWeight="semibold" as="span">
                  {config.label}
                </Text>
              </div>
              <div style={{ display: "flex", marginLeft: 12 }}>
                <Icon source={EditIcon} tone="subdued" />
              </div>
            </InlineStack>
          </div>

          <Text variant="bodyXs" tone="subdued" as="p">
            Adjust how often this product appears in recommendations.
          </Text>

          <MerchandisingModal
            open={merchandisingTarget !== null}
            onClose={() => onMerchandisingTargetChange(null)}
            productTitle={merchandisingTarget?.title || ""}
            activeBasket={merchandisingTarget?.basket as any}
            onSelect={(basket) => {
              if (!merchandisingTarget) return;
              onSelectBasket(basket, merchandisingTarget.id);
              onMerchandisingTargetChange(null);
            }}
          />
        </BlockStack>
      </BlockStack>

      <Divider />

      <BlockStack gap="400">
        <InlineStack align="space-between" blockAlign="center">
          <Text variant="headingMd" as="h3">
            Media
          </Text>
          <ImageIcon size={20} color="var(--p-color-icon-subdued)" />
        </InlineStack>
        <div
          style={{
            borderRadius: "8px",
            overflow: "hidden",
            border: "1px solid #dfe3e8",
            display: "flex",
            justifyContent: "center",
            backgroundColor: "#f6f6f7",
            padding: "12px",
          }}
        >
          <Thumbnail source={product.images[0]?.url || ""} size="large" alt={product.title} />
        </div>
      </BlockStack>

      <Divider />

      <BlockStack gap="400">
        <InlineStack align="space-between" blockAlign="center">
          <Text variant="headingMd" as="h3">
            Category
          </Text>
        </InlineStack>
        <div
          onClick={() => window.open(shopifyCategoryUrl, "_blank")}
          style={{
            padding: "12px",
            backgroundColor: "var(--p-color-bg-surface-secondary)",
            borderRadius: "8px",
            border: "1px solid var(--p-color-border-subdued)",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          <InlineStack align="space-between" blockAlign="center">
            <BlockStack gap="100">
              <Text variant="bodyMd" fontWeight="bold" as="p">
                {product.category?.name}
              </Text>
              <Text variant="bodySm" tone="subdued" as="p">
                in {product.category?.topLevel}
              </Text>
            </BlockStack>
          </InlineStack>
        </div>
        <InlineStack gap="100" blockAlign="center">
          <Zap size={16} color="var(--p-color-icon-caution)" />
          <Text variant="bodyXs" tone="subdued" as="p">
            {product.categorySource === "AUTO"
              ? "Auto-generated category"
              : "Matched from product type"}
          </Text>
        </InlineStack>
      </BlockStack>

      <Divider />

      <BlockStack gap="400">
        {product.category?.hasColor && (
          <Card
            title="Color"
            rightSlot={
              <Button variant="plain" url={shopifyProductUrl} external>
                Manage
              </Button>
            }
          >
            <BlockStack gap="300">
              {variants.length === 0 ? (
                <Text variant="bodyXs" tone="subdued" as="p">
                  This category supports colors, but no matching color variants were found
                  for this product.
                </Text>
              ) : (
                <InlineStack gap="100" wrap>
                  {variants.map((v) => (
                    <Chip
                      key={v.id}
                      slot={
                        <span
                          className="h-2 w-2 rounded"
                          style={{ backgroundColor: v.hex || "transparent" }}
                        />
                      }
                    >
                      {v.title}
                    </Chip>
                  ))}
                </InlineStack>
              )}
            </BlockStack>
          </Card>
        )}

        {(product.category?.hasAgeGroup || product.category?.hasTargetGender) && (
          <Card
            title="Attributes"
            rightSlot={
              <Button variant="plain" url={shopifyProductUrl} external>
                Manage
              </Button>
            }
          >
            <BlockStack gap="300">
              {product.category?.hasTargetGender && (
                <BlockStack gap="100">
                  <Text variant="bodyMd" fontWeight="semibold" tone="subdued" as="p">
                    Gender
                  </Text>
                  <InlineStack gap="100" wrap>
                    {product.gender.map((x: string) => (
                      <Chip key={x}>
                        <span className="capitalize">{x.toLowerCase()}</span>
                      </Chip>
                    ))}
                  </InlineStack>
                </BlockStack>
              )}
              {product.category?.hasAgeGroup && (
                <BlockStack gap="100">
                  <Text variant="bodyMd" fontWeight="semibold" tone="subdued" as="p">
                    Age Group
                  </Text>
                  <InlineStack gap="100" wrap>
                    {product.ageBucket.map((x: string) => (
                      <Chip key={x}>
                        <span className="capitalize">{x.toLowerCase()}</span>
                      </Chip>
                    ))}
                  </InlineStack>
                </BlockStack>
              )}
            </BlockStack>
          </Card>
        )}
      </BlockStack>
    </BlockStack>
  );
}
