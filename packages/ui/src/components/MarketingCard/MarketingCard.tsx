import { Card, Box, InlineStack, BlockStack, Text, Button } from '@shopify/polaris';

export interface MarketingCardProps {
  title: string;
  description: string;
  ctaLabel: string;
  onCta: () => void;
  imageSrc: string;
  imageAlt?: string;
  textMaxWidth?: number | string;
  contentMaxWidth?: number | string;
}

export function MarketingCard({
  title,
  description,
  ctaLabel,
  onCta,
  imageSrc,
  imageAlt = '',
  textMaxWidth = '34rem',
  contentMaxWidth = '64rem',
}: MarketingCardProps) {
  return (
    <Card>
      <Box padding="400">
        <Box paddingInlineStart="600" paddingInlineEnd="800" paddingBlock="400">
          <BlockStack gap="200">
            <InlineStack align="space-between" blockAlign="center" gap="1000" wrap={false}>
              <Box maxWidth={contentMaxWidth} width="100%">
                <BlockStack gap="100">
                  <Text as="h2" variant="headingMd" fontWeight="semibold">
                    {title}
                  </Text>

                  <Box maxWidth={textMaxWidth} width="100%">
                    <Text as="p" variant="bodySm">
                      {description}
                    </Text>
                  </Box>

                  <Box paddingBlockStart="400">
                    <InlineStack align="start" gap="300">
                      <Button onClick={onCta} variant="secondary" size="medium">
                        {ctaLabel}
                      </Button>
                    </InlineStack>
                  </Box>
                </BlockStack>
              </Box>

              <Box
                as="img"
                src={imageSrc}
                alt={imageAlt}
                style={{ maxWidth: 320, height: 'auto' }}
              />
            </InlineStack>
          </BlockStack>
        </Box>
      </Box>
    </Card>
  );
}
