import React, { type ReactNode } from 'react';
import {
  Modal,
  Box as PolarisBox,
  BlockStack as PolarisBlockStack,
  InlineStack as PolarisInlineStack,
  Text as PolarisText,
  Icon as PolarisIcon,
  TextField as PolarisTextField,
} from '@shopify/polaris';
import { SearchIcon, ArrowLeftIcon, CheckIcon, ChevronRightIcon } from '@shopify/polaris-icons';
import { SelectorModalContext, useSelectorModal } from './context';

const Box = PolarisBox as any;
const BlockStack = PolarisBlockStack as any;
const InlineStack = PolarisInlineStack as any;
const Text = PolarisText as any;
const Icon = PolarisIcon as any;
const TextField = PolarisTextField as any;

// ============================================================
// SelectorModal (Root)
// ============================================================

export interface SelectorModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  size?: 'small' | 'medium' | 'large';
  height?: number;
  loading?: boolean;
  loadingRows?: number;
  children: ReactNode;
}

export function SelectorModal({
  open,
  onClose,
  title,
  size = 'medium',
  height,
  loading = false,
  loadingRows = 5,
  children,
}: SelectorModalProps) {
  return (
    <SelectorModalContext.Provider value={{ loading, loadingRows }}>
      <Modal open={open} onClose={onClose} title={title} size={size as any}>
        <div
          style={{
            height: height ? `${height}px` : undefined,
            maxHeight: height ? undefined : '85vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {children}
        </div>
      </Modal>
    </SelectorModalContext.Provider>
  );
}

// ============================================================
// Header
// ============================================================

SelectorModal.Header = function Header({ children }: { children: ReactNode }) {
  return (
    <Box padding="400" borderBlockEndWidth="025" borderColor="border" background="bg-surface">
      <BlockStack gap="300">{children}</BlockStack>
    </Box>
  );
};

// ============================================================
// Search
// ============================================================

SelectorModal.Search = function Search({
  value,
  onChange,
  placeholder = 'Search...',
  autoFocus = false,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const { loading } = useSelectorModal();

  return (
    <TextField
      label="Search"
      labelHidden
      prefix={<Icon source={SearchIcon as any} />}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      autoComplete="off"
      autoFocus={autoFocus}
      disabled={loading}
    />
  );
};

// ============================================================
// Breadcrumb
// ============================================================

SelectorModal.Breadcrumb = function Breadcrumb({
  items,
  onBack,
}: {
  items: Array<{ label: string; onClick?: () => void }>;
  onBack?: () => void;
}) {
  const { loading } = useSelectorModal();

  if (items.length === 0 && !onBack) return null;

  return (
    <div
      onClick={!loading ? onBack || items[items.length - 1]?.onClick : undefined}
      style={{ cursor: loading ? 'not-allowed' : 'pointer' }}
      className="group flex items-center gap-2 mt-1 text-gray-500 hover:text-gray-900 transition-colors"
    >
      <div className="p-1 -ml-1 rounded-full group-hover:bg-gray-100 transition-colors">
        <Icon source={ArrowLeftIcon as any} tone="subdued" />
      </div>
      <Text variant="bodySm" as="span" tone="subdued">
        {items.map((item, index) => (
          <React.Fragment key={index}>
            {index > 0 && <span className="px-1 text-gray-300">/</span>}
            <span className={index === items.length - 1 ? 'font-semibold text-gray-800' : ''}>
              {item.label}
            </span>
          </React.Fragment>
        ))}
      </Text>
    </div>
  );
};

// ============================================================
// Content
// ============================================================

SelectorModal.Content = function Content({
  children,
  showGradients = true,
}: {
  children: ReactNode;
  showGradients?: boolean;
}) {
  const { loading, loadingRows } = useSelectorModal();

  return (
    <div
      style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {showGradients && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '12px',
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.03), transparent)',
            zIndex: 1,
            pointerEvents: 'none',
          }}
        />
      )}

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px 12px',
          paddingBottom: '16px',
        }}
      >
        {loading ? <SelectorModal.Skeleton count={loadingRows} /> : children}
      </div>

      {showGradients && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '24px',
            background: 'linear-gradient(to top, rgba(0,0,0,0.06), transparent)',
            zIndex: 1,
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
};

// ============================================================
// Row
// ============================================================

export interface SelectorModalRowProps {
  icon?: ReactNode;
  label: string;
  description?: string;
  isLeaf?: boolean;
  isSelected?: boolean;
  disabled?: boolean;
  onClick: () => void;
  trailing?: ReactNode;
}

SelectorModal.Row = function Row({
  icon,
  label,
  description,
  isLeaf = true,
  isSelected,
  disabled,
  onClick,
  trailing,
}: SelectorModalRowProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        cursor: disabled ? 'not-allowed' : 'pointer',
        padding: '10px 16px',
        borderRadius: '8px',
        transition: 'all 0.15s ease-in-out',
        display: 'block',
        width: '100%',
        background: 'none',
        border: 'none',
        textAlign: 'left',
        marginBottom: '2px',
        opacity: disabled ? 0.6 : 1,
      }}
      className="group hover:bg-gray-50 border border-transparent hover:border-gray-200"
    >
      <InlineStack align="space-between" blockAlign="center" gap="300">
        <InlineStack gap="200" blockAlign="center">
          {icon && (
            <div
              style={{
                width: '32px',
                height: '32px',
                backgroundColor: 'var(--p-color-bg-surface)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--p-color-border-subdued)',
                boxShadow: 'var(--p-shadow-100)',
                flexShrink: 0,
              }}
              className="group-hover:border-[var(--p-color-border)]"
            >
              {icon}
            </div>
          )}
          <BlockStack gap="0">
            <Text variant="bodyMd" fontWeight="semibold" as="span">
              {label}
            </Text>
            {description && (
              <Text variant="bodySm" tone="subdued" as="p">
                {description}
              </Text>
            )}
          </BlockStack>
        </InlineStack>

        <InlineStack gap="200" blockAlign="center">
          {trailing}
          {isLeaf ? (
            isSelected && <Icon source={CheckIcon as any} tone="success" />
          ) : (
            <Icon source={ChevronRightIcon as any} tone="subdued" />
          )}
        </InlineStack>
      </InlineStack>
    </button>
  );
};

// ============================================================
// Skeleton
// ============================================================

SelectorModal.Skeleton = function Skeleton({ count = 5 }: { count?: number }) {
  return (
    <BlockStack gap="100">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between px-5 py-4 mb-1 border border-transparent rounded-xl"
        >
          <div className="flex items-center gap-4 w-full animate-pulse">
            <div className="w-10 h-10 bg-gray-100 rounded-[10px] shrink-0" />
            <div className="flex flex-col gap-1.5">
              <div className="w-48 h-4 bg-gray-100 rounded" />
              <div className="w-32 h-3.5 bg-gray-50 rounded" />
            </div>
          </div>
        </div>
      ))}
    </BlockStack>
  );
};

// ============================================================
// Empty
// ============================================================

SelectorModal.Empty = function Empty({
  show,
  message = 'No items found',
  icon,
}: {
  show: boolean;
  message?: string;
  icon?: ReactNode;
}) {
  if (!show) return null;

  return (
    <Box padding="800">
      <BlockStack align="center" gap="400">
        {icon}
        <Text tone="subdued" as="p">
          {message}
        </Text>
      </BlockStack>
    </Box>
  );
};

// ============================================================
// Footer
// ============================================================

SelectorModal.Footer = function Footer({ children }: { children: ReactNode }) {
  return (
    <Box padding="400" borderBlockStartWidth="025" borderColor="border">
      <InlineStack align="end" gap="200">
        {children}
      </InlineStack>
    </Box>
  );
};

export default SelectorModal;
