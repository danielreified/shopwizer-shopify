import { useState } from 'react';
import { BlockStack, Text, Card } from '@shopify/polaris';
import { PolarisFixtureProvider } from '../PolarisFixtureProvider';
import { OnboardingStepItem } from './OnboardingStepItem';

export default function OnboardingStepItemFixture() {
  const [activeStep, setActiveStep] = useState(1);

  return (
    <PolarisFixtureProvider>
      <BlockStack gap="400">
        <Text as="h2" variant="headingMd">
          OnboardingStepItem
        </Text>

        <Card>
          <BlockStack gap="0">
            <OnboardingStepItem
              title="Set storewide preference"
              description="Choose default gender and age settings for your product recommendations."
              isCompleted
              isActive={activeStep === 0}
              primaryAction={{
                label: 'Set preferences',
                onClick: () => setActiveStep(0),
              }}
            />
            <OnboardingStepItem
              title="Sync your product catalog"
              description="Import your products so we can generate relevant recommendations."
              isActive={activeStep === 1}
              primaryAction={{
                label: 'Start sync',
                onClick: () => alert('Start sync'),
              }}
            />
            <OnboardingStepItem
              title="Sync last 90 days of orders"
              description="Import your recent order history for trending and best-seller data."
              isActive={activeStep === 2}
              isLocked={activeStep < 2}
              primaryAction={{
                label: 'Sync orders',
                onClick: () => alert('Sync orders'),
              }}
              secondaryAction={{
                label: 'Skip',
                onClick: () => setActiveStep(3),
              }}
            />
            <OnboardingStepItem
              title="Add theme extension"
              description="Install the theme extension so recommendations appear on your storefront."
              isActive={activeStep === 3}
              isLocked={activeStep < 3}
              primaryAction={{
                label: 'Open theme editor',
                onClick: () => alert('Open editor'),
              }}
              secondaryAction={{
                label: 'Mark as done',
                onClick: () => alert('Done'),
              }}
            />
          </BlockStack>
        </Card>
      </BlockStack>
    </PolarisFixtureProvider>
  );
}
