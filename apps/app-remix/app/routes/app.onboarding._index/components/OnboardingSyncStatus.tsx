import { Box, Icon, InlineStack, Text } from "@shopify/polaris";
import { CheckCircleIcon } from "@shopify/polaris-icons";
import { CircleDashed } from "lucide-react";

interface SyncStatus {
  open: boolean;
  message: string;
}

interface OnboardingSyncStatusProps {
  sync: SyncStatus;
  isSyncComplete: boolean;
}

export function OnboardingSyncStatus({ sync, isSyncComplete }: OnboardingSyncStatusProps) {
  if (!sync.open) return null;

  return (
    <Box padding="400">
      <InlineStack gap="300" blockAlign="center">
        <div style={{ color: isSyncComplete ? "#4ade80" : "#ababab", display: "flex" }}>
          {isSyncComplete ? (
            <Icon source={CheckCircleIcon as any} tone="success" />
          ) : (
            <div className="animate-spin" style={{ display: "flex" }}>
              {(() => {
                const IconComp = CircleDashed as any;
                return <IconComp size={18} />;
              })()}
            </div>
          )}
        </div>
        <Text as="p" variant="bodySm" tone={isSyncComplete ? "success" : "subdued"}>
          {sync.message}
        </Text>
      </InlineStack>
    </Box>
  );
}
