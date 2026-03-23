import { useState } from 'react';
import { BlockStack, Text, Card, Badge } from '@shopify/polaris';
import { HomeFilledIcon, OrderFilledIcon } from '@shopify/polaris-icons';
import { Zap, TrendingUp, Copy, Star } from 'lucide-react';
import { PolarisFixtureProvider } from '../PolarisFixtureProvider';
import { SelectableRow } from './SelectableRow';

export default function SelectableRowFixture() {
  const [selected, setSelected] = useState<string | null>('analytics');

  return (
    <PolarisFixtureProvider>
      <BlockStack gap="400">
        <Text as="h2" variant="headingMd">
          SelectableRow
        </Text>

        <Card>
          <BlockStack gap="0">
            <Text as="h3" variant="headingSm">
              Navigation list (Polaris icons)
            </Text>
            {[
              { id: 'home', label: 'Dashboard', icon: HomeFilledIcon },
              { id: 'orders', label: 'Orders', icon: OrderFilledIcon },
              {
                id: 'analytics',
                label: 'Analytics',
                icon: HomeFilledIcon,
                description: 'View store performance',
              },
            ].map((item) => (
              <SelectableRow
                key={item.id}
                label={item.label}
                description={item.description}
                icon={item.icon}
                selected={selected === item.id}
                onClick={() => setSelected(item.id)}
              />
            ))}
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="0">
            <Text as="h3" variant="headingSm">
              Feature list (Lucide icons with gradients)
            </Text>
            <SelectableRow
              label="Similar Products"
              description="Visually or semantically similar items"
              icon={Copy}
              iconGradient={{ from: '#6366f1', to: '#8b5cf6' }}
              iconColor="white"
              onClick={() => {}}
              badge={<Badge tone="success">Active</Badge>}
            />
            <SelectableRow
              label="Trending"
              description="Currently trending based on engagement"
              icon={TrendingUp}
              iconGradient={{ from: '#10b981', to: '#14b8a6' }}
              iconColor="white"
              onClick={() => {}}
            />
            <SelectableRow
              label="Best Sellers"
              description="Top performing products"
              icon={Star}
              iconGradient={{ from: '#f59e0b', to: '#f97316' }}
              iconColor="white"
              onClick={() => {}}
              rightSlot={
                <Text as="span" variant="bodySm" tone="subdued">
                  24 products
                </Text>
              }
            />
            <SelectableRow
              label="New Arrivals"
              description="Newest products in category"
              icon={Zap}
              iconGradient={{ from: '#3b82f6', to: '#06b6d4' }}
              iconColor="white"
              onClick={() => {}}
              bordered={false}
            />
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="0">
            <Text as="h3" variant="headingSm">
              Disabled state
            </Text>
            <SelectableRow
              label="Locked feature"
              description="Upgrade to access this feature"
              icon={Zap}
              disabled
              onClick={() => {}}
            />
          </BlockStack>
        </Card>
      </BlockStack>
    </PolarisFixtureProvider>
  );
}
