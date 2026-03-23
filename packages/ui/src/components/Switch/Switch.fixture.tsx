import { Card, BlockStack, Text } from '@shopify/polaris';
import { useState } from 'react';
import { Switch } from './Switch';

import { PolarisFixtureProvider } from '../PolarisFixtureProvider';

export default {
  component: () => {
    const [enabled, setEnabled] = useState(false);

    return (
      <PolarisFixtureProvider>
        <div style={{ padding: 20, background: '#f6f6f7' }}>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Toggle demo
              </Text>
              <Switch label="Email marketing consent" checked={enabled} onChange={setEnabled} />
              <Switch label="Disabled" checked={true} disabled onChange={() => {}} />
            </BlockStack>
          </Card>
        </div>
      </PolarisFixtureProvider>
    );
  },
};
