import { Provider as AppBridgeProvider } from '@shopify/app-bridge-react';
import { configure as configureAppBridge } from '@shopify/app-bridge';

const app = configureAppBridge({
  apiKey: 'DUMMY_API_KEY',
  shopOrigin: 'test-shop.myshopify.com',
});

export const decorators = [
  (Story) => (
    <AppBridgeProvider app={app}>
      <Story />
    </AppBridgeProvider>
  ),
];
