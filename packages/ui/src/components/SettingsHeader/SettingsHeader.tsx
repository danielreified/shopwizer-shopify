import React from 'react';
import {
  BlockStack as PolarisBlockStack,
  InlineStack as PolarisInlineStack,
  Text as PolarisText,
} from '@shopify/polaris';

const BlockStack = PolarisBlockStack as any;
const InlineStack = PolarisInlineStack as any;
const Text = PolarisText as any;

// ============================================================
// Types
// ============================================================

export interface SettingsHeaderProps {
  /** Lucide or Polaris icon component */
  icon: any;
  title: string;
  description: string;
}

// ============================================================
// Component
// ============================================================

/**
 * Header with an icon badge, title, and description.
 * Used at the top of settings sections and detail panels.
 */
export function SettingsHeader({ icon: IconComponent, title, description }: SettingsHeaderProps) {
  return (
    <InlineStack gap="300" blockAlign="center">
      <div
        style={{
          width: '40px',
          height: '40px',
          backgroundColor: 'var(--p-color-bg-surface-secondary)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid var(--p-color-border-subdued)',
        }}
      >
        {typeof IconComponent === 'function' ||
        (typeof IconComponent === 'object' &&
          IconComponent !== null &&
          (IconComponent as any).$$typeof)
          ? React.createElement(IconComponent, {
              size: 20,
              color: 'var(--p-color-icon-subdued)',
            })
          : null}
      </div>
      <BlockStack gap="150">
        <Text variant="headingMd" as="h2">
          {title}
        </Text>
        <Text tone="subdued" as="p" variant="bodySm">
          {description}
        </Text>
      </BlockStack>
    </InlineStack>
  );
}

export default SettingsHeader;
