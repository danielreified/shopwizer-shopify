// src/components/PolarisFixtureProvider.tsx
import type { ReactNode } from 'react';
import { AppProvider, Page, Frame } from '@shopify/polaris';
import enTranslations from '@shopify/polaris/locales/en.json';

export function PolarisFixtureProvider({ children }: { children: ReactNode }) {
  return (
    <AppProvider i18n={enTranslations}>
      <Frame>
        <Page>{children}</Page>
      </Frame>
    </AppProvider>
  );
}
