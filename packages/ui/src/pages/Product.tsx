import { Page, Layout, Text, Select, BlockStack, Badge } from '@shopify/polaris';
import { useState, useCallback } from 'react';

import { ProductsGrid } from '../components/ProductsGrid';
import { VerticalNav } from '../components/VerticalNav/VerticalNav';
import { Footer } from '../components/Footer/Footer';

import { Card } from '../components/Card/Card';

import {
  Building2,
  BarChart3,
  Receipt,
  Users,
  CreditCard,
  ShoppingCart,
  ChevronRight,
} from 'lucide-react';

const I = (Icon: any) => <Icon size={18} strokeWidth={2} />;

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

export function ProductPage() {
  const [selected, setSelected] = useState('today');
  const [active, setActive] = useState('/settings/general');

  const handleSelectChange = useCallback((value: string) => setSelected(value), []);

  const options = [
    { label: 'Today', value: 'today' },
    { label: 'Yesterday', value: 'yesterday' },
    { label: 'Last 7 days', value: 'lastWeek' },
  ];

  return (
    <Page
      title="Black Whisk"
      primaryAction={{ content: 'Add code', onAction: () => {} }}
      secondaryActions={[{ content: 'Skip', onAction: () => {} }]}
      backAction={{ content: 'Products', url: '/products' }}
    >
      <Layout>
        <Layout.Section>
          <div className="flex flex-col gap-4">
            <Card id="eligibility">
              <div className="flex flex-col gap-2">
                <Text variant="bodyLg" as="p" fontWeight="semibold">
                  Title
                </Text>
                <Text variant="bodyLg" as="p">
                  Black Whisk
                </Text>
              </div>
              <div className="flex flex-col gap-2">
                <Text variant="bodyLg" as="p" fontWeight="semibold">
                  Description
                </Text>
                <Text variant="bodyLg" as="p">
                  The Black Whisk is a kitchen essential for whisking and beating ingredients. Its
                  ergonomic handle and sleek design make it a practical and stylish tool.
                </Text>
              </div>
            </Card>

            <Card id="eligibility">
              <div className="flex flex-col gap-2">
                <Text variant="bodyLg" as="p" fontWeight="semibold">
                  Category
                </Text>
                <Text variant="bodyLg" as="p">
                  <div className="gap-2 flex">
                    <Badge tone="">Office Supplies</Badge>
                    {I(ChevronRight)}
                    <Badge tone="">...</Badge>
                    {I(ChevronRight)}
                    <Badge tone="">...</Badge>
                    {I(ChevronRight)}
                    <Badge tone="">...</Badge>
                    {I(ChevronRight)}
                    <Badge tone="info">Bulletin Board Trim Sets</Badge>
                  </div>
                </Text>
              </div>
            </Card>
          </div>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <BlockStack gap="400">
            <Card
              id="eligibility"
              title="Eligibility"
              description="Available on all sales channels"
            >
              <div></div>
            </Card>

            <Card id="eligibility">
              <div className="flex flex-col gap-2">
                <Text variant="bodyLg" as="p" fontWeight="semibold">
                  Type
                </Text>
                <Text variant="bodyLg" as="p">
                  Black Whisk
                </Text>
              </div>
              <div className="flex flex-col gap-2">
                <Text variant="bodyLg" as="p" fontWeight="semibold">
                  Vendor
                </Text>
                <Text variant="bodyLg" as="p">
                  Black Whisk
                </Text>
              </div>
              <div className="flex flex-col gap-2">
                <Text variant="bodyLg" as="p" fontWeight="semibold">
                  Tags
                </Text>
                <Text variant="bodyLg" as="p">
                  Black Whisk
                </Text>
              </div>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>

      <div className="mt-4">
        <Layout>
          <Layout.Section variant="oneThird">
            <BlockStack gap="400">
              <Card
                id="eligibility"
                title="Eligibility"
                description="Available on all sales channels"
              >
                <Select
                  label="Variant"
                  options={options}
                  onChange={handleSelectChange}
                  value={selected}
                />
                <VerticalNav activeHref={active} onNavigate={(to) => setActive(to)}>
                  <VerticalNav.Item
                    href="/settings/general"
                    label="Matching Color"
                    icon={I(Building2)}
                  />
                  <VerticalNav.Item
                    href="/settings/plan"
                    label="Similar (multi-signal: text + image)"
                    icon={I(BarChart3)}
                  />
                  <VerticalNav.Item
                    href="/settings/billing"
                    label="Complementary (Perfect Pairings / Goes Well With / Accessories)"
                    icon={I(Receipt)}
                  />
                  <VerticalNav.Item
                    href="/settings/account"
                    label="Frequently Bought Together (90d)"
                    icon={I(Users)}
                  />
                  <VerticalNav.Item
                    href="/settings/payments"
                    label="New Arrivals in Relevant Category"
                    icon={I(CreditCard)}
                  />
                  <VerticalNav.Item
                    href="/settings/checkout"
                    label="Best Sellers in Relevant Category"
                    icon={I(ShoppingCart)}
                  />
                  <VerticalNav.Item
                    href="/settings/checkout"
                    label="Recently Viewed"
                    icon={I(ShoppingCart)}
                  />
                </VerticalNav>
              </Card>

              <Card id="eligibility">
                <></>
              </Card>
            </BlockStack>
          </Layout.Section>
          <Layout.Section>
            <Card>
              <ProductsGrid
                // header="You may also like"
                products={mock}
                columns={4}
                currency="R"
              />
            </Card>
          </Layout.Section>
        </Layout>
      </div>

      <Footer
        text="Learn more about"
        linkLabel="fulfilling orders"
        linkUrl="https://help.shopify.com/manual/orders/fulfill-orders"
      />
    </Page>
  );
}
