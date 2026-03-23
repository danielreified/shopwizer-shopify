import { useState } from 'react';
import { Page } from '@shopify/polaris';

import { VerticalNav } from './VerticalNav';
import { Card } from '../Card/Card';

import {
  Building2,
  BarChart3,
  Receipt,
  Users,
  CreditCard,
  ShoppingCart,
  UserRound,
  Truck,
  BadgePercent,
  MapPin,
  AppWindow,
  Globe,
  MousePointer2,
  Bell,
  Database,
  Languages,
  Lock,
  FileText,
} from 'lucide-react';

const I = (Icon: any) => <Icon size={16} strokeWidth={2} />;

export default {
  component: () => {
    const [active, setActive] = useState('/settings/general');

    return (
      <Page>
        <div className="w-[320px]">
          <Card id="eligibility" title="Eligibility" description="Available on all sales channels">
            <VerticalNav activeHref={active} onNavigate={(to) => setActive(to)}>
              <VerticalNav.Item href="/settings/general" label="General" icon={I(Building2)} />
              <VerticalNav.Item href="/settings/plan" label="Plan" icon={I(BarChart3)} />
              <VerticalNav.Item href="/settings/billing" label="Billing" icon={I(Receipt)} />
              <VerticalNav.Item
                href="/settings/account"
                label="Users and permissions"
                icon={I(Users)}
              />
              <VerticalNav.Item href="/settings/payments" label="Payments" icon={I(CreditCard)} />
              <VerticalNav.Item href="/settings/checkout" label="Checkout" icon={I(ShoppingCart)} />
              <VerticalNav.Item
                href="/settings/customer_accounts"
                label="Customer accounts"
                icon={I(UserRound)}
              />
              <VerticalNav.Item
                href="/settings/shipping"
                label="Shipping and delivery"
                icon={I(Truck)}
              />
              <VerticalNav.Item
                href="/settings/taxes"
                label="Taxes and duties"
                icon={I(BadgePercent)}
              />
              <VerticalNav.Item href="/settings/locations" label="Locations" icon={I(MapPin)} />
              <VerticalNav.Item
                href="/settings/apps"
                label="Apps and sales channels"
                icon={I(AppWindow)}
              />
              <VerticalNav.Item href="/settings/domains" label="Domains" icon={I(Globe)} />
              <VerticalNav.Item
                href="/settings/customer_events"
                label="Customer events"
                icon={I(MousePointer2)}
              />
              <VerticalNav.Item
                href="/settings/notifications"
                label="Notifications"
                icon={I(Bell)}
              />
              <VerticalNav.Item
                href="/settings/custom_data"
                label="Metafields and metaobjects"
                icon={I(Database)}
              />
              <VerticalNav.Item href="/settings/languages" label="Languages" icon={I(Languages)} />
              <VerticalNav.Item href="/settings/privacy" label="Customer privacy" icon={I(Lock)} />
              <VerticalNav.Item href="/settings/legal" label="Policies" icon={I(FileText)} />
            </VerticalNav>

            <div className="mt-3 text-xs text-gray-500">
              Active: <code>{active}</code>
            </div>
          </Card>
        </div>
      </Page>
    );
  },
};
