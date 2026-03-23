// app/components/TrendsDashboard.tsx

import { InlineGrid } from "@shopify/polaris";
import { ResourceListCard, type ListItem } from "@repo/ui/components/ResourceListCard";

export function Trends({
  attributedItems,
  topProducts,
}: {
  attributedItems: ListItem[];
  topProducts: ListItem[];
}) {
  return (
    <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
      {/* ------------------------------------------ */}
      {/* LEFT SECTION — Recent Attributed Items     */}
      {/* ------------------------------------------ */}
      <ResourceListCard
        headerTitle="Recent Attributed Items"
        showCount
        countLabels={{ singular: "item", plural: "items" }}
        headerHelpContent={<div>Products purchased because of Shopwizer recommendations.</div>}
        items={attributedItems}
      />

      {/* ------------------------------------------ */}
      {/* RIGHT SECTION — Top Converting Products    */}
      {/* ------------------------------------------ */}
      <ResourceListCard
        headerTitle="Top Performers (30d)"
        showCount
        countLabels={{ singular: "product", plural: "products" }}
        headerHelpContent={<div>Products with highest attributed sales from recommendations.</div>}
        items={topProducts}
      />
    </InlineGrid>
  );
}
