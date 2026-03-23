import { PolarisFixtureProvider } from '../PolarisFixtureProvider';
import { Footer } from './Footer';
import { Page } from '@shopify/polaris';

export default {
  component: () => {
    return (
      <PolarisFixtureProvider>
        <Page>
          <Footer
            text="Learn more about"
            linkLabel="fulfilling orders"
            linkUrl="https://help.shopify.com/manual/orders/fulfill-orders"
          />
        </Page>
      </PolarisFixtureProvider>
    );
  },
};
