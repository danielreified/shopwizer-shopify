// app/components/__fixtures__/guide.fixture.tsx
import { Page } from '@shopify/polaris';
import { Guide } from './Guide';
import { PolarisFixtureProvider } from '../PolarisFixtureProvider';

export default {
  component: () => {
    const handleReviewEmail = () => alert('Review email clicked');
    const handleCreateAutomation = () => alert('Create automation clicked');

    return (
      <PolarisFixtureProvider>
        <div className="relative h-screen">
          <Page title="Marketing automations">
            <div className="max-w-5xl">
              <Guide
                onboardingStep={2}
                title="Start with these essential templates"
                subtitle="Automate customer communications to increase engagement, sales, and return on your marketing spend."
                items={[
                  {
                    id: 'recover-checkout',
                    title: 'Recover abandoned checkout',
                    description:
                      'An automated email is already created for you. Take a moment to review the email and make any additional adjustments to the design, messaging, or recipient list.',
                    primaryAction: { label: 'Review email', onClick: handleReviewEmail },
                    media: (
                      <img
                        alt=""
                        src="https://cdn.shopify.com/b/shopify-guidance-dashboard-public/s71uqvx5cw7g36m49neww664nhtz.png"
                        style={{ maxWidth: 220, borderRadius: 6 }}
                      />
                    ),
                    completed: false,
                  },
                  {
                    id: 'recover-cart',
                    title: 'Recover abandoned cart',
                    description:
                      'Create a cart recovery automation to bring shoppers back and complete their purchase.',
                    primaryAction: { label: 'Create automation', onClick: handleCreateAutomation },
                    completed: false,
                  },
                ]}
              />
            </div>
          </Page>
        </div>
      </PolarisFixtureProvider>
    );
  },
};
