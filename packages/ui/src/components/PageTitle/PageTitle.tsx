import * as React from 'react';
import { BlockStack, Text, Badge, InlineStack, Box } from '@shopify/polaris';

export interface PageTitleProps {
  title: string;
  subtitle?: string;
  badge?: {
    text: string;
    tone?: 'success' | 'attention' | 'info' | 'critical' | 'warning' | 'subdued';
  };
  rightSlot?: React.ReactNode;
  className?: string;
}

export const PageTitle = ({
  title,
  subtitle,
  badge,
  rightSlot,
  className = '',
}: PageTitleProps) => {
  return (
    <div className={className}>
      <InlineStack align="space-between" blockAlign="center">
        <BlockStack gap="200">
          <InlineStack gap="300" blockAlign="center">
            <Text as="h1" variant="headingLg">
              {title}
            </Text>
            {badge && (
              <Badge tone={badge.tone as any} size="small">
                {badge.text}
              </Badge>
            )}
          </InlineStack>
          {subtitle && (
            <Text as="p" variant="bodyMd" tone="subdued">
              {subtitle}
            </Text>
          )}
        </BlockStack>
        {rightSlot && <Box>{rightSlot}</Box>}
      </InlineStack>
    </div>
  );
};
