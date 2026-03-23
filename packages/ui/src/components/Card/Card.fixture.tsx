import { Card } from './Card';
import { HoverInfoButton } from '../HoverInfoButton';
import { BlockStack, RadioButton, Checkbox, Page, Button, Text } from '@shopify/polaris';

import { PolarisFixtureProvider } from '../PolarisFixtureProvider';

export default function CardFixture() {
  return (
    <PolarisFixtureProvider>
      <Page title="Promo setup">
        <Card
          id="eligibility"
          title="Eligibility"
          description="Available on all sales channels"
          leftSlot={
            <HoverInfoButton label="What does eligibility mean?">
              <Text as="p" variant="bodySm">
                Choose who can receive this promotion. You can target all customers or narrow it
                down to segments and POS locations.
              </Text>
            </HoverInfoButton>
          }
          rightSlot={<Button variant="plain">Learn more</Button>}
        >
          <BlockStack gap="100">
            <RadioButton label="All customers" checked onChange={() => {}} name="eligibility" />
            <Checkbox label="Apply on POS Pro locations" checked={false} onChange={() => {}} />
            <RadioButton
              label="Specific customer segments"
              checked={false}
              onChange={() => {}}
              name="eligibility"
            />
            <RadioButton
              label="Specific customers"
              checked={false}
              onChange={() => {}}
              name="eligibility"
            />
          </BlockStack>
        </Card>
      </Page>
    </PolarisFixtureProvider>
  );
}
