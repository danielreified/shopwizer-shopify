import { useState } from 'react';
import { Page, BlockStack, Button, Text, Checkbox } from '@shopify/polaris';

import { PolarisFixtureProvider } from '../PolarisFixtureProvider';
import { CollapsibleCard } from './CollapsibleCard';
import { Copy, Palette, Link2 } from 'lucide-react';
import { HoverInfoButton } from '../HoverInfoButton';

export default function CollapsibleCardFixture() {
  const [checked, setChecked] = useState(false);

  return (
    <PolarisFixtureProvider>
      <Page title="CollapsibleCard Fixture">
        <BlockStack gap="400">
          {/* ------------------------------------------------ */}
          {/* Similar Products                                 */}
          {/* ------------------------------------------------ */}
          <CollapsibleCard
            id="similar-products"
            icon={Copy}
            title="Similar Products"
            description="Shows products visually similar to the selected item."
            leftSlot={
              <HoverInfoButton label="More info">
                <Text as="p" variant="bodySm">
                  These products are recommended using embeddings.
                </Text>
              </HoverInfoButton>
            }
            rightSlot={<Button variant="plain">Action</Button>}
          >
            <BlockStack gap="200">
              <Text as="p">This is the inside of the Similar Products card.</Text>
              <Checkbox
                label="Enable similar products"
                checked={checked}
                onChange={() => setChecked(!checked)}
              />
            </BlockStack>
          </CollapsibleCard>

          {/* ------------------------------------------------ */}
          {/* Matching Color                                    */}
          {/* ------------------------------------------------ */}
          <CollapsibleCard
            id="matching-color"
            icon={Palette}
            title="Matching Color"
            description="Matches color-variant embeddings to blend recommendations."
          >
            <BlockStack gap="200">
              <Text as="p">Some settings or preview for matching color.</Text>
              <Button>Do something</Button>
            </BlockStack>
          </CollapsibleCard>

          {/* ------------------------------------------------ */}
          {/* Frequently Bought Together                        */}
          {/* ------------------------------------------------ */}
          <CollapsibleCard
            id="fbt"
            icon={Link2}
            title="Frequently Bought Together"
            description="Shows complementary items purchased together."
          >
            <BlockStack gap="200">
              <Text as="p">This simulates the FBT settings area.</Text>
            </BlockStack>
          </CollapsibleCard>
        </BlockStack>
      </Page>
    </PolarisFixtureProvider>
  );
}
