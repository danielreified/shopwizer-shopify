import { SimpleCard } from './SimpleCard';

import { PolarisFixtureProvider } from '../PolarisFixtureProvider';

export default {
  component: () => (
    <PolarisFixtureProvider>
      <div style={{ padding: 20, background: '#f6f6f7' }}>
        <SimpleCard
          title="Learn how to use Checkout Links"
          description="Learn how to use Checkout Links to its fullest potential with our documentation"
          href="https://example.com/docs"
        />
      </div>
    </PolarisFixtureProvider>
  ),
};
