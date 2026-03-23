import { PolarisFixtureProvider } from '../components/PolarisFixtureProvider';
import { Dashboard } from './Dashboard';

export default {
  Default: (
    <PolarisFixtureProvider>
      <Dashboard />
    </PolarisFixtureProvider>
  ),
};
