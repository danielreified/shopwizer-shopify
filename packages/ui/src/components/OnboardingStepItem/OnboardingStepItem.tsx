import React, { type ReactNode } from 'react';
import { Box, BlockStack, InlineStack, Icon, Text, Button, Collapsible } from '@shopify/polaris';
import { CheckCircleIcon } from '@shopify/polaris-icons';
import { CircleDashed } from 'lucide-react';

// ============================================================
// Types
// ============================================================

export interface OnboardingStepItemProps {
  /** Step title */
  title: string;
  /** Step description shown when active */
  description?: string;
  /** Additional content rendered inside the collapsible area */
  content?: ReactNode;
  /** Whether this step is completed */
  isCompleted?: boolean;
  /** Whether this step is currently expanded */
  isActive?: boolean;
  /** Whether this step is locked (dimmed, non-interactive) */
  isLocked?: boolean;
  /** Primary action button */
  primaryAction?: { label: string; onClick: () => void; loading?: boolean };
  /** Secondary action button */
  secondaryAction?: { label: string; onClick: () => void; loading?: boolean };
  /** Media content shown on the right side */
  media?: ReactNode;
}

// ============================================================
// Component
// ============================================================

const IconCircleDashed = CircleDashed as any;

/**
 * Collapsible onboarding wizard step with status indicator,
 * title, description, action buttons, and optional media.
 */
export function OnboardingStepItem({
  title,
  description,
  content,
  isCompleted,
  isActive,
  isLocked,
  primaryAction,
  secondaryAction,
  media,
}: OnboardingStepItemProps) {
  return (
    <div
      style={{
        opacity: isLocked ? 0.5 : 1,
        pointerEvents: isLocked ? 'none' : 'auto',
      }}
    >
      <Box padding="300">
        <BlockStack gap="400">
          <InlineStack gap="300" blockAlign="center" align="start">
            <div
              style={{
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isCompleted ? (
                <Icon source={CheckCircleIcon as any} tone="success" />
              ) : (
                <div
                  style={{
                    color: 'var(--p-color-icon-subdued)',
                    display: 'flex',
                  }}
                >
                  <IconCircleDashed size={20} />
                </div>
              )}
            </div>
            <Text as="span" variant="bodyMd" fontWeight={isActive ? 'bold' : 'regular'}>
              {title}
            </Text>
          </InlineStack>

          <Collapsible open={isActive || false} id={title}>
            <div
              style={{
                padding: '24px',
                backgroundColor: 'var(--p-color-bg-surface-secondary)',
                borderRadius: '12px',
              }}
            >
              <InlineStack gap="600" align="space-between" blockAlign="start">
                <Box minWidth="0" maxWidth={media ? '60%' : '100%'}>
                  <BlockStack gap="400">
                    {description && (
                      <Text as="p" tone="subdued">
                        {description}
                      </Text>
                    )}
                    {content}
                    <InlineStack gap="200">
                      {primaryAction && (
                        <Button
                          variant="primary"
                          onClick={primaryAction.onClick}
                          loading={primaryAction.loading}
                        >
                          {primaryAction.label}
                        </Button>
                      )}
                      {secondaryAction && (
                        <Button onClick={secondaryAction.onClick} loading={secondaryAction.loading}>
                          {secondaryAction.label}
                        </Button>
                      )}
                    </InlineStack>
                  </BlockStack>
                </Box>
                {media && (
                  <div
                    style={{
                      flex: 1,
                      display: 'flex',
                      justifyContent: 'flex-end',
                      minWidth: '140px',
                    }}
                  >
                    {media}
                  </div>
                )}
              </InlineStack>
            </div>
          </Collapsible>
        </BlockStack>
      </Box>
    </div>
  );
}

export default OnboardingStepItem;
