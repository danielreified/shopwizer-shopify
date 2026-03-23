import { BlockStack, Card } from "@shopify/polaris";
import { SettingsHeader } from "../../../../components/SettingsHeader";
import { ToggleRow } from "./ToggleRow";
import { PackagePlus } from "lucide-react";

const PackagePlusIcon = PackagePlus as any;

interface BundlesSectionProps {
  enabled: boolean;
  onToggle: (next: boolean) => void;
}

export function BundlesSection({ enabled, onToggle }: BundlesSectionProps) {
  return (
    <BlockStack gap="300">
      <SettingsHeader
        icon={PackagePlusIcon}
        title="Bundles"
        description="Promote combined products and cross-sell opportunities."
      />
      <Card>
        <ToggleRow
          title="Frequently Bought Together"
          description="Suggest complementary items based on historical shopping cart patterns."
          checked={enabled}
          onChange={onToggle}
        />
      </Card>
    </BlockStack>
  );
}
