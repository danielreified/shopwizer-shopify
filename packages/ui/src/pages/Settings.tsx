import { Page, Layout, Text, Badge } from '@shopify/polaris';

import { Card } from '../components/Card/Card';
import { Footer } from '../components/Footer/Footer';
import { PolarisMenu } from '../components/Menu/Menu';

import { ToggleRight, SettingsIcon } from 'lucide-react';

const I = (Icon: any) => <Icon size={18} strokeWidth={2} />;

export function SettingsPage() {
  return (
    <Page
      title="Settings"
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
        <Layout.Section>
          <Card
            id="settings"
            title="Eligibility (Medium)"
            description="Medium variant with subtext"
          >
            <PolarisMenu outlined insetDividers size="medium">
              <PolarisMenu.Item
                slot={<Badge tone="success">Enabled</Badge>}
                icon={I(SettingsIcon)}
                href="#"
                subText="Adjust preferences, security, and integrations"
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
                subText="Find docs, FAQs, and contact support"
              >
                Get{' '}
                <Text as="span" fontWeight="semibold">
                  help and support
                </Text>
              </PolarisMenu.Item>

              <PolarisMenu.Item
                slot={<Badge tone="success">Enabled</Badge>}
                icon={I(SettingsIcon)}
                href="#"
                subText="Adjust preferences, security, and integrations"
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
                subText="Find docs, FAQs, and contact support"
              >
                Get{' '}
                <Text as="span" fontWeight="semibold">
                  help and support
                </Text>
              </PolarisMenu.Item>
            </PolarisMenu>
          </Card>
        </Layout.Section>
        <Layout.Section>
          <Card
            id="settings"
            title="Eligibility (Medium)"
            description="Medium variant with subtext"
          >
            <PolarisMenu outlined insetDividers size="medium">
              <PolarisMenu.Item
                slot={<Badge tone="success">Enabled</Badge>}
                icon={I(SettingsIcon)}
                href="#"
                subText="Adjust preferences, security, and integrations"
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
                subText="Find docs, FAQs, and contact support"
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
      <Footer
        text="Learn more about"
        linkLabel="fulfilling orders"
        linkUrl="https://help.shopify.com/manual/orders/fulfill-orders"
      />
    </Page>
  );
}
