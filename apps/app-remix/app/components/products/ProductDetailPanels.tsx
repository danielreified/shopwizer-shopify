import {
  Text as PolarisText,
  BlockStack as PolarisBlockStack,
  InlineStack as PolarisInlineStack,
  Button as PolarisButton,
  Badge as PolarisBadge,
  Card as PolarisCardComponent,
  Icon,
  Thumbnail,
  Divider as PolarisDivider,
  Box as PolarisBox,
} from "@shopify/polaris";
import { PlusIcon, EditIcon } from "@shopify/polaris-icons";
import {
  Zap as LucideZap,
  Sparkles as LucideSparkles,
  Boxes as LucideBoxes,
  Image as LucideImageIcon,
  RefreshCw as LucideRefreshCw,
} from "lucide-react";

import { asLucideIcon, asPolarisIcon } from "../icon";
import { BASKETS } from "../../lib/merchandising";
import type { ProductDetailDTO } from "../../lib/products.server";
import { ProductRecommendationRails } from "./ProductRecommendationRails";
import type { Variant } from "./types";
import { SidebarGroup, SidebarItem } from "../SidebarMenu";
import { CollapsibleCard, Chip } from "@repo/ui";

const Box = PolarisBox as any;
const InlineStack = PolarisInlineStack as any;
const BlockStack = PolarisBlockStack as any;
const Text = PolarisText as any;
const Divider = PolarisDivider as any;
const Button = PolarisButton as any;
const Badge = PolarisBadge as any;
const PolarisCard = PolarisCardComponent as any;

const Zap = asLucideIcon(LucideZap);
const Sparkles = asLucideIcon(LucideSparkles);
const Boxes = asLucideIcon(LucideBoxes);
const ImageIcon = asLucideIcon(LucideImageIcon);
const RefreshCw = asLucideIcon(LucideRefreshCw);

export const ProductHeaderActions = ({
  shopifyProductUrl,
  isEnabled,
  onToggleEnabled,
  isToggling,
}: {
  shopifyProductUrl: string;
  isEnabled: boolean;
  onToggleEnabled: () => void;
  isToggling: boolean;
}) => (
  <InlineStack gap="200">
    <Button url={shopifyProductUrl} external>
      Edit in Shopify
    </Button>
    <Button variant="primary" onClick={onToggleEnabled} loading={isToggling}>
      {isEnabled ? "Disable Product" : "Enable Product"}
    </Button>
  </InlineStack>
);

const scrollTo = (id: string) => {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
};

export const LeftSidebarNav = ({ bundles }: { bundles: any[] }) => (
  <BlockStack gap="200">
    <SidebarGroup title="Bundles" variant="subdued" uppercase>
      {bundles?.length > 0 ? (
        bundles.map((bundle: any) => (
          <SidebarItem
            key={bundle.id}
            label={bundle.variant.replace("_", " ").toUpperCase()}
            onClick={() => scrollTo("bundles-section")}
          />
        ))
      ) : (
        <SidebarItem
          label="Generate Now"
          icon={RefreshCw}
          onClick={() => scrollTo("bundles-section")}
        />
      )}
    </SidebarGroup>

    <SidebarGroup title="Recommendations" variant="subdued" uppercase>
      <SidebarItem
        label="Similar Products"
        description="Visual matches"
        onClick={() => scrollTo("similar")}
      />
      <SidebarItem
        label="Matching Color"
        description="Same palette items"
        onClick={() => scrollTo("matching-color")}
      />
      <SidebarItem
        label="Sellers"
        description="Top performing pairs"
        onClick={() => scrollTo("sellers")}
      />
      <SidebarItem
        label="Trending"
        description="Viral shopper picks"
        onClick={() => scrollTo("trending")}
      />
      <SidebarItem
        label="New Arrivals"
        description="Freshest catalog additions"
        onClick={() => scrollTo("new-arrivals")}
      />
    </SidebarGroup>
  </BlockStack>
);

export const RightSidebarDetail = ({
  product,
  isEnabled,
  variants,
  shopifyProductUrl,
  shopifyCategoryUrl,
  onOpenMerchandisingModal,
}: {
  product: ProductDetailDTO;
  isEnabled: boolean;
  variants: Variant[];
  shopifyProductUrl: string;
  shopifyCategoryUrl: string;
  onOpenMerchandisingModal: (target: any) => void;
}) => {
  const currentBasket = !isEnabled ? "exclude" : product.merchandisingBasket || "none";
  const basketConfig = BASKETS.find((b: any) => b.key === currentBasket) || BASKETS[0];

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
              onOpenMerchandisingModal({
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
              (e.currentTarget.style.backgroundColor = "var(--p-color-bg-surface-selected)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "var(--p-color-bg-surface-secondary)")
            }
          >
            <InlineStack gap="200" blockAlign="center" align="start">
              <div style={{ flex: 1, display: "flex", gap: 4 }}>
                <Badge tone={basketConfig.badgeTone as any}>{basketConfig.multiplier}</Badge>
                <Text variant="bodyMd" fontWeight="semibold" as="span">
                  {basketConfig.label}
                </Text>
              </div>
              <div style={{ display: "flex", marginLeft: 12 }}>
                <Icon source={asPolarisIcon(EditIcon)} tone="subdued" />
              </div>
            </InlineStack>
          </div>

          <Text variant="bodyXs" tone="subdued" as="p">
            Adjust how often this product appears in recommendations.
          </Text>
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
          <PolarisCard
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
                  This category supports colors, but no matching color variants were found for this
                  product.
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
          </PolarisCard>
        )}

        {(product.category?.hasAgeGroup || product.category?.hasTargetGender) && (
          <PolarisCard
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
                    {product.gender.map((x) => (
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
                    {product.ageBucket.map((x) => (
                      <Chip key={x}>
                        <span className="capitalize">{x.toLowerCase()}</span>
                      </Chip>
                    ))}
                  </InlineStack>
                </BlockStack>
              )}
            </BlockStack>
          </PolarisCard>
        )}
      </BlockStack>
    </BlockStack>
  );
};

export const BundlesSection = ({
  bundles,
  product,
  onGenerateBundles,
  isGenerating,
}: {
  bundles: any[];
  product: ProductDetailDTO;
  onGenerateBundles: () => void;
  isGenerating: boolean;
}) => (
  <BlockStack gap="400">
    <InlineStack gap="200" blockAlign="center">
      <Boxes size={24} color="var(--p-color-icon-info)" />
      <Text variant="headingMd" as="h3">
        Bundles
      </Text>
    </InlineStack>
    <div id="bundles-section">
      <BlockStack gap="400">
        {bundles?.length === 0 ? (
          <CollapsibleCard
            id="no-bundles"
            title="Computed Bundles"
            icon={Boxes}
            description="No bundles have been computed for this product yet."
          >
            <BlockStack gap="400" align="center">
              <Text variant="bodyMd" tone="subdued" alignment="center" as="p">
                Click below to trigger the bundle worker for this shop.
              </Text>
              <Button variant="primary" onClick={onGenerateBundles} loading={isGenerating}>
                Generate Now
              </Button>
            </BlockStack>
          </CollapsibleCard>
        ) : (
          bundles.map((bundle: any) => (
            <CollapsibleCard
              key={bundle.id}
              id={`bundle-${bundle.id}`}
              title={`${bundle.variant.replace("_", " ").toUpperCase()}`}
              icon={Boxes}
              storageKey={`bundle-collapse-${bundle.id}`}
            >
              <InlineStack align="space-between" blockAlign="center">
                <InlineStack gap="300" align="center">
                  <div
                    style={{
                      border: "1px solid var(--p-color-border-subdued)",
                      borderRadius: "12px",
                      opacity: 0.6,
                      padding: "6px",
                      backgroundColor: "var(--p-color-bg-surface-secondary)",
                    }}
                  >
                    <Thumbnail source={product.images[0]?.url || ""} size="large" alt="Base" />
                  </div>
                  <div style={{ color: "var(--p-color-icon-subdued)" }}>
                    <Icon source={asPolarisIcon(PlusIcon)} />
                  </div>
                  <InlineStack gap="200">
                    {bundle.products.map((p: any) => (
                      <div
                        key={p.id}
                        style={{
                          border: "2px solid var(--p-color-border-info-subdued)",
                          borderRadius: "8px",
                          overflow: "hidden",
                          backgroundColor: "white",
                          boxShadow: "var(--p-shadow-100)",
                        }}
                      >
                        <Thumbnail source={p.imageUrl || ""} size="large" alt={p.title} />
                      </div>
                    ))}
                  </InlineStack>
                </InlineStack>

                <Box padding="400" background="bg-surface-secondary" borderRadius="200">
                  <InlineStack gap="600" blockAlign="center">
                    <BundleStat label="IMPRESSIONS" value={bundle.views} />
                    <BundleStat label="CLICKS" value={bundle.clicks} />
                    <BundleStat
                      label="CTR"
                      value={bundle.views > 0 ? ((bundle.clicks / bundle.views) * 100).toFixed(1) : "0"}
                      suffix="%"
                    />
                    {bundle.revenue > 0 && (
                      <BundleStat
                        label="REVENUE"
                        value={bundle.revenue}
                        isCurrency
                        tone="success"
                      />
                    )}
                  </InlineStack>
                </Box>
              </InlineStack>
            </CollapsibleCard>
          ))
        )}
      </BlockStack>
    </div>
  </BlockStack>
);

const BundleStat = ({
  label,
  value,
  suffix = "",
  isCurrency = false,
  tone,
}: {
  label: string;
  value: number | string;
  suffix?: string;
  isCurrency?: boolean;
  tone?: "success";
}) => (
  <BlockStack gap="050" align="center">
    <Text variant="headingMd" as="p" tone={tone}>
      {isCurrency
        ? `$${Number(value).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`
        : typeof value === "number"
          ? value.toLocaleString()
          : value}
      {suffix}
    </Text>
    <Text variant="bodyXs" tone="subdued" as="p" fontWeight="medium">
      {label}
    </Text>
  </BlockStack>
);

export const RecommendationsSection = ({
  similarProducts,
  colorProducts,
  sellersProducts,
  trendingProducts,
  arrivalsProducts,
  onProductClick,
  onMerchandise,
}: {
  similarProducts: any[];
  colorProducts: any[];
  sellersProducts: any[];
  trendingProducts: any[];
  arrivalsProducts: any[];
  onProductClick: (id: string | number) => void;
  onMerchandise: (target: any) => void;
}) => (
  <BlockStack gap="400" id="recommendations-section">
    <InlineStack gap="200" blockAlign="center">
      <Sparkles size={24} color="var(--p-color-icon-info)" />
      <Text variant="headingMd" as="h3">
        Recommendations
      </Text>
    </InlineStack>
    <ProductRecommendationRails
      similarProducts={similarProducts}
      colorProducts={colorProducts}
      sellersProducts={sellersProducts}
      trendingProducts={trendingProducts}
      arrivalsProducts={arrivalsProducts}
      onProductClick={(id: any) => onProductClick(id)}
      onMerchandise={onMerchandise}
    />
  </BlockStack>
);
