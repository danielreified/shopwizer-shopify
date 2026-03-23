import { BlockStack, Box, Card, InlineStack, Text, TextField } from "@shopify/polaris";
import { Switch } from "@repo/ui/components/Switch";

interface IntegrationApp {
  id: string;
  name: string;
  description: string;
  logo: string;
  requiresInstanceId?: boolean;
}

interface IntegrationAppCardProps {
  app: IntegrationApp;
  isActive: boolean;
  onToggle: () => void;
  yotpoInstanceId: string;
  onYotpoInstanceChange: (value: string) => void;
}

export function IntegrationAppCard({
  app,
  isActive,
  onToggle,
  yotpoInstanceId,
  onYotpoInstanceChange,
}: IntegrationAppCardProps) {
  return (
    <Card>
      <BlockStack gap="300">
        <Box paddingBlockEnd="200" borderBlockEndWidth="025" borderColor="border">
          <InlineStack align="space-between" blockAlign="center">
            <InlineStack gap="300" blockAlign="center">
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  backgroundColor: "#f6f6f7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                <img
                  src={app.logo}
                  alt={app.name}
                  style={{
                    width: 28,
                    height: 28,
                    objectFit: "contain",
                    borderRadius: 6,
                  }}
                />
              </div>
              <Text variant="headingSm" as="h3">
                {app.name}
              </Text>
            </InlineStack>
            <Switch label="" checked={isActive} onChange={onToggle} />
          </InlineStack>
        </Box>
        <Text variant="bodyMd" as="p" tone="subdued">
          <span
            style={{
              display: "block",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={app.description}
          >
            {app.description}
          </span>
        </Text>
        {app.id === "yotpo" && isActive && (
          <TextField
            label="Instance ID"
            value={yotpoInstanceId}
            onChange={onYotpoInstanceChange}
            placeholder="Enter your Yotpo Instance ID"
            helpText="Find this in your Yotpo dashboard"
            autoComplete="off"
          />
        )}
      </BlockStack>
    </Card>
  );
}
