import { BlockStack, Card } from "@shopify/polaris";
import { SettingsHeader } from "../../../../components/SettingsHeader";
import { ActionRow } from "./ActionRow";
import { Database } from "lucide-react";

const DatabaseIcon = Database as any;

interface CatalogSyncSectionProps {
  canSync: boolean;
  isSyncing: boolean;
  daysUntilNextSync: number;
  lastSyncDate?: string | null;
  syncLoading: boolean;
  onSync: () => void;
}

export function CatalogSyncSection({
  canSync,
  isSyncing,
  daysUntilNextSync,
  lastSyncDate,
  syncLoading,
  onSync,
}: CatalogSyncSectionProps) {
  return (
    <BlockStack gap="300">
      <SettingsHeader
        icon={DatabaseIcon}
        title="Product catalog sync"
        description="Keep your recommendations up to date with your latest product data."
      />
      <Card>
        <ActionRow
          label="Resync product catalog"
          icon={DatabaseIcon}
          status={
            isSyncing
              ? { label: "Syncing...", tone: "attention" }
              : !canSync
              ? { label: "On Cooldown", tone: "info" }
              : { label: "Ready", tone: "success" }
          }
          description={
            !canSync && daysUntilNextSync > 0
              ? `Next sync available in ${daysUntilNextSync} day${
                  daysUntilNextSync === 1 ? "" : "s"
                }${lastSyncDate ? ` (last synced ${new Date(lastSyncDate).toLocaleDateString()})` : ""}`
              : isSyncing
              ? "Sync currently in progress..."
              : "Fetch latest products and variants then re-index recommendations."
          }
          actionText="Sync now"
          disabled={!canSync || isSyncing}
          loading={syncLoading}
          onAction={canSync && !isSyncing && !syncLoading ? onSync : undefined}
        />
      </Card>
    </BlockStack>
  );
}
