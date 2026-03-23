import React from 'react';
import { Icon } from '@shopify/polaris';

// ============================================================
// Types
// ============================================================

export interface IconBoxProps {
  /** Polaris icon (object) or Lucide icon (function component) */
  icon: any;
  /** Width/height in px */
  size?: number;
  /** Inner icon size in px */
  iconSize?: number;
  /** Solid background color or Polaris token */
  backgroundColor?: string;
  /** Gradient – overrides backgroundColor when provided */
  gradient?: { from: string; to: string };
  /** Icon color (CSS value) */
  iconColor?: string;
  /** Border radius in px */
  borderRadius?: number;
  /** Optional box-shadow */
  shadow?: string;
  className?: string;
  style?: React.CSSProperties;
}

// ============================================================
// Component
// ============================================================

/**
 * Rounded container with an icon inside.
 * Supports both Polaris icons and Lucide React icons.
 */
export function IconBox({
  icon,
  size = 40,
  iconSize = 20,
  backgroundColor = 'var(--p-color-bg-surface-secondary)',
  gradient,
  iconColor = 'var(--p-color-icon-subdued)',
  borderRadius = 10,
  shadow,
  className,
  style,
}: IconBoxProps) {
  const bg = gradient
    ? `linear-gradient(135deg, ${gradient.from} 0%, ${gradient.to} 100%)`
    : backgroundColor;

  const boxShadow = shadow ?? (gradient ? `0 2px 8px ${gradient.from}4D` : undefined);

  return (
    <div
      className={className}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: `${borderRadius}px`,
        background: bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxShadow,
        color: iconColor,
        ...style,
      }}
    >
      {typeof icon === 'function' ? (
        React.createElement(icon, { size: iconSize, color: iconColor })
      ) : (
        <div style={{ width: `${iconSize}px`, height: `${iconSize}px` }}>
          <Icon source={icon} tone="base" />
        </div>
      )}
    </div>
  );
}

export default IconBox;

// ============================================================
// Icon type utilities
// ============================================================

/** Cast any value to a Polaris icon source type */
export type PolarisIconSource = Parameters<typeof Icon>[0]['source'];

export const asPolarisIcon = (icon: unknown) => icon as PolarisIconSource;

export const asLucideIcon = <T extends unknown>(icon: T): T => icon;
