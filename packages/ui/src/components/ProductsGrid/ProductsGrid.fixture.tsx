import { Page, Layout } from '@shopify/polaris';
import { ProductsGrid } from '../ProductsGrid';
import type { Product } from '../ProductsGrid';
import { PolarisFixtureProvider } from '../PolarisFixtureProvider';

const mock: Product[] = [
  {
    id: '1',
    title: 'Knoll Saarinen Executive Chair',
    image: {
      src: 'https://dev-recommender.myshopify.com/cdn/shop/files/1_a32d525b-089a-4cfe-91fa-e2dcd650dfbe.webp',
      alt: '',
    },
    price: 499.99,
    compareAtPrice: 509.99,
    badge: 'Sale',
    url: '#',
  },
  {
    id: '2',
    title: 'Bedside Table African Cherry',
    image: {
      src: 'https://dev-recommender.myshopify.com/cdn/shop/files/1_ac7a5814-2e75-4252-8dfd-d8404aa7bd9a.webp',
    },
    price: 299.99,
    compareAtPrice: 359.99,
    badge: 'Sale',
    url: '#',
  },
  {
    id: '3',
    title: 'The Collection Snowboard: Liquid',
    image: {
      src: 'https://dev-recommender.myshopify.com/cdn/shop/files/1_09cf0445-60fe-4091-b0cd-b1424530f294.webp',
    },
    price: 749.95,
    url: '#',
  },
  {
    id: '4',
    title: 'The Multi-managed Snowboard',
    image: {
      src: 'https://dev-recommender.myshopify.com/cdn/shop/files/1_be1d520c-6ecf-49ef-b6ed-d0768edf0295.webp',
    },
    price: 629.95,
    url: '#',
  },
  {
    id: '5',
    title: 'The Compare at Price Snowboard',
    image: {
      src: 'https://dev-recommender.myshopify.com/cdn/shop/files/1_dc2acd08-8ffc-4e53-b98c-7f36c471faac.webp',
    },
    price: 785.95,
    compareAtPrice: 865.95,
    badge: 'Sale',
    url: '#',
  },
  {
    id: '6',
    title: 'The Complete Snowboard',
    image: {
      src: 'https://dev-recommender.myshopify.com/cdn/shop/files/1_89b2a359-92b3-4ec0-beff-3b1a17c7e3d3.webp',
    },
    price: 699.95,
    url: '#',
  },
];

export default {
  component: () => {
    return (
      <PolarisFixtureProvider>
        <Page title="Product Default" backAction={{ content: 'Products', url: '#' }}>
          <Layout>
            <Layout.Section>
              <ProductsGrid header="You may also like" products={mock} columns={4} currency="R" />
            </Layout.Section>
          </Layout>
        </Page>
      </PolarisFixtureProvider>
    );
  },
};
