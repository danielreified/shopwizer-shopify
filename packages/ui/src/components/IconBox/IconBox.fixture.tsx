import { BlockStack, Text, InlineStack, Card } from '@shopify/polaris';
import { PolarisFixtureProvider } from '../PolarisFixtureProvider';
import { IconBox } from './IconBox';
import { StarFilledIcon, HomeFilledIcon } from '@shopify/polaris-icons';
import { Zap, TrendingUp, Copy } from 'lucide-react';

export default function IconBoxFixture() {
  return (
    <PolarisFixtureProvider>
      <BlockStack gap="400">
        <Text as="h2" variant="headingMd">
          IconBox
        </Text>

        <Card>
          <BlockStack gap="300">
            <Text as="h3" variant="headingSm">
              Solid backgrounds
            </Text>
            <InlineStack gap="300">
              <IconBox icon={StarFilledIcon} />
              <IconBox
                icon={Zap}
                backgroundColor="var(--p-color-bg-fill-inverse)"
                iconColor="var(--p-color-text-inverse)"
              />
              <IconBox icon={HomeFilledIcon} size={48} iconSize={24} />
            </InlineStack>
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="300">
            <Text as="h3" variant="headingSm">
              Gradients
            </Text>
            <InlineStack gap="300">
              <IconBox
                icon={TrendingUp}
                gradient={{ from: '#10b981', to: '#14b8a6' }}
                iconColor="white"
              />
              <IconBox
                icon={Copy}
                gradient={{ from: '#6366f1', to: '#8b5cf6' }}
                iconColor="white"
                size={36}
                iconSize={18}
              />
              <IconBox
                icon={Zap}
                gradient={{ from: '#3b82f6', to: '#06b6d4' }}
                iconColor="white"
                size={64}
                iconSize={28}
                borderRadius={16}
              />
            </InlineStack>
          </BlockStack>
        </Card>
      </BlockStack>
    </PolarisFixtureProvider>
  );
}
