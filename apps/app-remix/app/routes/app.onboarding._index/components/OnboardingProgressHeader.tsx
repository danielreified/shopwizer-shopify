import { BlockStack, InlineStack, Text } from "@shopify/polaris";
import { CircleProgress } from "@repo/ui";

interface OnboardingProgressHeaderProps {
  progress: number;
  step: number;
  totalSteps: number;
}

export function OnboardingProgressHeader({
  progress,
  step,
  totalSteps,
}: OnboardingProgressHeaderProps) {
  return (
    <BlockStack gap="400">
      <InlineStack gap="300" blockAlign="center">
        <CircleProgress progress={progress} size={28} />
        <Text as="span" variant="bodySm" tone="subdued" fontWeight="medium">
          Step {step} of {totalSteps}
        </Text>
      </InlineStack>
      <BlockStack gap="100">
        <Text as="h2" variant="headingLg">
          Set up product recommendations
        </Text>
        <Text as="p" tone="subdued" variant="bodyMd">
          Complete these steps to begin showing smart recommendations.
        </Text>
      </BlockStack>
    </BlockStack>
  );
}
