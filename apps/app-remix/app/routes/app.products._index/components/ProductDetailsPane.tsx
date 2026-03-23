import {
  Badge,
  BlockStack,
  Box,
  Button,
  Divider,
  InlineStack,
  Text,
  Thumbnail,
} from "@shopify/polaris";
import { ExternalIcon } from "@shopify/polaris-icons";
import { Sparkles, Image, VenusAndMars, UsersRound } from "lucide-react";

const SparklesIcon = Sparkles as any;
const ImageIcon = Image as any;
const VenusAndMarsIcon = VenusAndMars as any;
const UsersRoundIcon = UsersRound as any;

interface ProductDetailsPaneProps {
  product: any;
  onOpenProduct: (id: string) => void;
}

export function ProductDetailsPane({ product, onOpenProduct }: ProductDetailsPaneProps) {
  return (
    <BlockStack gap="400">
      <BlockStack gap="200">
        <Button
          variant="primary"
          fullWidth
          icon={ExternalIcon as any}
          onClick={() => onOpenProduct(product.id)}
        >
          Open product page
        </Button>
      </BlockStack>

      <Divider />

      <BlockStack gap="100">
        <Text variant="headingLg" as="h2">
          {product.title}
        </Text>
        <Text variant="bodySm" tone="subdued" as="p">
          ID: {product.id}
        </Text>
      </BlockStack>

      <Divider />

      <BlockStack gap="300">
        <InlineStack align="space-between" blockAlign="center">
          <Text variant="headingMd" as="h3">
            Visibility
          </Text>
          <Badge tone={product.enabled ? "success" : "attention"}>
            {product.enabled ? "Visible" : "Hidden"}
          </Badge>
        </InlineStack>
      </BlockStack>

      <Divider />

      <BlockStack gap="200">
        <InlineStack align="space-between" blockAlign="center">
          <Text variant="headingMd" as="h3">
            Media
          </Text>
          <div style={{ color: "var(--p-color-icon-subdued)" }}>
            <ImageIcon size={16} />
          </div>
        </InlineStack>
        <div
          style={{
            borderRadius: "12px",
            overflow: "hidden",
            border: "1px solid var(--p-color-border-subdued)",
            display: "flex",
            justifyContent: "center",
            padding: "24px",
            backgroundColor: "var(--p-color-bg-surface-secondary)",
          }}
        >
          <Thumbnail source={product.thumbnailUrl || ""} size="large" alt={product.title} />
        </div>
      </BlockStack>

      <Divider />

      <BlockStack gap="200">
        <InlineStack align="space-between" blockAlign="center">
          <Text variant="headingMd" as="h3">
            Category
          </Text>
        </InlineStack>
        <div
          style={{
            padding: "12px",
            backgroundColor: "var(--p-color-bg-surface-info-subdued)",
            borderRadius: "10px",
            border: "1px solid var(--p-color-border-info-subdued)",
          }}
        >
          <InlineStack gap="300" blockAlign="center">
            <div
              style={{
                backgroundColor: "var(--p-color-bg-fill-info-secondary)",
                padding: "8px",
                borderRadius: "8px",
                color: "var(--p-color-icon-info)",
              }}
            >
              <SparklesIcon size={18} />
            </div>
            <BlockStack gap="0">
              <Text variant="bodyMd" fontWeight="bold" as="p">
                {product.category?.name || "Not Categorized"}
              </Text>
              <Text variant="bodySm" tone="subdued" as="p">
                in {product.category?.topLevel || "N/A"}
              </Text>
            </BlockStack>
          </InlineStack>
        </div>
      </BlockStack>

      <Divider />

      <BlockStack gap="300">
        <Text variant="headingMd" as="h3">
          Enrichment
        </Text>

        <BlockStack gap="200">
          <div
            style={{
              padding: "10px",
              backgroundColor: "var(--p-color-bg-surface-secondary)",
              borderRadius: "10px",
              border: "1px solid var(--p-color-border-subdued)",
            }}
          >
            <InlineStack gap="300" blockAlign="center">
              <div
                style={{
                  backgroundColor: "var(--p-color-bg-fill-info-secondary)",
                  padding: "8px",
                  borderRadius: "8px",
                  color: "var(--p-color-icon-info)",
                }}
              >
                <VenusAndMarsIcon size={18} />
              </div>
              <BlockStack gap="0">
                <Text variant="bodyXs" tone="subdued" as="p">
                  Gender
                </Text>
                <Text variant="bodySm" fontWeight="bold" as="p">
                  {(product.gender || []).length > 0
                    ? product.gender.join(", ")
                    : "Unspecified"}
                </Text>
              </BlockStack>
            </InlineStack>
          </div>

          <div
            style={{
              padding: "10px",
              backgroundColor: "var(--p-color-bg-surface-secondary)",
              borderRadius: "10px",
              border: "1px solid var(--p-color-border-subdued)",
            }}
          >
            <InlineStack gap="300" blockAlign="center">
              <div
                style={{
                  backgroundColor: "var(--p-color-bg-fill-info-secondary)",
                  padding: "8px",
                  borderRadius: "8px",
                  color: "var(--p-color-icon-info)",
                }}
              >
                <UsersRoundIcon size={18} />
              </div>
              <BlockStack gap="0">
                <Text variant="bodyXs" tone="subdued" as="p">
                  Age Group
                </Text>
                <Text variant="bodySm" fontWeight="bold" as="p">
                  {(product.ageBuckets || []).length > 0
                    ? product.ageBuckets.join(", ")
                    : "Unspecified"}
                </Text>
              </BlockStack>
            </InlineStack>
          </div>
        </BlockStack>
      </BlockStack>
    </BlockStack>
  );
}
