import React, { type ReactNode } from 'react';
import { SelectorModal } from './SelectorModal';

// ============================================================
// Types
// ============================================================

interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

export interface SelectorModalLayoutProps {
  open: boolean;
  onClose: () => void;
  title: string;
  size?: 'small' | 'medium' | 'large';
  height?: number;
  loading?: boolean;
  loadingRows?: number;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  searchAutoFocus?: boolean;
  breadcrumbs?: BreadcrumbItem[];
  onBack?: () => void;
  emptyMessage?: string;
  isEmpty?: boolean;
  showGradients?: boolean;
  footer?: ReactNode;
  children: ReactNode;
}

// ============================================================
// Component
// ============================================================

/**
 * Pre-composed SelectorModal with search, breadcrumbs, content, empty state, and footer.
 * Use SelectorModal directly for custom layouts.
 */
export function SelectorModalLayout({
  open,
  onClose,
  title,
  size,
  height,
  loading,
  loadingRows,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  searchAutoFocus,
  breadcrumbs,
  onBack,
  emptyMessage,
  isEmpty,
  showGradients = true,
  footer,
  children,
}: SelectorModalLayoutProps) {
  const hasSearch = typeof onSearchChange === 'function';
  const hasBreadcrumbs = Boolean(breadcrumbs && breadcrumbs.length > 0);
  const shouldRenderHeader = hasSearch || hasBreadcrumbs;

  return (
    <SelectorModal
      open={open}
      onClose={onClose}
      title={title}
      size={size}
      height={height}
      loading={loading}
      loadingRows={loadingRows}
    >
      {shouldRenderHeader ? (
        <SelectorModal.Header>
          {hasSearch ? (
            <SelectorModal.Search
              value={searchValue ?? ''}
              onChange={onSearchChange!}
              placeholder={searchPlaceholder}
              autoFocus={searchAutoFocus}
            />
          ) : null}
          {hasBreadcrumbs ? (
            <SelectorModal.Breadcrumb items={breadcrumbs!} onBack={onBack} />
          ) : null}
        </SelectorModal.Header>
      ) : null}

      <SelectorModal.Content showGradients={showGradients}>
        {children}
        {emptyMessage ? (
          <SelectorModal.Empty show={Boolean(isEmpty)} message={emptyMessage} />
        ) : null}
      </SelectorModal.Content>

      {footer ? <SelectorModal.Footer>{footer}</SelectorModal.Footer> : null}
    </SelectorModal>
  );
}

export default SelectorModalLayout;
