import { useId } from 'react';
import type { ReactNode } from 'react';

import { Box, BlockStack, Button, InlineGrid, InlineStack, Text } from '@shopify/polaris';

export interface ActionCardProps {
  title: string;
  body: ReactNode;
  imageSrc: string;
  imageAlt?: string;
  ctaLabel: string;
  onCta?: () => void;
  url?: string;
}

export function ActionCard({
  title,
  body,
  imageSrc,
  imageAlt = '',
  ctaLabel,
  onCta,
  url,
}: ActionCardProps) {
  const headingId = useId();

  return (
    <Box background="bg-surface" border="base" borderRadius="300" shadow="100" padding="0">
      <Box paddingInlineStart="600" paddingInlineEnd="600" paddingBlock="200">
        <InlineGrid columns={{ xs: '130px 1fr' }} gap="100" alignItems="center">
          <img
            src={imageSrc}
            alt={imageAlt}
            width={90}
            height={104}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
            }}
            loading="lazy"
            decoding="async"
          />

          <Box padding="200" display="grid">
            <BlockStack align="space-between" gap="200">
              <BlockStack gap="200">
                <InlineStack align="space-between" wrap>
                  <Text as="h2" variant="headingSm" id={headingId}>
                    {title}
                  </Text>
                </InlineStack>

                <Text as="span" variant="bodyMd">
                  {body}
                </Text>
              </BlockStack>

              <Box>
                <Button variant="primary" onClick={url ? undefined : onCta} url={url}>
                  {ctaLabel}
                </Button>
              </Box>
            </BlockStack>
          </Box>
        </InlineGrid>
      </Box>
    </Box>
  );
}
