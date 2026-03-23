import { BlockStack, Card } from "@shopify/polaris";
import { SettingsHeader } from "../../../../components/SettingsHeader";
import { ActionRow } from "./ActionRow";
import { Cpu } from "lucide-react";

const CpuIcon = Cpu as any;

interface CacheSectionProps {
  canClearCache: boolean;
  hoursUntilNextClear: number;
  lastCacheCleared?: string | null;
  cacheLoading: boolean;
  onClearCache: () => void;
}

export function CacheSection({
  canClearCache,
  hoursUntilNextClear,
  lastCacheCleared,
  cacheLoading,
  onClearCache,
}: CacheSectionProps) {
  return (
    <BlockStack gap="300">
      <SettingsHeader
        icon={CpuIcon}
        title="Recommendation cache"
        description="Manage the temporary storage of recommendation results."
      />
      <Card>
        <ActionRow
          label="Clear cache"
          icon={CpuIcon}
          status={
            !canClearCache ? { label: "On Cooldown", tone: "info" } : { label: "Ready", tone: "success" }
          }
          description={
            !canClearCache && hoursUntilNextClear > 0
              ? `Next clear available in ${hoursUntilNextClear} hour${hoursUntilNextClear === 1 ? "" : "s"}${
                  lastCacheCleared ? ` (last cleared ${new Date(lastCacheCleared).toLocaleDateString()})` : ""
                }`
              : "Clear temporary cached results. Fresh results will rebuild automatically."
          }
          actionText="Clear now"
          disabled={!canClearCache}
          loading={cacheLoading}
          onAction={canClearCache && !cacheLoading ? onClearCache : undefined}
        />
      </Card>
    </BlockStack>
  );
}
