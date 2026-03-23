import React, { type ReactNode } from 'react';
import { InlineStack, Text, Icon } from '@shopify/polaris';
import { ChevronRightIcon } from '@shopify/polaris-icons';

// ============================================================
// Types
// ============================================================

export interface SelectableRowProps {
  /** Primary label text */
  label: string;
  /** Secondary description text */
  description?: string;
  /** Left icon — Polaris icon (object) or Lucide icon (function) */
  icon?: any;
  /** Icon background color or Polaris token */
  iconBgColor?: string;
  /** Icon gradient — overrides iconBgColor */
  iconGradient?: { from: string; to: string };
  /** Icon color */
  iconColor?: string;
  /** Icon container size in px */
  iconSize?: number;
  /** Badge or other content to display next to the label */
  badge?: ReactNode;
  /** Content rendered on the right side (before the chevron) */
  rightSlot?: ReactNode;
  /** Whether to show a disclosure chevron on the right */
  disclosure?: boolean;
  /** Whether this row is currently selected */
  selected?: boolean;
  /** Whether the row is disabled */
  disabled?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Bottom border */
  bordered?: boolean;
}

// ============================================================
// Component
// ============================================================

/**
 * Clickable row with icon, label, description, and optional disclosure chevron.
 * Used in sidebars, lists, and selection panels.
 */
export function SelectableRow({
  label,
  description,
  icon,
  iconBgColor = 'var(--p-color-bg-surface-secondary)',
  iconGradient,
  iconColor = 'var(--p-color-icon-subdued)',
  iconSize = 36,
  badge,
  rightSlot,
  disclosure = true,
  selected = false,
  disabled = false,
  onClick,
  bordered = true,
}: SelectableRowProps) {
  const isClickable = !disabled && !!onClick;

  const bg = iconGradient
    ? `linear-gradient(135deg, ${iconGradient.from} 0%, ${iconGradient.to} 100%)`
    : iconBgColor;

  return (
    <div
      onClick={isClickable ? onClick : undefined}
      style={{
        padding: '12px 16px',
        cursor: isClickable ? 'pointer' : 'default',
        transition: 'background-color 0.15s ease',
        borderBottom: bordered ? '1px solid var(--p-color-border-subdued)' : 'none',
        opacity: disabled ? 0.4 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
        backgroundColor: selected ? 'var(--p-color-bg-surface-secondary)' : 'transparent',
      }}
      className={isClickable && !selected ? 'hover:bg-gray-50 group' : ''}
    >
      <InlineStack gap="300" align="space-between" blockAlign="center">
        <InlineStack gap="300" blockAlign="center" wrap={false}>
          {icon && (
            <div
              style={{
                width: `${iconSize}px`,
                height: `${iconSize}px`,
                borderRadius: '10px',
                background: bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: iconGradient ? `0 2px 8px ${iconGradient.from}4D` : undefined,
              }}
            >
              {typeof icon === 'function' ? (
                React.createElement(icon, {
                  size: iconSize * 0.5,
                  color: iconColor,
                })
              ) : (
                <div
                  style={{
                    width: `${iconSize * 0.5}px`,
                    height: `${iconSize * 0.5}px`,
                    color: iconColor,
                  }}
                >
                  <Icon source={icon} tone="base" />
                </div>
              )}
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <InlineStack gap="150" blockAlign="center">
              <Text as="span" variant="bodyMd" fontWeight="bold">
                {label}
              </Text>
              {badge}
            </InlineStack>
            {description && (
              <Text as="span" variant="bodySm" tone="subdued" truncate>
                {description}
              </Text>
            )}
          </div>
        </InlineStack>

        <InlineStack gap="200" blockAlign="center" wrap={false}>
          {rightSlot}
          {disclosure && isClickable && (
            <div
              style={{
                width: '16px',
                height: '16px',
                opacity: 0.3,
                flexShrink: 0,
              }}
              className="group-hover:translate-x-0.5 transition-transform"
            >
              <Icon source={ChevronRightIcon} tone="subdued" />
            </div>
          )}
        </InlineStack>
      </InlineStack>
    </div>
  );
}

export default SelectableRow;
