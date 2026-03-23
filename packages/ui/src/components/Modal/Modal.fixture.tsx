import { Modal } from './Modal';
import { PolarisFixtureProvider } from '../PolarisFixtureProvider';
import { Text } from '@shopify/polaris';

export default {
  Default: (
    <PolarisFixtureProvider>
      <div style={{ height: 500, padding: 16 }}>
        <Modal
          title="Reach more shoppers…"
          primaryAction={{ content: 'Add Instagram' }}
          secondaryActions={[{ content: 'Learn more' }]}
        >
          <Modal.Section>
            <Text variant="bodyMd" as="p">
              Use Instagram posts to share your products with millions of people. Connect your
              account to start promoting right from your storefront.
            </Text>
          </Modal.Section>
        </Modal>
      </div>
    </PolarisFixtureProvider>
  ),

  // Uncontrolled, starts open
  DefaultOpen: (
    <PolarisFixtureProvider>
      <div style={{ height: 500, padding: 16 }}>
        <Modal
          defaultOpen
          title="Reach more shoppers…"
          primaryAction={{ content: 'Add Instagram' }}
          secondaryActions={[{ content: 'Learn more' }]}
        >
          <Modal.Section>
            <Text variant="bodyMd" as="p">
              Use Instagram posts to share your products with millions of people. Connect your
              account to start promoting right from your storefront.
            </Text>
          </Modal.Section>
        </Modal>
      </div>
    </PolarisFixtureProvider>
  ),

  // Large + scrollable content
  LargeScrollable: (
    <PolarisFixtureProvider>
      <div style={{ height: 500, padding: 16 }}>
        <Modal
          defaultOpen
          size="large"
          title="Promote your catalog"
          primaryAction={{ content: 'Connect' }}
          secondaryActions={[{ content: 'Docs' }]}
        >
          <Modal.Section>
            <Text as="p" variant="bodyMd">
              This variant shows how the modal behaves with longer content.
            </Text>
          </Modal.Section>
          <Modal.Section>
            <div style={{ maxHeight: 280, overflow: 'auto' }}>
              {Array.from({ length: 20 }).map((_, i) => (
                <p key={i}>Bullet {i + 1}: Helpful detail about promoting products.</p>
              ))}
            </div>
          </Modal.Section>
        </Modal>
      </div>
    </PolarisFixtureProvider>
  ),

  // Critical action styling (no extra logic)
  CriticalPrimary: (
    <PolarisFixtureProvider>
      <div style={{ height: 500, padding: 16 }}>
        <Modal
          defaultOpen
          title="Delete integration?"
          primaryAction={{ content: 'Delete', destructive: true }}
          secondaryActions={[{ content: 'Cancel' }]}
        >
          <Modal.Section>
            <Text as="p" variant="bodyMd">
              This action cannot be undone. Your connection and related settings will be removed.
            </Text>
          </Modal.Section>
        </Modal>
      </div>
    </PolarisFixtureProvider>
  ),
};
