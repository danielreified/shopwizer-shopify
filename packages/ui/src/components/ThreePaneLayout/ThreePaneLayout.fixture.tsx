import React, { useState } from 'react';
import { ThreePaneLayout } from './ThreePaneLayout';
import { Button, BlockStack, Card, Text, Badge, InlineStack } from '@shopify/polaris';

/**
 * Example usage of ThreePaneLayout - Editor style
 */
export default function ThreePaneLayoutFixture() {
  const [activeKey, setActiveKey] = useState('global');

  const navItems = [
    {
      key: 'global',
      label: 'Global Styles',
      description: 'Applies to all elements',
      group: 'Core',
    },
    {
      key: 'product-rail',
      label: 'Product Rails',
      description: 'Base styles for rails',
      group: 'Core',
    },
    {
      key: 'pdp-similar',
      label: 'Similar Products',
      description: 'You may also like',
      group: 'Widgets',
    },
    { key: 'pdp-trending', label: 'Trending', description: 'Trending products', group: 'Widgets' },
    {
      key: 'cart-recs',
      label: 'Cart Recommendations',
      description: 'Cart page recs',
      group: 'Cart',
    },
  ];

  const groups = ['Core', 'Widgets', 'Cart'];

  return (
    <ThreePaneLayout
      header={{
        backButton: {
          label: 'Exit Editor',
          onClick: () => console.log('Back clicked'),
        },
        title: 'Developer CSS Editor',
        badge: { text: 'Advanced', tone: 'info' },
        actions: (
          <>
            <Button>Preview Store</Button>
            <Button variant="primary">Save Changes</Button>
          </>
        ),
      }}
      leftPane={
        <BlockStack gap="400">
          {groups.map((group) => (
            <ThreePaneLayout.NavGroup key={group} title={group}>
              {navItems
                .filter((item) => item.group === group)
                .map((item) => (
                  <ThreePaneLayout.NavItem
                    key={item.key}
                    label={item.label}
                    description={item.description}
                    active={activeKey === item.key}
                    onClick={() => setActiveKey(item.key)}
                  />
                ))}
            </ThreePaneLayout.NavGroup>
          ))}
        </BlockStack>
      }
      rightPane={
        <BlockStack gap="500">
          <BlockStack gap="200">
            <ThreePaneLayout.SectionHeader>Active Theme</ThreePaneLayout.SectionHeader>
            <Card padding="300">
              <InlineStack gap="300" blockAlign="center">
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    background: '#f0f0f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                  }}
                >
                  🎨
                </div>
                <BlockStack gap="050">
                  <Text as="p" variant="bodyMd" fontWeight="semibold">
                    Dawn Theme
                  </Text>
                  <Badge tone="success">Live</Badge>
                </BlockStack>
              </InlineStack>
            </Card>
          </BlockStack>

          <BlockStack gap="200">
            <ThreePaneLayout.SectionHeader>Quick Tips</ThreePaneLayout.SectionHeader>
            <Card padding="300">
              <BlockStack gap="200">
                <Text as="p" variant="bodySm">
                  💡 Use <code>!important</code> if styles aren't applying.
                </Text>
                <Text as="p" variant="bodySm">
                  💡 Preview changes after saving.
                </Text>
              </BlockStack>
            </Card>
          </BlockStack>
        </BlockStack>
      }
    >
      {/* Main content area */}
      <div
        style={{
          flex: 1,
          background: '#1e1e1e',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: '8px 16px',
            background: '#252526',
            borderBottom: '1px solid #333',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ color: '#007acc', fontFamily: 'monospace', fontSize: '13px' }}>
            📄 {activeKey}.css
          </span>
          <span style={{ color: '#666', fontSize: '12px' }}>CSS Mode</span>
        </div>
        <div
          style={{
            flex: 1,
            padding: '16px',
            color: '#d4d4d4',
            fontFamily: 'monospace',
            fontSize: '14px',
          }}
        >
          <pre>{`.sw-card {
  border: 1px solid #ccc;
  border-radius: 8px;
}

.sw-price {
  color: #333;
  font-weight: bold;
}`}</pre>
        </div>
      </div>
    </ThreePaneLayout>
  );
}
