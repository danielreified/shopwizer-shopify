import { Card, Text, Badge, Button, Box, BlockStack, InlineStack, Image } from '@shopify/polaris';

export type FeatureCardProps = {
  title: string;
  tag?: string;
  description: string;
  imageSrc: string;
  imageAlt?: string;
  ctaLabel?: string;
  onCta?: () => void;
  ctaUrl?: string;
  badgeTone?: 'subdued' | 'info' | 'success' | 'critical' | 'attention';
  aspectRatio?: `${number}/${number}`;
};

export function FeatureCard({
  title,
  tag,
  description,
  imageSrc,
  imageAlt,
  ctaLabel = 'Try now',
  onCta,
  ctaUrl,
  badgeTone = 'subdued',
  aspectRatio = '16/9',
}: FeatureCardProps) {
  return (
    <Card roundedAbove="sm">
      {/* Image */}
      <Box padding="0" overflow="hidden" borderRadius="300">
        <Image
          source={imageSrc}
          alt={imageAlt ?? title}
          style={{
            borderRadius: 8,
            width: '100%',
            display: 'block',
            aspectRatio,
            objectFit: 'cover',
          }}
        />
      </Box>

      <Box padding="400">
        <BlockStack gap="200">
          <InlineStack gap="200" align="start" blockAlign="center">
            <Text as="h3" variant="headingMd">
              {title}
            </Text>
            {tag ? (
              <Badge tone={badgeTone} size="medium">
                {tag}
              </Badge>
            ) : null}
          </InlineStack>

          <Text as="p" variant="bodyMd">
            {description}
          </Text>
          <div>
            <Button variant="primary" onClick={ctaUrl ? undefined : onCta} url={ctaUrl}>
              {ctaLabel}
            </Button>
          </div>
        </BlockStack>
      </Box>
    </Card>
  );
}
