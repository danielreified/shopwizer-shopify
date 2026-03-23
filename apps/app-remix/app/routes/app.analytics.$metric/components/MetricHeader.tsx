import { Button, InlineStack, Text } from "@shopify/polaris";
import { ArrowLeftIcon } from "@shopify/polaris-icons";

interface MetricHeaderProps {
  title: string;
  onBack: () => void;
}

export function MetricHeader({ title, onBack }: MetricHeaderProps) {
  return (
    <InlineStack gap="300" wrap={false}>
      <Button icon={ArrowLeftIcon} variant="tertiary" onClick={onBack} />
      <Text variant="headingLg">{title}</Text>
    </InlineStack>
  );
}
