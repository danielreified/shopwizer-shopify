import { useState } from 'react';
import { BlockStack, Select, TextField } from '@shopify/polaris';
import { PolarisFixtureProvider } from '../PolarisFixtureProvider';
import { AnnotatedSection } from './AnnotatedSection';

export default {
  component: () => {
    const [lang, setLang] = useState('en');
    const [tz, setTz] = useState('UTC');
    const [email, setEmail] = useState('alerts@shop.com');

    return (
      <PolarisFixtureProvider>
        <div className="h-screen p-8 bg-gray-50">
          <BlockStack gap="600">
            <AnnotatedSection>
              <AnnotatedSection.Item
                title="Admin app language"
                description="Choose your preferred language for the admin app display"
                heading="Select language"
                helperText="Selected language will apply across all settings."
              >
                <Select
                  label="Language"
                  labelHidden
                  options={[
                    { label: '🇬🇧 English', value: 'en' },
                    { label: '🇫🇷 Français', value: 'fr' },
                    { label: '🇩🇪 Deutsch', value: 'de' },
                  ]}
                  value={lang}
                  onChange={setLang}
                />
              </AnnotatedSection.Item>

              <AnnotatedSection.Item
                title="Store date and time"
                description="Set the primary timezone, date and time display for your store"
                heading="Timezone & notification email"
                helperText="You can change these later."
              >
                <BlockStack gap="300">
                  <Select
                    label="Timezone"
                    labelHidden
                    options={[
                      { label: 'UTC', value: 'UTC' },
                      { label: 'GMT+2 (Johannesburg)', value: 'Africa/Johannesburg' },
                      { label: 'GMT+1 (Berlin)', value: 'Europe/Berlin' },
                    ]}
                    value={tz}
                    onChange={setTz}
                  />
                  <TextField
                    label="Notification email"
                    labelHidden
                    value={email}
                    onChange={setEmail}
                    autoComplete="email"
                    placeholder="you@shop.com"
                  />
                  {/* spacer to mimic a taller card like your screenshot */}
                  <div style={{ height: 200 }} />
                </BlockStack>
              </AnnotatedSection.Item>
            </AnnotatedSection>
          </BlockStack>
        </div>
      </PolarisFixtureProvider>
    );
  },
};
