import { BlockStack, Card } from "@shopify/polaris";
import { SettingsHeader } from "../../../../components/SettingsHeader";
import { Bell } from "lucide-react";
import { ToggleRow } from "./ToggleRow";

const BellIcon = Bell as any;

interface NotificationsSectionProps {
  productCapAlerts: boolean;
  onProductCapAlertsChange: (next: boolean) => void;
}

export function NotificationsSection({
  productCapAlerts,
  onProductCapAlertsChange,
}: NotificationsSectionProps) {
  return (
    <BlockStack gap="500">
      <SettingsHeader
        icon={BellIcon}
        title="Notifications"
        description="Choose which alerts we should send to your contact."
      />
      <Card>
        <BlockStack gap="0">
          <ToggleRow
            title="Product cap alerts"
            description="Email when you approach your product limit (warn at 80%, 90%, and 100%)."
            checked={productCapAlerts}
            onChange={onProductCapAlertsChange}
          />
        </BlockStack>
      </Card>
    </BlockStack>
  );
}
