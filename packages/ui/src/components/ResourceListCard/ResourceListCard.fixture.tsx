// ResourceListCard.fixture.tsx
import React from 'react';
import { ResourceListCard, type ListItem } from './ResourceListCard';
import { PolarisFixtureProvider } from '../PolarisFixtureProvider';

const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="p-6 bg-gray-50 min-h-[70vh]">{children}</div>
);

const items: ListItem[] = [
  {
    id: '145',
    href: '#',
    avatarSrc:
      'https://burst.shopifycdn.com/photos/freelance-designer-working-on-laptop.jpg?width=256',
    title: 'Yi So-Yeon',
    meta: 'Gwangju, South Korea',
    right: (
      <span className="text-sm">
        Showing 12 of <b>40</b>
      </span>
    ),
  },
  {
    id: '146',
    href: '#',
    avatarSrc: 'https://burst.shopifycdn.com/photos/smiling-person.jpg?width=256',
    title: 'Darius Mkhize',
    meta: 'Cape Town, South Africa',
    right: (
      <span className="text-sm">
        Showing 12 of <b>40</b>
      </span>
    ),
  },
  {
    id: '147',
    href: '#',
    avatarSrc: 'https://burst.shopifycdn.com/photos/woman-with-laptop.jpg?width=256',
    title: 'Aiko Tanaka',
    meta: 'Osaka, Japan',
    right: (
      <span className="text-sm">
        Showing 12 of <b>40</b>
      </span>
    ),
  },
];

export default {
  Default: (
    <PolarisFixtureProvider>
      <Wrapper>
        <div className="max-w-lg">
          <ResourceListCard
            headerTitle="Customers"
            showCount
            countLabels={{ singular: 'customer', plural: 'customers' }}
            headerHelpContent={
              <div>A simple list of your most recent customers. Click a row to view details.</div>
            }
            items={items}
          />
        </div>
      </Wrapper>
    </PolarisFixtureProvider>
  ),

  CustomRender: (
    <PolarisFixtureProvider>
      <Wrapper>
        <div className="max-w-lg">
          <ResourceListCard
            headerTitle="Customers (custom renderer)"
            headerSubtitle="Rendered with a custom row"
            countLabels={{ singular: 'customer', plural: 'customers' }}
            items={items}
            renderItem={(item) => (
              <div className="flex items-center justify-between">
                <span className="text-sm">
                  <strong>{item.title}</strong>
                  {item.meta ? <span className="text-gray-500"> — {item.meta}</span> : null}
                </span>
                <a href={item.href || '#'} className="text-blue-600 hover:underline text-sm">
                  View
                </a>
              </div>
            )}
          />
        </div>
      </Wrapper>
    </PolarisFixtureProvider>
  ),

  EmptyState: (
    <PolarisFixtureProvider>
      <Wrapper>
        <div className="max-w-xl">
          <ResourceListCard
            headerTitle="Customers"
            showCount
            countLabels={{ singular: 'customer', plural: 'customers' }}
            items={[]}
            emptyState={
              <div className="p-6 text-center text-sm text-gray-600">
                No customers yet. Try adding one from your admin.
              </div>
            }
          />
        </div>
      </Wrapper>
    </PolarisFixtureProvider>
  ),
};
