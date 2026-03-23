// app/components/Tabs.tsx
import React, { useRef } from 'react';

type Option = {
  value: string;
  label: React.ReactNode;
};

export type TabsProps = {
  value: string;
  onChange: (v: string) => void;
  options: Option[];
  className?: string;
  ariaLabel?: string;
};

export function Tabs({ value, onChange, options, className = '', ariaLabel = 'Tabs' }: TabsProps) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={['relative flex rounded-md p-1 bg-[#e5e5e5] shadow-sm', className].join(' ')}
    >
      {options.map((o, i) => {
        const active = value === o.value;

        return (
          <button
            key={o.value}
            ref={(el) => (refs.current[i] = el)}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            className={[
              'flex-1 px-3 py-1 text-xs rounded-md flex items-center justify-center whitespace-nowrap transition',
              active ? 'bg-black text-white shadow' : 'text-gray-800 hover:bg-gray-200',
            ].join(' ')}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
