import { useState } from 'react';
import { Card, BlockStack, Text } from '@shopify/polaris';
import { PolarisFixtureProvider } from '../PolarisFixtureProvider'; // adjust path if needed
import { CategoryPicker } from './CategoryPicker'; // the component from earlier

type Node = {
  id: string;
  label: string;
  hasChildren: boolean;
  path?: string;
};

// ----- mock taxonomy data (enough to demo the UX) -----
const ROOT: Node[] = [
  { id: 'animals', label: 'Animals & Pet Supplies', hasChildren: false },
  { id: 'apparel', label: 'Apparel & Accessories', hasChildren: false },
  { id: 'arts', label: 'Arts & Entertainment', hasChildren: false },
  { id: 'baby', label: 'Baby & Toddler', hasChildren: false },
  { id: 'business', label: 'Business & Industrial', hasChildren: false },
  { id: 'cameras-root', label: 'Cameras & Optics', hasChildren: false },
  { id: 'electronics', label: 'Electronics', hasChildren: true }, // only one that drills
  { id: 'food', label: 'Food, Beverages & Tobacco', hasChildren: false },
];

const ELECTRONICS: Node[] = [
  { id: 'arcade', label: 'Arcade Equipment', hasChildren: true },
  { id: 'cameras', label: 'Cameras & Optics', hasChildren: false },
];

const ARCADE: Node[] = [
  { id: 'pinball-acc', label: 'Pinball Machine Accessories', hasChildren: true },
];

const PINBALL_ACC_CHILDREN: Node[] = [
  { id: 'playfield-waxes', label: 'Playfield Waxes', hasChildren: false },
  { id: 'protective-covers', label: 'Protective Covers', hasChildren: false },
  { id: 'replacement-balls', label: 'Replacement Balls', hasChildren: false },
  { id: 'rubber-ring-kits', label: 'Rubber Ring Kits', hasChildren: false },
];

// helper to fake latency
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ----- mock loader impl used by the picker -----
const loader = {
  getChildren: async (parentId?: string) => {
    await delay(150);
    if (!parentId) return ROOT;
    if (parentId === 'electronics') return ELECTRONICS;
    if (parentId === 'arcade') return ARCADE;
    if (parentId === 'pinball-acc') return PINBALL_ACC_CHILDREN;
    return [];
  },
  search: async (q: string) => {
    await delay(120);
    const ql = q.toLowerCase();
    const results: Node[] = [
      {
        id: 'pinball-acc',
        label: 'Pinball Machine Accessories',
        hasChildren: true,
        path: 'Electronics › Arcade Equipment › Pinball Machine Accessories',
      },
      {
        id: 'replacement-balls',
        label: 'Replacement Balls',
        hasChildren: false,
        path: 'Electronics › Arcade Equipment › Pinball Machine Accessories › Replacement Balls',
      },
    ];
    return results.filter((n) => (n.path ?? n.label).toLowerCase().includes(ql));
  },
};

// ----- fixture -----
export default {
  component: () => {
    const [selected, setSelected] = useState<{ id: string; path: string } | undefined>();

    return (
      <PolarisFixtureProvider>
        <div style={{ padding: 20, background: '#f6f6f7' }}>
          <Card>
            <BlockStack gap="400">
              <CategoryPicker
                value={selected}
                onChange={setSelected}
                loader={loader}
                placeholder="Choose a product category"
              />
              <Text tone="subdued" variant="bodySm">
                Selected: {selected ? selected.path : '—'}
              </Text>
            </BlockStack>
          </Card>
        </div>
      </PolarisFixtureProvider>
    );
  },
};
