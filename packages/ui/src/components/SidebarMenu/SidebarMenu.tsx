import React, { type ReactNode } from 'react';
import {
  Text as PolarisText,
  InlineStack as PolarisInlineStack,
  BlockStack as PolarisBlockStack,
  Icon as PolarisIcon,
  Box as PolarisBox,
  Divider as PolarisDivider,
} from '@shopify/polaris';

const Text = PolarisText as any;
const InlineStack = PolarisInlineStack as any;
const BlockStack = PolarisBlockStack as any;
const Icon = PolarisIcon as any;
const Box = PolarisBox as any;
const Divider = PolarisDivider as any;

// ============================================================
// Helpers
// ============================================================

function renderIcon(icon: any, size: number, selected: boolean, tone: string) {
  if (!icon) return null;

  // Polaris icon object ({body: "..."})
  if (typeof icon === 'object' && icon !== null && 'body' in icon) {
    return (
      <Icon
        source={icon}
        tone={
          tone === 'critical'
            ? 'critical'
            : tone === 'success'
              ? 'success'
              : tone === 'info'
                ? 'info'
                : tone === 'subdued'
                  ? 'subdued'
                  : undefined
        }
      />
    );
  }

  // React Element (already instantiated)
  if (React.isValidElement(icon)) return icon;

  // React Component (Functional, Class, or ForwardRef like Lucide)
  const isComponent =
    typeof icon === 'function' ||
    (typeof icon === 'object' && icon !== null && (icon as any).$$typeof);
  if (isComponent) {
    const IconComponent = icon as any;
    return <IconComponent size={size} strokeWidth={selected ? 2.5 : 2} />;
  }

  return null;
}

// ============================================================
// SidebarHeader
// ============================================================

export interface SidebarHeaderProps {
  title: string;
  subtitle?: string;
  rightSlot?: ReactNode;
  variant?: 'default' | 'bold' | 'subdued';
  uppercase?: boolean;
}

export function SidebarHeader({
  title,
  subtitle,
  rightSlot,
  variant = 'bold',
  uppercase = false,
}: SidebarHeaderProps) {
  return (
    <Box
      paddingBlockStart="200"
      paddingBlockEnd="100"
      paddingInlineStart="300"
      paddingInlineEnd="300"
    >
      <BlockStack gap="100">
        <InlineStack align="space-between" blockAlign="center">
          <Text
            variant={variant === 'subdued' ? 'headingXs' : 'headingSm'}
            as="h3"
            fontWeight={variant === 'subdued' ? 'medium' : 'bold'}
            tone={variant === 'subdued' ? 'subdued' : undefined}
          >
            {uppercase ? title.toUpperCase() : title}
          </Text>
          {rightSlot}
        </InlineStack>
        {subtitle && (
          <Text variant="bodyXs" tone="subdued" as="p">
            {subtitle}
          </Text>
        )}
      </BlockStack>
    </Box>
  );
}

// ============================================================
// SidebarItem
// ============================================================

export interface SidebarItemProps {
  label: string;
  description?: string;
  icon?: any; // Polaris or Lucide icon
  selected?: boolean;
  disabled?: boolean;
  clickable?: boolean;
  onClick?: () => void;
  url?: string;
  /** Render prop for custom link wrapper (e.g. react-router Link). Receives { to, children }. */
  renderLink?: (props: { to: string; children: ReactNode }) => ReactNode;
  tone?: 'default' | 'critical' | 'success' | 'subdued' | 'info';
  badge?: ReactNode;
  rightSlot?: ReactNode;
  style?: React.CSSProperties;
}

export function SidebarItem({
  label,
  description,
  icon,
  selected = false,
  disabled = false,
  clickable = true,
  onClick,
  url,
  renderLink,
  tone = 'default',
  badge,
  rightSlot,
  style,
}: SidebarItemProps) {
  const isActuallyClickable = clickable && !disabled && (onClick || url);

  const content = (
    <div
      onClick={isActuallyClickable ? onClick : undefined}
      style={{
        padding: '10px 12px',
        borderRadius: '10px',
        cursor: isActuallyClickable ? 'pointer' : 'default',
        backgroundColor: selected ? 'var(--p-color-bg-surface-secondary)' : 'transparent',
        transition: 'all 0.2s cubic-bezier(0.2, 0, 0, 1)',
        opacity: disabled ? 0.4 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
        width: '100%',
        ...style,
      }}
      className={isActuallyClickable && !selected ? 'hover:bg-gray-50' : ''}
    >
      <InlineStack gap="300" blockAlign="center" wrap={false}>
        {icon && (
          <div
            style={{
              width: '20px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color:
                tone === 'critical'
                  ? 'var(--p-color-text-critical)'
                  : tone === 'success'
                    ? 'var(--p-color-text-success)'
                    : tone === 'info'
                      ? 'var(--p-color-text-info)'
                      : tone === 'subdued'
                        ? 'var(--p-color-text-subdued)'
                        : selected
                          ? 'var(--p-color-text)'
                          : 'var(--p-color-icon)',
              flexShrink: 0,
            }}
          >
            {renderIcon(icon, 18, selected, tone)}
          </div>
        )}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1px',
            flex: 1,
            minWidth: 0,
          }}
        >
          <InlineStack gap="150" blockAlign="center">
            <Text
              as="span"
              variant="bodySm"
              fontWeight="bold"
              tone={
                tone === 'critical'
                  ? 'critical'
                  : tone === 'success'
                    ? 'success'
                    : tone === 'subdued'
                      ? 'subdued'
                      : undefined
              }
            >
              {label}
            </Text>
            {badge}
          </InlineStack>
          {description && (
            <Text as="span" variant="bodyXs" tone="subdued" truncate>
              {description}
            </Text>
          )}
        </div>
        {rightSlot}
      </InlineStack>
    </div>
  );

  if (url && !disabled) {
    if (renderLink) {
      return renderLink({ to: url, children: content });
    }
    return (
      <a
        href={url}
        style={{
          textDecoration: 'none',
          color: 'inherit',
          display: 'block',
          width: '100%',
        }}
      >
        {content}
      </a>
    );
  }

  return content;
}

// ============================================================
// SidebarCard
// ============================================================

export interface SidebarCardProps {
  children?: ReactNode;
  icon?: any; // Polaris or Lucide icon
  iconTone?: 'info' | 'success' | 'critical' | 'subdued';
  title?: string;
  value?: string;
  onClick?: () => void;
  blockAlign?: 'start' | 'center' | 'baseline' | 'end';
}

export function SidebarCard({
  children,
  icon,
  iconTone = 'info',
  title,
  value,
  onClick,
  blockAlign = 'start',
}: SidebarCardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '12px',
        backgroundColor: 'var(--p-color-bg-surface-secondary)',
        borderRadius: '12px',
        cursor: onClick ? 'pointer' : 'default',
        width: '100%',
      }}
    >
      <InlineStack gap="300" blockAlign={blockAlign} wrap={false}>
        {icon && (
          <Box
            background={
              iconTone === 'info'
                ? 'bg-fill-info-secondary'
                : iconTone === 'success'
                  ? 'bg-fill-success-secondary'
                  : 'bg-fill-secondary'
            }
            padding="150"
            borderRadius="200"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <div
              style={{
                color: `var(--p-color-icon-${iconTone})`,
                display: 'flex',
              }}
            >
              {renderIcon(icon, 20, false, iconTone)}
            </div>
          </Box>
        )}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1px',
            flex: 1,
          }}
        >
          {title && (
            <Text variant="bodyXs" tone="subdued" as="p">
              {title}
            </Text>
          )}
          {value && (
            <Text variant="bodySm" fontWeight="bold" as="p">
              {value}
            </Text>
          )}
          {children}
        </div>
      </InlineStack>
    </div>
  );
}

// ============================================================
// SidebarGroup
// ============================================================

export interface SidebarGroupProps {
  children?: ReactNode;
  title?: string;
  subtitle?: string;
  rightSlot?: ReactNode;
  variant?: 'bold' | 'subdued';
  uppercase?: boolean;
  noDivider?: boolean;
}

export function SidebarGroup({
  children,
  title,
  subtitle,
  rightSlot,
  variant = 'subdued',
  uppercase = true,
  noDivider = false,
}: SidebarGroupProps) {
  return (
    <Box paddingBlockEnd="200">
      <BlockStack gap="200">
        {title && (
          <SidebarHeader
            title={title}
            subtitle={subtitle}
            rightSlot={rightSlot}
            variant={variant}
            uppercase={uppercase}
          />
        )}
        <Box paddingInlineStart="200" paddingInlineEnd="200">
          <BlockStack gap="100">{children}</BlockStack>
        </Box>
        {!noDivider && (
          <Box paddingBlockStart="200">
            <Divider />
          </Box>
        )}
      </BlockStack>
    </Box>
  );
}

// ============================================================
// SidebarDivider
// ============================================================

export function SidebarDivider() {
  return (
    <Box paddingBlock="100">
      <Divider />
    </Box>
  );
}
