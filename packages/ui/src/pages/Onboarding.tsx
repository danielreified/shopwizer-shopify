import { useState } from 'react';
import { Page, Layout } from '@shopify/polaris';
import { Button } from '@shopify/polaris';

import { VerticalNav } from '../components/VerticalNav/VerticalNav';
import { Card } from '../components/Card/Card';

import { CircleCheckBig, CircleDashed } from 'lucide-react';

const I = (Icon: any) => <Icon size={18} strokeWidth={2} />;

export function OnboardingPage() {
  const [active, setActive] = useState('/settings/general');

  return (
    <Page title="Welcome to Your App">
      <Layout>
        <Layout.Section>
          <Card
            id="eligibility"
            title="Getting started"
            description="This is where your multi-step onboarding wizard, checklist, or explainer videos will live. multi-step onboarding wizard, checklist, or explainer videos will live."
          >
            <div>
              <Button>Start product sync</Button>
            </div>
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <Card id="eligibility" title="Eligibility" description="Available on all sales channels">
            <VerticalNav activeHref={active} onNavigate={(to) => setActive(to)}>
              <VerticalNav.Item href="/settings/general" label="General" icon={I(CircleCheckBig)} />
              <VerticalNav.Item href="/settings/plan" label="Plan" icon={I(CircleCheckBig)} />
              <VerticalNav.Item href="/settings/billing" label="Billing" icon={I(CircleDashed)} />
              <VerticalNav.Item
                href="/settings/account"
                label="Users and permissions"
                icon={I(CircleDashed)}
              />
            </VerticalNav>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
