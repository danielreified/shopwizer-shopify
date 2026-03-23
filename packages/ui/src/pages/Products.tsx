import { Page, Layout } from '@shopify/polaris';

import { Table } from '../components/Table/Table';
import { Footer } from '../components/Footer/Footer';

export function ProductsPage() {
  return (
    <Page title="Products">
      <Layout>
        <Layout.Section>
          <Table />
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
