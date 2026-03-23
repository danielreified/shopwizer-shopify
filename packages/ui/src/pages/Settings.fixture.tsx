import { PolarisFixtureProvider } from '../components/PolarisFixtureProvider';
import { SettingsPage } from './Settings';

export default {
  Default: (
    <PolarisFixtureProvider>
      <SettingsPage />
    </PolarisFixtureProvider>
  ),
};
