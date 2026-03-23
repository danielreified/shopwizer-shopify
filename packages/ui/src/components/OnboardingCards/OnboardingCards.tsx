import React, { type ReactNode } from 'react';
import { Card, Text, InlineStack, BlockStack, Icon, Divider } from '@shopify/polaris';
import { ChevronRightIcon } from '@shopify/polaris-icons';

// ============================================================
// OverviewItem
// ============================================================

export interface OverviewItemProps {
  /** Polaris icon source */
  icon: any;
  /** Primary text (plan name, count, etc.) */
  title: string | number;
  /** Secondary label below the title */
  label: string;
  /** Tertiary text below the label */
  subValue?: string;
  /** Badge or tag shown next to the title */
  badge?: ReactNode;
  /** Click handler — shows chevron when provided */
  onClick?: () => void;
}

/**
 * Clickable overview row with Polaris icon, title, label, and optional chevron.
 */
export function OverviewItem({ icon, title, label, subValue, badge, onClick }: OverviewItemProps) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '16px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'background-color 0.2s',
        borderBottom: '1px solid var(--p-color-border-subdued)',
      }}
      className={onClick ? 'hover:bg-gray-50 group last:border-0' : 'last:border-0'}
    >
      <InlineStack gap="300" align="space-between" blockAlign="center">
        <InlineStack gap="300" blockAlign="center">
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: 'var(--p-color-bg-surface-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{ width: '20px', height: '20px' }}>
              <Icon source={icon} tone="subdued" />
            </div>
          </div>
          <BlockStack gap="050">
            <InlineStack gap="150" blockAlign="center">
              <Text as="span" variant="bodyMd" fontWeight="bold">
                {title}
              </Text>
              {badge}
            </InlineStack>
            <Text as="span" variant="bodySm" tone="subdued">
              {label}
            </Text>
            {subValue && (
              <Text as="span" variant="bodyXs" tone="subdued">
                {subValue}
              </Text>
            )}
          </BlockStack>
        </InlineStack>
        {onClick && (
          <div
            style={{ width: '16px', height: '16px', opacity: 0.3 }}
            className="group-hover:translate-x-1 transition-transform"
          >
            <Icon source={ChevronRightIcon} tone="subdued" />
          </div>
        )}
      </InlineStack>
    </div>
  );
}

// ============================================================
// ShopOverviewCard
// ============================================================

export interface ShopOverviewCardProps {
  children: ReactNode;
  title?: string;
}

/**
 * Card wrapper with an uppercase section title. Children are rendered
 * inside a Card with no padding (rows handle their own padding).
 */
export function ShopOverviewCard({ children, title }: ShopOverviewCardProps) {
  return (
    <BlockStack gap="200">
      {title && (
        <div style={{ paddingLeft: '8px' }}>
          <Text variant="headingSm" as="h3" tone="subdued">
            {title.toUpperCase()}
          </Text>
        </div>
      )}
      <Card padding="0">
        <div style={{ overflow: 'hidden', borderRadius: '8px' }}>{children}</div>
      </Card>
    </BlockStack>
  );
}

// ============================================================
// InsightItem
// ============================================================

export interface InsightItemProps {
  /** Polaris icon source */
  icon: any;
  /** Insight title */
  title: string;
  /** Insight description */
  description: string;
  /** Background color for the icon container */
  iconBgColor?: string;
  /** Polaris icon tone */
  iconTone?: 'info' | 'success' | 'warning' | 'critical' | 'attention' | 'magic';
}

/**
 * Horizontal row with a tinted icon box and title/description text.
 */
export function InsightItem({
  icon,
  title,
  description,
  iconBgColor = 'var(--p-color-bg-fill-info-secondary)',
  iconTone = 'info',
}: InsightItemProps) {
  return (
    <InlineStack gap="300" blockAlign="start">
      <div
        style={{
          padding: '10px',
          backgroundColor: iconBgColor,
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ width: '18px', height: '18px' }}>
          <Icon source={icon} tone={iconTone as any} />
        </div>
      </div>
      <BlockStack gap="050">
        <Text as="p" variant="bodyMd" fontWeight="bold">
          {title}
        </Text>
        <Text as="p" variant="bodySm" tone="subdued">
          {description}
        </Text>
      </BlockStack>
    </InlineStack>
  );
}

// ============================================================
// GrowthInsightsCard
// ============================================================

export interface GrowthInsightsCardProps {
  children: ReactNode;
  title?: string;
}

/**
 * Card with an uppercase section title. Children are separated by dividers.
 */
export function GrowthInsightsCard({ children, title }: GrowthInsightsCardProps) {
  return (
    <BlockStack gap="200">
      {title && (
        <div style={{ paddingLeft: '8px' }}>
          <Text variant="headingSm" as="h3" tone="subdued">
            {title.toUpperCase()}
          </Text>
        </div>
      )}
      <Card padding="400">
        <BlockStack gap="400">
          {React.Children.map(children, (child, index) => (
            <>
              {child}
              {index < React.Children.count(children) - 1 && <Divider />}
            </>
          ))}
        </BlockStack>
      </Card>
    </BlockStack>
  );
}
