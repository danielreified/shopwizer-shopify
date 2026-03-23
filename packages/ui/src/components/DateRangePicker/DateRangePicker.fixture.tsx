import { useState } from 'react';
import { DateRangePicker } from './DateRangePicker';
import type { DateRange } from './DateRangePicker';
import { PolarisFixtureProvider } from '../PolarisFixtureProvider';

const InteractiveDemo = () => {
  const [selectedRange, setSelectedRange] = useState<DateRange | null>(null);

  return (
    <div className="space-y-4">
      <DateRangePicker
        onChange={(range) => {
          setSelectedRange(range);
          console.log('Selected range:', range);
        }}
      />

      {selectedRange && (
        <div className="p-4 bg-white rounded-lg border">
          <p className="text-sm text-gray-600">
            <strong>Since:</strong> {selectedRange.since.toLocaleDateString()}
          </p>
          <p className="text-sm text-gray-600">
            <strong>Until:</strong> {selectedRange.until.toLocaleDateString()}
          </p>
        </div>
      )}
    </div>
  );
};

export default {
  Default: (
    <PolarisFixtureProvider>
      <div className="max-w-xl p-6">
        <DateRangePicker onChange={(range) => console.log('Selected:', range)} />
      </div>
    </PolarisFixtureProvider>
  ),

  Interactive: (
    <PolarisFixtureProvider>
      <div className="max-w-xl p-6">
        <InteractiveDemo />
      </div>
    </PolarisFixtureProvider>
  ),

  WithInitialRange: (
    <PolarisFixtureProvider>
      <div className="max-w-xl p-6">
        <DateRangePicker
          initialRange={{
            since: new Date(Date.now() - 30 * 86400000),
            until: new Date(),
          }}
          onChange={(range) => console.log('Selected:', range)}
        />
      </div>
    </PolarisFixtureProvider>
  ),

  SingleMonth: (
    <PolarisFixtureProvider>
      <div className="max-w-xl p-6">
        <DateRangePicker multiMonth={false} onChange={(range) => console.log('Selected:', range)} />
      </div>
    </PolarisFixtureProvider>
  ),
};
