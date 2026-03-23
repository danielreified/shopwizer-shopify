import { BlockStack } from "@shopify/polaris";
import { Settings, GalleryHorizontalEnd, CopyMinus } from "lucide-react";
import { SidebarItem } from "../../../components/SidebarMenu";

const navItems = [
  {
    label: "General",
    description: "App display & configuration",
    icon: Settings,
    path: "/app/settings/general",
  },
  {
    label: "Recommendation",
    description: "Algorithm & layout settings",
    icon: GalleryHorizontalEnd,
    path: "/app/settings/recommendation",
  },
  {
    label: "Exclusions",
    description: "Hidden products & collections",
    icon: CopyMinus,
    path: "/app/settings/exclusion",
  },
];

interface SettingsSidebarProps {
  currentPath: string;
}

export function SettingsSidebar({ currentPath }: SettingsSidebarProps) {
  return (
    <BlockStack gap="050">
      {navItems.map((item) => (
        <SidebarItem
          key={item.path}
          label={item.label}
          description={item.description}
          icon={item.icon}
          selected={currentPath === item.path}
          url={item.path}
          clickable={true}
        />
      ))}
    </BlockStack>
  );
}

export function getSettingsTitle(pathname: string) {
  const current = navItems.find((item) => item.path === pathname);
  return current ? `${current.label} Settings` : "Settings";
}
