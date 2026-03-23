import { BlockStack, Box, Button, Card, InlineStack, Text } from "@shopify/polaris";
import { ChevronDownIcon, ChevronUpIcon } from "@shopify/polaris-icons";
import { Boxes, Plus, TrendingUp, MousePointerClick, Eye, DollarSign, Sparkles } from "lucide-react";
import { useState } from "react";
import { ProductCard, SectionHeader } from "@repo/ui";



const BoxesIcon = Boxes as any;

interface BundleProduct {
  id: string;
  imageUrl?: string;
  title?: string;
  pinned?: boolean;
  edited?: boolean;
}

interface Bundle {
  id: string;
  slotId?: string | null;
  variant: string;
  label?: string;
  views: number;
  clicks: number;
  conversions: number;
  revenue: number;
  pinnedIds?: string[];
  products: BundleProduct[];
}

interface BundlesSectionProps {
  bundles: Bundle[];
  baseImageUrl: string;
  onGenerate: () => void;
  isGenerating: boolean;
  onTogglePin: (bundleId: string, targetId: string, currentPinned: boolean) => void;
  onEditProduct: (bundleId: string, targetId: string) => void;
  pinLoadingBundleId: string | null;
  pinLoadingTargetId: string | null;
  editLoadingBundleId: string | null;
  editLoadingTargetId: string | null;
}

// Animated stat component
function StatCard({
  icon,
  value,
  label,
  tone = "default",
  suffix = ""
}: {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  tone?: "default" | "success" | "info";
  suffix?: string;
}) {
  const toneStyles = {
    default: { color: "var(--p-color-text)", bg: "transparent" },
    success: { color: "#10b981", bg: "rgba(16, 185, 129, 0.1)" },
    info: { color: "#3b82f6", bg: "rgba(59, 130, 246, 0.1)" },
  };
  const style = toneStyles[tone];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "4px",
        padding: "12px 16px",
        borderRadius: "12px",
        backgroundColor: style.bg,
        minWidth: "80px",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
      }}
    >
      <div style={{ color: style.color, opacity: 0.8 }}>
        {icon}
      </div>
      <Text variant="headingMd" as="p" fontWeight="semibold">
        <span style={{ color: style.color }}>
          {typeof value === "number" ? value.toLocaleString() : value}{suffix}
        </span>
      </Text>
      <Text variant="bodySm" as="p" tone="subdued">
        {label}
      </Text>
    </div>
  );
}



// Single Bundle Card
function BundleCard({
  bundle,
  baseImageUrl,
  onTogglePin,
  onEditProduct,
  pinLoadingBundleId,
  pinLoadingTargetId,
  editLoadingBundleId,
  editLoadingTargetId,
}: {
  bundle: Bundle;
  baseImageUrl: string;
  onTogglePin: (bundleId: string, targetId: string, currentPinned: boolean) => void;
  onEditProduct: (bundleId: string, targetId: string) => void;
  pinLoadingBundleId: string | null;
  pinLoadingTargetId: string | null;
  editLoadingBundleId: string | null;
  editLoadingTargetId: string | null;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const ctr = bundle.views > 0 ? ((bundle.clicks / bundle.views) * 100).toFixed(1) : "0";
  const hasRevenue = bundle.revenue > 0;

  // Determine performance tier for visual feedback
  const ctrValue = parseFloat(ctr);
  const performanceTone: "default" | "success" | "info" =
    ctrValue >= 10 ? "success" : ctrValue >= 5 ? "info" : "default";

  return (
    <Card padding="0">
      <div
        style={{
          borderRadius: "20px",
          overflow: "hidden",
          backgroundColor: "var(--p-color-bg-surface)",
          border: "1px solid var(--p-color-border-subdued)",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
          transition: "box-shadow 0.3s ease",
        }}
      >
        {/* Header with Stats */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            background: "linear-gradient(135deg, rgba(59, 130, 246, 0.03) 0%, rgba(139, 92, 246, 0.03) 100%)",
            border: "none",
            borderBottom: isExpanded ? "1px solid var(--p-color-border-subdued)" : "none",
            cursor: "pointer",
            transition: "background 0.2s ease",
          }}
        >
          {/* Left side - Bundle info */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(59, 130, 246, 0.3)",
              }}
            >
              <Boxes size={18} color="white" />
            </div>
            <div style={{ textAlign: "left" }}>
              <Text variant="headingSm" as="h4">
                {bundle.label || "Bundle"}
              </Text>
              <Text variant="bodySm" as="p" tone="subdued">
                {bundle.products.length} product{bundle.products.length !== 1 ? "s" : ""}
                {bundle.products.filter(p => p.pinned).length > 0 && (
                  <span style={{ color: "#10b981", marginLeft: "4px" }}>
                    • {bundle.products.filter(p => p.pinned).length} pinned
                  </span>
                )}
              </Text>
            </div>
          </div>

          {/* Right side - Stats inline */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {/* Stats pills */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {/* Impressions */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Eye size={14} color="var(--p-color-icon-subdued)" />
                <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--p-color-text)" }}>
                  {bundle.views.toLocaleString()}
                </span>
                <span style={{ fontSize: "11px", color: "var(--p-color-text-subdued)", textTransform: "uppercase" }}>
                  impr
                </span>
              </div>

              {/* Divider */}
              <div style={{ width: "1px", height: "20px", backgroundColor: "var(--p-color-border-subdued)" }} />

              {/* Clicks */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <MousePointerClick size={14} color="var(--p-color-icon-subdued)" />
                <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--p-color-text)" }}>
                  {bundle.clicks.toLocaleString()}
                </span>
                <span style={{ fontSize: "11px", color: "var(--p-color-text-subdued)", textTransform: "uppercase" }}>
                  clicks
                </span>
              </div>

              {/* Divider */}
              <div style={{ width: "1px", height: "20px", backgroundColor: "var(--p-color-border-subdued)" }} />

              {/* CTR Badge */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "4px 10px",
                  borderRadius: "20px",
                  backgroundColor: performanceTone === "success"
                    ? "rgba(16, 185, 129, 0.1)"
                    : performanceTone === "info"
                      ? "rgba(59, 130, 246, 0.1)"
                      : "var(--p-color-bg-surface-secondary)",
                }}
              >
                <TrendingUp
                  size={14}
                  color={performanceTone === "success" ? "#10b981" : performanceTone === "info" ? "#3b82f6" : "var(--p-color-icon-subdued)"}
                />
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: performanceTone === "success" ? "#10b981" : performanceTone === "info" ? "#3b82f6" : "var(--p-color-text)",
                  }}
                >
                  {ctr}%
                </span>
                <span style={{ fontSize: "11px", color: "var(--p-color-text-subdued)", textTransform: "uppercase" }}>
                  CTR
                </span>
              </div>

              {/* Revenue (if exists) */}
              {hasRevenue && (
                <>
                  <div style={{ width: "1px", height: "20px", backgroundColor: "var(--p-color-border-subdued)" }} />
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "4px 10px",
                      borderRadius: "20px",
                      backgroundColor: "rgba(16, 185, 129, 0.1)",
                    }}
                  >
                    <DollarSign size={14} color="#10b981" />
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "#10b981" }}>
                      ${bundle.revenue.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Expand/Collapse icon button */}
            <Button
              variant="secondary"
              icon={isExpanded ? ChevronUpIcon : ChevronDownIcon}
              accessibilityLabel={isExpanded ? "Collapse" : "Expand"}
            />
          </div>
        </button>

        {/* Content - just products now */}
        <div
          style={{
            maxHeight: isExpanded ? "1000px" : "0",
            opacity: isExpanded ? 1 : 0,
            overflow: "hidden",
            transition: "max-height 0.4s ease, opacity 0.3s ease",
          }}
        >
          <div style={{ padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
              {/* Source product */}
              <div
                style={{
                  position: "relative",
                  width: "100px",
                  borderRadius: "14px",
                  overflow: "hidden",
                  backgroundColor: "var(--p-color-bg-surface-secondary)",
                  border: "2px dashed var(--p-color-border)",
                  opacity: 0.85,
                }}
              >
                <div
                  style={{
                    width: "100%",
                    aspectRatio: "1",
                    backgroundColor: "#f1f5f9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                  }}
                >
                  {baseImageUrl ? (
                    <img
                      src={baseImageUrl}
                      alt="Source"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "60%",
                        height: "60%",
                        backgroundColor: "#e2e8f0",
                        borderRadius: "6px",
                      }}
                    />
                  )}
                </div>
                <div style={{ padding: "8px", textAlign: "center" }}>
                  <Text variant="bodyXs" as="p" tone="subdued" fontWeight="medium">
                    SOURCE
                  </Text>
                </div>
              </div>

              {/* Connector */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  backgroundColor: "var(--p-color-bg-surface-secondary)",
                  border: "1px solid var(--p-color-border-subdued)",
                }}
              >
                <Plus size={16} color="var(--p-color-icon-subdued)" />
              </div>

              {/* Bundle products */}
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                {bundle.products.map((p) => (
                  <div key={p.id} style={{ width: "160px" }}>
                    <ProductCard
                      id={p.id}
                      title={p.title || p.id}
                      imageUrl={p.imageUrl}
                      isPinned={Boolean(p.pinned)}
                      isEdited={Boolean(p.edited)}
                      onTogglePin={() => onTogglePin(bundle.id, p.id, Boolean(p.pinned))}
                      onEdit={() => onEditProduct(bundle.id, p.id)}
                      isPinLoading={
                        pinLoadingBundleId === bundle.id && pinLoadingTargetId === p.id
                      }
                      isEditLoading={
                        editLoadingBundleId === bundle.id && editLoadingTargetId === p.id
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Footnote */}
            <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px solid var(--p-color-border-subdued)" }}>
              <Text variant="bodyXs" as="p" tone="subdued">
                Stats include all historical versions of this bundle slot
              </Text>
              <Text variant="bodyXs" as="p" tone="subdued">
                Bundle ID: {bundle.slotId || bundle.id}
              </Text>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

// Empty state component
function EmptyBundlesState({
  onGenerate,
  isGenerating,
}: {
  onGenerate: () => void;
  isGenerating: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        borderRadius: "20px",
        background: "linear-gradient(135deg, rgba(59, 130, 246, 0.04) 0%, rgba(139, 92, 246, 0.04) 100%)",
        border: "2px dashed var(--p-color-border)",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: "64px",
          height: "64px",
          borderRadius: "16px",
          background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "20px",
          boxShadow: "0 4px 20px rgba(59, 130, 246, 0.25)",
        }}
      >
        <Boxes size={28} color="white" />
      </div>
      <Text variant="headingMd" as="h3">
        No bundles yet
      </Text>
      <Box paddingBlockStart="200" paddingBlockEnd="400">
        <Text variant="bodyMd" as="p" tone="subdued">
          Generate smart product bundles based on your order history and product relationships.
        </Text>
      </Box>
      <Button
        variant="primary"
        onClick={onGenerate}
        loading={isGenerating}
        size="large"
        icon={Sparkles as any}
      >
        Generate Bundles
      </Button>
    </div>
  );
}

export function BundlesSection({
  bundles,
  baseImageUrl,
  onGenerate,
  isGenerating,
  onTogglePin,
  onEditProduct,
  pinLoadingBundleId,
  pinLoadingTargetId,
  editLoadingBundleId,
  editLoadingTargetId,
}: BundlesSectionProps) {
  return (
    <BlockStack gap="500">
      {/* Section header */}
      <SectionHeader
        title="Product Bundles"
        description="AI-generated product combinations that sell together"
        icon={Boxes}
        iconGradient={{ from: "#3b82f6", to: "#8b5cf6" }}
      />

      {/* Bundles list */}
      <div id="bundles-section">
        <Card>
          <BlockStack gap="400">
            {bundles?.length === 0 ? (
              <EmptyBundlesState onGenerate={onGenerate} isGenerating={isGenerating} />
            ) : (
              bundles.map((bundle) => (
                <BundleCard
                  key={bundle.id}
                  bundle={bundle}
                  baseImageUrl={baseImageUrl}
                  onTogglePin={onTogglePin}
                  onEditProduct={onEditProduct}
                  pinLoadingBundleId={pinLoadingBundleId}
                  pinLoadingTargetId={pinLoadingTargetId}
                  editLoadingBundleId={editLoadingBundleId}
                  editLoadingTargetId={editLoadingTargetId}
                />
              ))
            )}
          </BlockStack>
        </Card>
      </div>
    </BlockStack>
  );
}
