import React from 'react';
import { ValueCard } from './ValueCard';

const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="p-6 bg-gray-50 min-h-[60vh]">{children}</div>
);

export default {
  Default: (
    <Wrapper>
      <div className="max-w-xl">
        <ValueCard
          title="Gross sales"
          unit="ZAR"
          value={0}
          suffix="—"
          infoContent={
            <div>
              Gross revenue from products bought via recommendations in the last 30 days, excluding
              returns.
            </div>
          }
        />
      </div>
    </Wrapper>
  ),

  WithValue: (
    <Wrapper>
      <div className="max-w-xl">
        <ValueCard
          title="Gross sales"
          unit="ZAR"
          value={12345.67}
          suffix="vs last 30d"
          infoContent={<div>Same metric, showing a non-zero value.</div>}
        />
      </div>
    </Wrapper>
  ),

  Grid: (
    <Wrapper>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
        <ValueCard title="Gross sales" unit="ZAR" value={0} suffix="—" />
        <ValueCard title="Items sold" value={0} suffix="—" />
        <ValueCard title="Orders" value={0} suffix="—" />
        <ValueCard title="Clicks" value={0} suffix="—" />
      </div>
    </Wrapper>
  ),
};
