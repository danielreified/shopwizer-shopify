import React from 'react';
import { BlockStack, Text } from '@shopify/polaris';

// ============================================================
// Types
// ============================================================

export interface MetricDisplayProps {
  /** The main value to display */
  value: number | string;
  /** Small label shown below the value */
  label: string;
  /** Prefix (e.g., "$", "R") prepended to the value */
  prefix?: string;
  /** Suffix (e.g., "%", "items") appended to the value */
  suffix?: string;
  /** Format number as currency (2 decimal places) */
  isCurrency?: boolean;
  /** Text variant for the value */
  valueVariant?: 'headingLg' | 'headingMd' | 'headingSm';
  /** Polaris tone for the value text */
  valueTone?: 'success' | 'critical' | 'caution' | 'subdued';
  /** Alignment */
  alignment?: 'start' | 'center' | 'end';
  /** Show a dash when value is 0 or empty */
  emptyDash?: boolean;
}

// ============================================================
// Component
// ============================================================

/**
 * Large metric value with a small descriptive label underneath.
 * Used for KPIs, stats, and summary numbers.
 */
export function MetricDisplay({
  value,
  label,
  prefix = '',
  suffix = '',
  isCurrency = false,
  valueVariant = 'headingMd',
  valueTone,
  alignment = 'start',
  emptyDash = false,
}: MetricDisplayProps) {
  const isEmpty = value === 0 || value === '' || value == null;

  let formattedValue: string;
  if (isEmpty && emptyDash) {
    formattedValue = '—';
  } else if (isCurrency && typeof value === 'number') {
    formattedValue = `${prefix}${value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}${suffix}`;
  } else if (typeof value === 'number') {
    formattedValue = `${prefix}${value.toLocaleString()}${suffix}`;
  } else {
    formattedValue = `${prefix}${value}${suffix}`;
  }

  return (
    <BlockStack gap="050" align={alignment}>
      <Text as="p" variant={valueVariant} tone={valueTone}>
        {formattedValue}
      </Text>
      <Text as="p" variant="bodyXs" tone="subdued" fontWeight="medium">
        {label}
      </Text>
    </BlockStack>
  );
}

export default MetricDisplay;
