import { BlockStack } from "@shopify/polaris";
import { SidebarGroup, SidebarItem } from "../../../components/SidebarMenu";
import {
  Boxes,
  Brush,
  CreditCard,
  Home,
  Package,
  Settings,
  Share2,
  Sparkles,
} from "lucide-react";

interface OverviewSidebarProps {
  currentPath: string;
  currentSearch: string;
}

function isPathMatch(currentPath: string, targetPath: string) {
  return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`);
}

function currentIntegrationCategory(currentSearch: string): "wishlist" | "reviews" | null {
  const sp = new URLSearchParams(currentSearch);
  const category = sp.get("category");
  if (category === "wishlist" || category === "reviews") return category;
  return null;
}

export function OverviewSidebar({ currentPath, currentSearch }: OverviewSidebarProps) {
  const selectedIntegrationCategory = currentIntegrationCategory(currentSearch);

  return (
    <BlockStack gap="400">
      <SidebarGroup title="Pages">
        <SidebarItem label="Home" icon={Home} selected={currentPath === "/app"} url="/app" />
        <SidebarItem
          label="Products"
          icon={Package}
          selected={isPathMatch(currentPath, "/app/products")}
          url="/app/products"
        />
        <SidebarItem
          label="Merchandising"
          icon={Boxes}
          selected={isPathMatch(currentPath, "/app/merchandising")}
          url="/app/merchandising"
        />
        <SidebarItem
          label="Integrations"
          icon={Share2}
          selected={isPathMatch(currentPath, "/app/integrations")}
          url="/app/integrations"
        />
        <SidebarItem
          label="Editor"
          icon={Brush}
          selected={isPathMatch(currentPath, "/app/editor")}
          url="/app/editor"
        />
        <SidebarItem
          label="Settings"
          icon={Settings}
          selected={isPathMatch(currentPath, "/app/settings")}
          url="/app/settings/general"
        />
        <SidebarItem
          label="Plans"
          icon={CreditCard}
          selected={isPathMatch(currentPath, "/app/plans")}
          url="/app/plans"
        />
      </SidebarGroup>

      <SidebarGroup title="Shortcuts" noDivider={true}>
        <SidebarItem
          label="Integrations: Wishlist"
          description="Connect wishlist app"
          selected={selectedIntegrationCategory === "wishlist"}
          url="/app/integrations?category=wishlist"
          style={{ paddingLeft: "20px" }}
        />
        <SidebarItem
          label="Integrations: Reviews"
          description="Connect reviews app"
          selected={selectedIntegrationCategory === "reviews"}
          url="/app/integrations?category=reviews"
          style={{ paddingLeft: "20px" }}
        />
        <SidebarItem
          label="Settings: General"
          description="App display configuration"
          selected={currentPath === "/app/settings/general"}
          url="/app/settings/general"
          style={{ paddingLeft: "20px" }}
        />
        <SidebarItem
          label="Settings: Recommendation"
          description="Algorithm and layout"
          selected={currentPath === "/app/settings/recommendation"}
          url="/app/settings/recommendation"
          style={{ paddingLeft: "20px" }}
        />
        <SidebarItem
          label="Settings: Exclusions"
          description="Hidden products and collections"
          selected={currentPath === "/app/settings/exclusion"}
          url="/app/settings/exclusion"
          style={{ paddingLeft: "20px" }}
        />
      </SidebarGroup>
    </BlockStack>
  );
}
