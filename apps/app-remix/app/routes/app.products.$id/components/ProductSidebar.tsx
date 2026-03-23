import { BlockStack } from "@shopify/polaris";
import { SidebarGroup, SidebarItem } from "../../../components/SidebarMenu";
import { RefreshCw } from "lucide-react";

interface ProductSidebarProps {
  bundles: Array<{ id: string; label?: string; variant?: string }>;
  onScrollTo: (id: string) => void;
}

export function ProductSidebar({ bundles, onScrollTo }: ProductSidebarProps) {
  return (
    <BlockStack gap="200">
      <SidebarGroup title="Bundles" variant="subdued" uppercase>
        {bundles?.length > 0 ? (
          bundles.map((bundle) => (
            <SidebarItem
              key={bundle.id}
              label={bundle.label || "Bundle"}
              onClick={() => onScrollTo("bundles-section")}
            />
          ))
        ) : (
          <SidebarItem
            label="Generate Now"
            icon={RefreshCw}
            onClick={() => onScrollTo("bundles-section")}
          />
        )}
      </SidebarGroup>

      <SidebarGroup title="Recommendations" variant="subdued" uppercase>
        <SidebarItem
          label="Similar Products"
          description="Visual matches"
          onClick={() => onScrollTo("similar")}
        />
        <SidebarItem
          label="Matching Color"
          description="Same palette items"
          onClick={() => onScrollTo("matching-color")}
        />
        <SidebarItem
          label="Sellers"
          description="Top performing pairs"
          onClick={() => onScrollTo("sellers")}
        />
        <SidebarItem
          label="Trending"
          description="Viral shopper picks"
          onClick={() => onScrollTo("trending")}
        />
        <SidebarItem
          label="New Arrivals"
          description="Freshest catalog additions"
          onClick={() => onScrollTo("new-arrivals")}
        />
      </SidebarGroup>
    </BlockStack>
  );
}
