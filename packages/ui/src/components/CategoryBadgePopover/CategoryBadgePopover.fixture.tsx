import { CategoryBadgePopover } from './CategoryBadgePopover';
import { Text } from '@shopify/polaris';
import { PolarisFixtureProvider } from '../PolarisFixtureProvider';

export default {
  component: (
    <PolarisFixtureProvider>
      <div style={{ padding: 16 }}>
        <CategoryBadgePopover
          parentCategory="Office Supplies"
          leafCategory="Bulletin Board Trim Sets"
          popoverContent={
            <Text as="p">
              This category was automatically generated. You can review and adjust it in your
              taxonomy settings.
            </Text>
          }
        />
      </div>
    </PolarisFixtureProvider>
  ),
};
