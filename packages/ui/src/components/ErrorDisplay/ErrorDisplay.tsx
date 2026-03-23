import type { ReactNode } from 'react';
import { Banner, BlockStack, Text, Button } from '@shopify/polaris';

// ============================================================
// Types
// ============================================================

export interface ErrorDisplayProps {
  /** Error title shown in the banner */
  title?: string;
  /** Error message / description */
  message?: string;
  /** HTTP status code — used for default messaging */
  statusCode?: number;
  /** Status text (e.g., "Not Found") */
  statusText?: string;
  /** Callback when "Reload page" is clicked. Defaults to window.location.reload() */
  onReload?: () => void;
  /** Hide the reload button */
  hideReload?: boolean;
  /** Additional content below the banner */
  children?: ReactNode;
}

// ============================================================
// Component
// ============================================================

/**
 * Generic error display with a Polaris Banner.
 * Framework-agnostic — accepts error details as props.
 */
export function ErrorDisplay({
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  statusCode,
  statusText,
  onReload,
  hideReload = false,
  children,
}: ErrorDisplayProps) {
  const displayTitle = statusCode ? `${statusCode} ${statusText || 'Error'}` : title;

  const displayMessage =
    statusCode && !message ? 'The requested page could not be loaded.' : message;

  const handleReload = onReload ?? (() => window.location.reload());

  return (
    <BlockStack gap="400">
      <Banner title={displayTitle} tone="critical">
        <p>{displayMessage}</p>
      </Banner>
      {!hideReload && <Button onClick={handleReload}>Reload page</Button>}
      {children}
    </BlockStack>
  );
}

export default ErrorDisplay;
