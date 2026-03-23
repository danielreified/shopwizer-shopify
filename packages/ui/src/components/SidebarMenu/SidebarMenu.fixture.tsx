import { useState } from 'react';
import { BlockStack, Text, Badge } from '@shopify/polaris';
import { PolarisFixtureProvider } from '../PolarisFixtureProvider';
import { SidebarGroup, SidebarItem, SidebarCard, SidebarDivider } from './SidebarMenu';

export default function SidebarMenuFixture() {
  const [selected, setSelected] = useState('dashboard');

  return (
    <PolarisFixtureProvider>
      <div style={{ width: 280, border: '1px solid var(--p-color-border)' }}>
        <BlockStack gap="0">
          <SidebarGroup title="Navigation">
            <SidebarItem
              label="Dashboard"
              selected={selected === 'dashboard'}
              onClick={() => setSelected('dashboard')}
            />
            <SidebarItem
              label="Products"
              description="Manage your catalog"
              selected={selected === 'products'}
              onClick={() => setSelected('products')}
            />
            <SidebarItem
              label="Analytics"
              badge={<Badge tone="info">New</Badge>}
              selected={selected === 'analytics'}
              onClick={() => setSelected('analytics')}
            />
          </SidebarGroup>

          <SidebarGroup title="Settings" noDivider>
            <SidebarItem label="General" tone="subdued" onClick={() => setSelected('general')} />
            <SidebarItem
              label="Danger Zone"
              tone="critical"
              onClick={() => setSelected('danger')}
            />
            <SidebarItem label="Disabled" disabled />
          </SidebarGroup>

          <SidebarDivider />

          <div style={{ padding: '8px' }}>
            <SidebarCard title="Monthly Orders" value="1,234" iconTone="success" />
          </div>
        </BlockStack>
      </div>
    </PolarisFixtureProvider>
  );
}
