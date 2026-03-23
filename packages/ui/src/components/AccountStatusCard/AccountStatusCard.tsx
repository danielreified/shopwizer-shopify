import type { ReactNode } from 'react';
import { Badge } from '@shopify/polaris';
import { CheckCircleIcon, ClockIcon, OrderIcon, ProductIcon } from '@shopify/polaris-icons';
import {
  ShopOverviewCard,
  OverviewItem,
  GrowthInsightsCard,
  InsightItem,
} from '../OnboardingCards';

// ============================================================
// Types
// ============================================================

export interface AccountInsight {
  icon: any;
  title: string;
  description: string;
  iconBgColor?: string;
  iconTone?: 'info' | 'success' | 'warning' | 'critical' | 'attention' | 'magic';
}

export interface AccountStatusCardProps {
  planName: string;
  trialDays: number;
  orders: number;
  limit?: number | null;
  products: number;
  onNavigate: (path: string) => void;
  /** Optional insight items — defaults to generic tips when omitted */
  insights?: AccountInsight[];
}

// ============================================================
// Component
// ============================================================

/**
 * Account overview sidebar showing plan, orders, products, and growth insights.
 */
export function AccountStatusCard({
  planName,
  trialDays,
  orders,
  limit,
  products,
  onNavigate,
  insights,
}: AccountStatusCardProps) {
  return (
    <div>
      <ShopOverviewCard title="Shop Overview">
        <OverviewItem
          icon={CheckCircleIcon}
          title={`${planName} Plan`}
          label="Current subscription"
          badge={
            planName.toLowerCase() === 'free' ? (
              <Badge tone="warning" size="small">
                Upgrade
              </Badge>
            ) : (
              <Badge tone="success" size="small">
                Active
              </Badge>
            )
          }
          onClick={() => onNavigate('/app/plans')}
        />

        {trialDays > 0 && (
          <OverviewItem
            icon={ClockIcon}
            title={`${trialDays} Days`}
            label="Trial period remaining"
            onClick={() => onNavigate('/app/plans')}
          />
        )}

        <OverviewItem
          icon={OrderIcon}
          title={`${orders}${limit ? ` / ${limit}` : ''}`}
          label="Orders this month"
          subValue={limit ? `${Math.round((orders / limit) * 100)}% of limit used` : undefined}
          onClick={() => onNavigate('/app/plans')}
        />

        <OverviewItem
          icon={ProductIcon}
          title={products.toLocaleString()}
          label="Synced products"
          onClick={() => onNavigate('/app/products')}
        />
      </ShopOverviewCard>

      {insights && insights.length > 0 && (
        <GrowthInsightsCard title="Growth Insights">
          {insights.map((insight, i) => (
            <InsightItem
              key={i}
              icon={insight.icon}
              title={insight.title}
              description={insight.description}
              iconBgColor={insight.iconBgColor}
              iconTone={insight.iconTone}
            />
          ))}
        </GrowthInsightsCard>
      )}
    </div>
  );
}

export default AccountStatusCard;
