import { useState } from 'react';
import { Button, Badge, Text } from '@shopify/polaris';
import { PolarisFixtureProvider } from '../PolarisFixtureProvider';
import { SelectorModal } from './SelectorModal';
import { SelectorModalLayout } from './SelectorModalLayout';

const sampleRows = [
  { id: '1', label: 'Electronics', description: 'Phones, laptops, accessories' },
  { id: '2', label: 'Clothing', description: 'Shirts, pants, dresses' },
  { id: '3', label: 'Home & Garden', description: 'Furniture, decor, tools' },
  { id: '4', label: 'Sports', description: 'Equipment, apparel, accessories' },
  { id: '5', label: 'Books', description: 'Fiction, non-fiction, textbooks' },
];

export default {
  'Compound (manual)': function CompoundFixture() {
    const [open, setOpen] = useState(true);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<string | null>(null);

    const filtered = sampleRows.filter((r) => r.label.toLowerCase().includes(search.toLowerCase()));

    return (
      <PolarisFixtureProvider>
        <Button onClick={() => setOpen(true)}>Open Modal</Button>
        <SelectorModal
          open={open}
          onClose={() => setOpen(false)}
          title="Select Category"
          height={400}
        >
          <SelectorModal.Header>
            <SelectorModal.Search
              value={search}
              onChange={setSearch}
              placeholder="Search categories..."
              autoFocus
            />
          </SelectorModal.Header>
          <SelectorModal.Content>
            {filtered.map((row) => (
              <SelectorModal.Row
                key={row.id}
                label={row.label}
                description={row.description}
                isSelected={selected === row.id}
                onClick={() => setSelected(row.id)}
                trailing={
                  <Badge tone="info">
                    <Text variant="bodySm" as="span">
                      12
                    </Text>
                  </Badge>
                }
              />
            ))}
            <SelectorModal.Empty
              show={filtered.length === 0}
              message="No categories match your search"
            />
          </SelectorModal.Content>
          <SelectorModal.Footer>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => setOpen(false)}>
              Select
            </Button>
          </SelectorModal.Footer>
        </SelectorModal>
      </PolarisFixtureProvider>
    );
  },

  'Layout (convenience)': function LayoutFixture() {
    const [open, setOpen] = useState(true);
    const [search, setSearch] = useState('');

    const filtered = sampleRows.filter((r) => r.label.toLowerCase().includes(search.toLowerCase()));

    return (
      <PolarisFixtureProvider>
        <Button onClick={() => setOpen(true)}>Open Layout Modal</Button>
        <SelectorModalLayout
          open={open}
          onClose={() => setOpen(false)}
          title="Pick a Category"
          height={400}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Type to filter..."
          isEmpty={filtered.length === 0}
          emptyMessage="Nothing found"
          footer={
            <>
              <Button onClick={() => setOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={() => setOpen(false)}>
                Confirm
              </Button>
            </>
          }
        >
          {filtered.map((row) => (
            <SelectorModal.Row
              key={row.id}
              label={row.label}
              description={row.description}
              onClick={() => {}}
            />
          ))}
        </SelectorModalLayout>
      </PolarisFixtureProvider>
    );
  },

  Loading: function LoadingFixture() {
    const [open, setOpen] = useState(true);

    return (
      <PolarisFixtureProvider>
        <Button onClick={() => setOpen(true)}>Open Loading</Button>
        <SelectorModalLayout
          open={open}
          onClose={() => setOpen(false)}
          title="Loading State"
          height={400}
          loading
          loadingRows={6}
          searchValue=""
          onSearchChange={() => {}}
        >
          {null}
        </SelectorModalLayout>
      </PolarisFixtureProvider>
    );
  },
};
