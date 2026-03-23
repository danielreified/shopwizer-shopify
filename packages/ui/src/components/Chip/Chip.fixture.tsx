import { useState } from 'react';
import { Chip } from './Chip';
import { Sparkles, Star, Baby } from 'lucide-react';
import { Card, BlockStack, Text } from '@shopify/polaris';
import { PolarisFixtureProvider } from '../PolarisFixtureProvider';

export default {
  component: () => {
    const [selected, setSelected] = useState<string | null>('Baby');

    return (
      <PolarisFixtureProvider>
        <div style={{ padding: 20, background: '#f6f6f7' }}>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Chip component demo
              </Text>

              {/* Simple clickable group */}
              <div className="flex flex-wrap gap-3">
                {['Baby', 'Adults', 'Teens', 'Age 1 - 3'].map((label) => (
                  <Chip
                    key={label}
                    slot={<Baby size={16} strokeWidth={2} />}
                    active={selected === label}
                    onClick={() => setSelected(label)}
                  >
                    {label}
                  </Chip>
                ))}
              </div>

              {/* Variations */}
              <div className="flex flex-wrap gap-3 mt-6">
                <Chip slot={<Sparkles size={16} />} active>
                  Active with icon
                </Chip>
                <Chip slot={<Star size={16} />} onClick={() => alert('Clicked!')}>
                  Clickable
                </Chip>
                <Chip disabled>Disabled chip</Chip>
              </div>
            </BlockStack>
          </Card>
        </div>
      </PolarisFixtureProvider>
    );
  },
};
