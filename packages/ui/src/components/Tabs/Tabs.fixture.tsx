import { useState } from 'react';
import { Tabs } from '.'; // ← updated import
import { Page } from '@shopify/polaris';

export default {
  component: () => {
    const [gender, setGender] = useState<'auto' | 'male' | 'female'>('auto');

    return (
      <Page>
        <div className="p-4 space-y-4 bg-gray-50 min-h-[180px]">
          <Tabs
            value={gender}
            onChange={(v) => setGender(v as 'auto' | 'male' | 'female')}
            options={[
              { value: 'auto', label: 'Auto' },
              { value: 'female', label: 'Female' },
              { value: 'male', label: 'Male' },
            ]}
          />

          <div className="text-sm text-gray-700">
            Selected: <code className="text-gray-900">{gender}</code>
          </div>
        </div>
      </Page>
    );
  },
};
