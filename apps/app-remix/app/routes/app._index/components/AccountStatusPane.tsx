import { Badge, BlockStack } from "@shopify/polaris";
import {
  ShopOverviewCard,
  OverviewItem,
  GrowthInsightsCard,
  InsightItem,
} from "../../../components/onboarding/OnboardingCards";
import {
  CheckCircleIcon,
  ClockIcon,
  OrderIcon,
  ProductIcon,
  ChartLineIcon,
  MagicIcon,
} from "@shopify/polaris-icons";

interface AccountStatusPaneProps {
  planName: string;
  trialDaysLeft: number;
  ordersThisMonth: number;
  orderLimit?: number | null;
  productCount: number;
  onNavigate: (path: string) => void;
}

export function AccountStatusPane({
  planName,
  trialDaysLeft,
  ordersThisMonth,
  orderLimit,
  productCount,
  onNavigate,
}: AccountStatusPaneProps) {
  const isFreePlan = planName.toLowerCase() === "free";
  const orderUsage =
    orderLimit && orderLimit > 0
      ? `${Math.round((ordersThisMonth / orderLimit) * 100)}% of limit used`
      : undefined;

  return (
    <BlockStack gap="500">
      <ShopOverviewCard title="Shop Overview">
        <OverviewItem
          icon={CheckCircleIcon}
          title={`${planName} Plan`}
          label="Current subscription"
          badge={
            isFreePlan ? (
              <Badge tone="warning" size="small">
                Upgrade
              </Badge>
            ) : (
              <Badge tone="success" size="small">
                Active
              </Badge>
            )
          }
          onClick={() => onNavigate("/app/plans")}
        />

        {trialDaysLeft > 0 && (
          <OverviewItem
            icon={ClockIcon}
            title={`${trialDaysLeft} Days`}
            label="Trial period remaining"
            onClick={() => onNavigate("/app/plans")}
          />
        )}

        <OverviewItem
          icon={OrderIcon}
          title={`${ordersThisMonth}${orderLimit ? ` / ${orderLimit}` : ""}`}
          label="Orders this month"
          subValue={orderUsage}
          onClick={() => onNavigate("/app/plans")}
        />

        <OverviewItem
          icon={ProductIcon}
          title={productCount.toLocaleString()}
          label="Synced products"
          onClick={() => onNavigate("/app/products")}
        />
      </ShopOverviewCard>

      <GrowthInsightsCard title="Growth Insights">
        <InsightItem
          icon={ChartLineIcon}
          title="Revenue Insight"
          description="Your revenue from recommendations is up 12% this week!"
          iconBgColor="var(--p-color-bg-fill-info-secondary)"
          iconTone="info"
        />
        <InsightItem
          icon={MagicIcon}
          title="Optimization Tip"
          description="Try adding 'Complete the Look' bundles to your PDPs for higher AOV."
          iconBgColor="var(--p-color-bg-fill-magic-secondary)"
          iconTone="magic"
        />
      </GrowthInsightsCard>
    </BlockStack>
  );
}
