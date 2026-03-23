import { PolarisFixtureProvider } from '../components/PolarisFixtureProvider';
import { ProductsPage } from './Products';

export default {
  component: () => (
    <PolarisFixtureProvider>
      <div style={{ padding: 20 }}>
        <ProductsPage />
      </div>
    </PolarisFixtureProvider>
  ),
};
