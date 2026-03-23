import { PolarisFixtureProvider } from '../components/PolarisFixtureProvider';
import { ProductPage } from './Product';

export default {
  Default: (
    <PolarisFixtureProvider>
      <ProductPage />
    </PolarisFixtureProvider>
  ),
};
