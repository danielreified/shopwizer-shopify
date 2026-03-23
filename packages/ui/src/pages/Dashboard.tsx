import { Page, Layout, Badge, Text } from '@shopify/polaris';

import { PolarisMenu } from '../components/Menu/Menu';
import { Card } from '../components/Card/Card';

import { ToggleRight, KeyboardIcon, ReceiptIcon, SettingsIcon } from 'lucide-react';

const I = (Icon: any) => <Icon size={18} strokeWidth={2} />;

export function Dashboard() {
  return (
    <Page
      title="Dashboard"
      secondaryActions={[
        {
          content: 'View products',
          onAction: () => {
            console.log('Export clicked');
          },
        },
      ]}
    >
      <Layout>
        <Layout.Section variant="oneHalf">
          <Card id="eligibility" title="Eligibility" description="Available on all sales channels">
            fds
          </Card>
        </Layout.Section>
        <Layout.Section variant="oneHalf">
          <Card id="eligibility" title="Eligibility" description="Available on all sales channels">
            <PolarisMenu outlined insetDividers>
              <PolarisMenu.Item
                slot={<Badge tone="success">Enabled</Badge>}
                icon={I(KeyboardIcon)}
                href="#"
              >
                Locksmith is{' '}
                <Text as="span" fontWeight="semibold">
                  enabled
                </Text>
              </PolarisMenu.Item>

              <PolarisMenu.Item
                slot={<Badge tone="success">Enabled</Badge>}
                icon={I(ReceiptIcon)}
                href="#"
              >
                You have{' '}
                <Text as="span" fontWeight="semibold">
                  11 trial days left
                </Text>
              </PolarisMenu.Item>

              <PolarisMenu.Item
                slot={<Badge tone="success">Enabled</Badge>}
                icon={I(SettingsIcon)}
                href="#"
              >
                Manage your{' '}
                <Text as="span" fontWeight="semibold">
                  Locksmith settings
                </Text>
              </PolarisMenu.Item>

              <PolarisMenu.Item
                slot={<Badge tone="success">Enabled</Badge>}
                icon={I(ToggleRight)}
                href="#"
              >
                Get{' '}
                <Text as="span" fontWeight="semibold">
                  help and support
                </Text>
              </PolarisMenu.Item>
            </PolarisMenu>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
