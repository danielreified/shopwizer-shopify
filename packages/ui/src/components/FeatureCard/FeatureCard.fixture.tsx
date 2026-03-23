import { useState } from 'react';
import { PolarisFixtureProvider } from '../PolarisFixtureProvider';
import { FeatureCard } from './FeatureCard';
import { Card, Grid } from '@shopify/polaris';

export default {
  component: () => {
    const [clicked, setClicked] = useState(false);

    return (
      <PolarisFixtureProvider>
        <Card>
          <Grid columns={{ xs: 2, md: 2, lg: 2 }}>
            <FeatureCard
              title="Add-on products"
              tag="Business"
              description="Let customers personalize their experience by adding extra services."
              imageSrc="https://picsum.photos/id/1011/1200/675"
              ctaLabel={clicked ? 'Thanks!' : 'Try now'}
              onCta={() => setClicked(true)}
            />
            <FeatureCard
              title="SMS notification"
              tag="Business"
              description="Ensure customers never miss an appointment with timely updates via SMS."
              imageSrc="https://picsum.photos/id/1015/1200/675"
              ctaLabel={clicked ? 'Thanks!' : 'Try now'}
              onCta={() => setClicked(true)}
            />
          </Grid>
        </Card>
      </PolarisFixtureProvider>
    );
  },
};
