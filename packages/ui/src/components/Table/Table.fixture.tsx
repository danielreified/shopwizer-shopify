import { PolarisFixtureProvider } from '../PolarisFixtureProvider';
import { Table, type ProductRow } from './Table';

const mockProducts: ProductRow[] = [
  {
    id: '1',
    title: 'Product One',
    types: ['Standard', 'Hour based'],
    status: 'Active',
    upcoming: 0,
    today: 0,
    past: 0,
    imageSrc: 'https://picsum.photos/seed/one/80',
    imageAlt: 'Product One',
  },
  {
    id: '2',
    title: 'Product Two',
    types: ['Standard', 'Hour based'],
    status: 'Active',
    upcoming: 0,
    today: 0,
    past: 0,
    imageSrc: 'https://picsum.photos/seed/two/80',
    imageAlt: 'Product Two',
  },
  {
    id: '3',
    title: 'Product Three',
    types: ['Standard'],
    status: 'Active',
    upcoming: 0,
    today: 0,
    past: 0,
    imageSrc: 'https://picsum.photos/seed/three/80',
    imageAlt: 'Product Three',
  },
];

export default {
  component: () => (
    <PolarisFixtureProvider>
      <div style={{ padding: 20 }}>
        <Table products={mockProducts} />
      </div>
    </PolarisFixtureProvider>
  ),
};
