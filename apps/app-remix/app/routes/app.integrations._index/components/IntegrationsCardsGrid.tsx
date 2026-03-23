import { InlineGrid } from "@shopify/polaris";
import { IntegrationAppCard } from "./IntegrationAppCard";

interface IntegrationApp {
  id: string;
  name: string;
  description: string;
  logo: string;
  requiresInstanceId?: boolean;
}

interface IntegrationsCardsGridProps {
  apps: IntegrationApp[];
  activeAppId: string | null;
  onToggle: (appId: string) => void;
  yotpoInstanceId: string;
  onYotpoInstanceChange: (value: string) => void;
}

export function IntegrationsCardsGrid({
  apps,
  activeAppId,
  onToggle,
  yotpoInstanceId,
  onYotpoInstanceChange,
}: IntegrationsCardsGridProps) {
  return (
    <InlineGrid columns={{ xs: 1, sm: 2, md: 3 }} gap="400">
      {apps.map((app) => (
        <div key={app.id} style={{ height: "100%", minHeight: "120px" }}>
          <IntegrationAppCard
            app={app}
            isActive={activeAppId === app.id}
            onToggle={() => onToggle(app.id)}
            yotpoInstanceId={yotpoInstanceId}
            onYotpoInstanceChange={onYotpoInstanceChange}
          />
        </div>
      ))}
    </InlineGrid>
  );
}
