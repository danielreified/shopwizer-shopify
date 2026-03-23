import { useState } from 'react';
import { BlockStack, Text, Card } from '@shopify/polaris';
import { PolarisFixtureProvider } from '../PolarisFixtureProvider';
import { PreferenceGrid } from './PreferenceGrid';

function UserIcon(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.size || 24}
      height={props.size || 24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={props.strokeWidth || 2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function UsersIcon(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.size || 24}
      height={props.size || 24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={props.strokeWidth || 2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function GlobeIcon(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.size || 24}
      height={props.size || 24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={props.strokeWidth || 2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </svg>
  );
}

export default function PreferenceGridFixture() {
  const [gender, setGender] = useState('all');
  const [audience, setAudience] = useState('');

  return (
    <PolarisFixtureProvider>
      <BlockStack gap="600">
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              Gender Preference (3 columns)
            </Text>
            <PreferenceGrid
              value={gender}
              onChange={setGender}
              options={[
                { value: 'male', label: 'Male', icon: UserIcon, description: "Men's products" },
                {
                  value: 'female',
                  label: 'Female',
                  icon: UserIcon,
                  description: "Women's products",
                },
                { value: 'all', label: 'All', icon: UsersIcon, description: 'All genders' },
              ]}
            />
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              Target Audience (2 columns)
            </Text>
            <PreferenceGrid
              value={audience}
              onChange={setAudience}
              columns={2}
              options={[
                { value: 'local', label: 'Local', icon: UserIcon },
                { value: 'global', label: 'Global', icon: GlobeIcon },
              ]}
            />
          </BlockStack>
        </Card>
      </BlockStack>
    </PolarisFixtureProvider>
  );
}
