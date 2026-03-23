// src/components/PricingTable.fixture.tsx
import PricingPage from './Pricing';
import { PolarisFixtureProvider } from '../components/PolarisFixtureProvider';

export default {
  Default: (
    <PolarisFixtureProvider>
      <PricingPage />
    </PolarisFixtureProvider>
  ),
};
