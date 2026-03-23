import type { ReactNode } from 'react';
import { Card as PolarisCard, Box, BlockStack, InlineStack, Text } from '@shopify/polaris';

export interface CardProps {
  title?: string;
  description?: string;
  id?: string;
  children: ReactNode;
  leftSlot?: ReactNode;
  rightSlot?: ReactNode;
}

export function Card({ title, description, children, id, leftSlot, rightSlot }: CardProps) {
  const titleId = id ? `${id}-title` : undefined;
  const descId = id ? `${id}-desc` : undefined;
  const hasHeader = Boolean(title || description || leftSlot || rightSlot);

  return (
    <PolarisCard>
      {hasHeader && (
        <BlockStack role="group" aria-labelledby={titleId} aria-describedby={descId} gap="050">
          <InlineStack align="space-between" blockAlign="center">
            <InlineStack gap="050" blockAlign="center">
              {title ? (
                <Text as="h3" variant="headingSm" fontWeight="semibold" id={titleId}>
                  {title}
                </Text>
              ) : null}
              {leftSlot ? (
                <div className="pt-1">
                  <Box>{leftSlot}</Box>
                </div>
              ) : null}
            </InlineStack>

            {rightSlot ? <Box>{rightSlot}</Box> : null}
          </InlineStack>

          {description ? (
            <Text as="p" tone="subdued" variant="bodySm" id={descId}>
              {description}
            </Text>
          ) : null}
        </BlockStack>
      )}

      <Box paddingBlockStart={hasHeader ? '200' : '0'}>{children}</Box>
    </PolarisCard>
  );
}
