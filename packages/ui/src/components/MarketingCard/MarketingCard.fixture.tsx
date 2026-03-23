import { MarketingCard } from './MarketingCard';
import { PolarisFixtureProvider } from '../PolarisFixtureProvider';

export default {
  component: () => (
    <PolarisFixtureProvider>
      <div style={{ padding: 24 }}>
        <MarketingCard
          title="Centralize your campaign tracking"
          description="Create campaigns to evaluate how marketing initiatives drive business goals. Capture online and offline touchpoints, add campaign activities from multiple marketing channels, and monitor results."
          ctaLabel="Create campaign"
          onCta={() => alert('Create campaign')}
          imageSrc="https://cdn.shopify.com/shopifycloud/web/assets/v1/vite/client/en/assets/campaign-folder-empty-CXtBhz9-KBSx.svg"
          imageAlt=""
        />
      </div>
    </PolarisFixtureProvider>
  ),
};
