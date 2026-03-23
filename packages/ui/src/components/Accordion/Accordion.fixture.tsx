import { Page } from '@shopify/polaris';
import { PolarisFixtureProvider } from '../PolarisFixtureProvider';
import { Card } from '../Card/Card';
import { PolarisAccordion } from './Accordion';

export default {
  component: () => {
    return (
      <PolarisFixtureProvider>
        <Page>
          <Card>
            <PolarisAccordion outlined defaultOpen={[0]}>
              <PolarisAccordion.Item title="I can't see my discount code when creating a link">
                <p>
                  If you can’t see your discount when creating a link it’s likely due to the
                  discount not being active for Checkout Links.
                </p>
                <p>Don’t worry it’s an easy fix!</p>
                <p>
                  In your Shopify admin go to the selected discount and see if it’s activated. If
                  not, just select <strong>Checkout Links</strong> and save your discount. It should
                  now appear in the list of discounts when creating a new link!
                </p>
              </PolarisAccordion.Item>

              <PolarisAccordion.Item title="My link doesn't work, what should I do?">
                <p>
                  Double-check that the product is available on the Checkout Links sales channel and
                  that the discount (if any) is active. If the issue persists, regenerate the link
                  and try again.
                </p>
              </PolarisAccordion.Item>

              <PolarisAccordion.Item title="How can I enable a product for Checkout Links?">
                <p>
                  Open the product in your Shopify admin and ensure the{' '}
                  <strong>Checkout Links</strong> sales channel is selected. Save your changes to
                  make it available when creating new links.
                </p>
              </PolarisAccordion.Item>
            </PolarisAccordion>
          </Card>
        </Page>
      </PolarisFixtureProvider>
    );
  },
};
