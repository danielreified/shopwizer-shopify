import { BlockStack, Box, Card, Divider } from "@shopify/polaris";
import { SettingsHeader } from "../../../../components/SettingsHeader";
import { ToggleRow } from "./ToggleRow";
import { Zap } from "lucide-react";

const ZapIcon = Zap as any;

export type RecoKey =
  | "similar"
  | "color"
  | "trending"
  | "newArrivals"
  | "bestSellers"
  | "bundles";

const RECOMMENDERS: Array<{
  key: RecoKey;
  title: string;
  description: string;
}> = [
  {
    key: "similar",
    title: "Similar",
    description:
      "Shows look-alike products based on attributes, category, and embeddings.",
  },
  {
    key: "color",
    title: "Matching color",
    description: "Highlights variants in the same or complementary color families.",
  },
  {
    key: "trending",
    title: "Trending",
    description: "Fast-moving items with recent velocity spikes.",
  },
  {
    key: "newArrivals",
    title: "New arrivals",
    description:
      "Newest products in the same category/collection to keep catalog fresh.",
  },
  {
    key: "bestSellers",
    title: "Best sellers",
    description:
      "Proven winners with long-run performance. Strong for social proof.",
  },
];

interface RecommendersSectionProps {
  recommenders: Record<RecoKey, boolean>;
  onToggle: (key: RecoKey, next: boolean) => void;
}

export function RecommendersSection({ recommenders, onToggle }: RecommendersSectionProps) {
  return (
    <BlockStack gap="300">
      <SettingsHeader
        icon={ZapIcon}
        title="Recommenders"
        description="Enable or disable recommendation engines across your storefront."
      />
      <Card>
        <BlockStack gap="0">
          {RECOMMENDERS.map((r, i) => (
            <Box key={r.key} paddingBlock={i > 0 ? "0" : undefined}>
              {i > 0 && (
                <Box paddingBlock="100">
                  <Divider />
                </Box>
              )}
              <ToggleRow
                title={r.title}
                description={r.description}
                checked={recommenders[r.key]}
                onChange={(next) => onToggle(r.key, next)}
              />
            </Box>
          ))}
        </BlockStack>
      </Card>
    </BlockStack>
  );
}
