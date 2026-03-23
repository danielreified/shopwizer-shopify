import { Card, BlockStack, Button, Icon, Text } from '@shopify/polaris';
import { ExternalIcon } from '@shopify/polaris-icons';

type SimpleCardProps = {
  title: string;
  description: string;
  href: string;
  actionLabel?: string;
};

export function SimpleCard({
  title,
  description,
  href,
  actionLabel = 'Read Docs',
}: SimpleCardProps) {
  return (
    <Card roundedAbove="sm" background="bg-surface-secondary">
      <BlockStack gap="400">
        <BlockStack gap="100">
          <Text as="h3" variant="headingMd" fontWeight="semibold">
            {title}
          </Text>
          <Text as="p" variant="bodyMd">
            {description}
          </Text>
        </BlockStack>
        <div>
          <Button
            url={href}
            target="_blank"
            rel="noopener noreferrer"
            variant="secondary"
            icon={<Icon source={ExternalIcon} />}
          >
            {actionLabel}
          </Button>
        </div>
      </BlockStack>
    </Card>
  );
}

export default SimpleCard;
