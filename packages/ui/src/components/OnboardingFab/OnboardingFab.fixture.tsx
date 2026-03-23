import { useState } from 'react';
import { OnboardingFab, type Step } from './OnboardingFab';
import { PolarisFixtureProvider } from '../PolarisFixtureProvider';

export default {
  component: () => {
    const [invited, setInvited] = useState(false);

    const steps: Step[] = [
      {
        label: 'Sync your product catalog',
        description:
          'Import your products so we can generate relevant recommendations across your storefront.',
        complete: true,
      },
      {
        label: 'Sync last 90 days of orders',
        description:
          'Import your recent order history so we can compute trending, best-sellers, and new-arrivals.',
        complete: invited,
        actionLabel: invited ? 'Invited' : 'Invite teammates',
        onAction: () => setInvited(true),
      },
      {
        label: 'Add theme extension',
        description:
          'Install the Shopwise Theme Extension so recommendations appear on your storefront.',
        complete: false,
      },
    ];

    return (
      <PolarisFixtureProvider>
        <div className="h-screen border-8 bg-gray-50 relative">
          <OnboardingFab steps={steps} initialOpen />
        </div>
      </PolarisFixtureProvider>
    );
  },
};
