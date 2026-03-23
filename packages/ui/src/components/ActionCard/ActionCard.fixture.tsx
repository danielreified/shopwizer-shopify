import { useState } from 'react';
import { PolarisFixtureProvider } from '../PolarisFixtureProvider';
import { ActionCard } from './ActionCard';

export default {
  component: () => {
    const [clicked, setClicked] = useState(false);

    return (
      <PolarisFixtureProvider>
        <ActionCard
          title="Customize scheduling buttons"
          body={
            <>
              Not sure how to customize the buttons on your homepage, contact page, or other key
              areas of your store?
              <br />
              Our Live Agents are here to help!
            </>
          }
          imageSrc="https://cdn-staging.meetyapp.io/meety-production/public/v1.0/image/banner/customize_button.png"
          imageAlt="Illustration of a customizable button"
          ctaLabel={clicked ? 'Thanks!' : 'Contact us'}
          onCta={() => setClicked(true)}
        />
      </PolarisFixtureProvider>
    );
  },
};
