import { PolarisMenu } from './Menu';
import { Card } from '../Card/Card';
import { ToggleRight, KeyboardIcon, ReceiptIcon, SettingsIcon } from 'lucide-react';
import { Page, Text, Badge } from '@shopify/polaris';
import { PolarisFixtureProvider } from '../PolarisFixtureProvider';

const I = (Icon: any) => <Icon size={16} strokeWidth={2} />;

export default {
  small: () => (
    <PolarisFixtureProvider>
      <Page>
        <Card
          id="eligibility"
          title="Eligibility (Small)"
          description="Available on all sales channels"
        >
          <PolarisMenu outlined insetDividers size="small">
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
          </PolarisMenu>
        </Card>
      </Page>
    </PolarisFixtureProvider>
  ),

  medium: () => (
    <PolarisFixtureProvider>
      <Page>
        <Card id="settings" title="Eligibility (Medium)" description="Medium variant with subtext">
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
      </Page>
    </PolarisFixtureProvider>
  ),
};
