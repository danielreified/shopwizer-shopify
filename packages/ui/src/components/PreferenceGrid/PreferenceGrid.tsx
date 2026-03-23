import React from 'react';
import { CheckCircle2 } from 'lucide-react';

// ============================================================
// Types
// ============================================================

export type PreferenceOption = {
  value: string;
  label: string;
  icon: any; // Lucide or custom icon component
  description?: string;
};

export interface PreferenceGridProps {
  value: string;
  onChange: (value: string) => void;
  options: PreferenceOption[];
  columns?: number;
}

// ============================================================
// Component
// ============================================================

/**
 * Selectable card grid for preference/option picking.
 * Used in onboarding flows and settings forms.
 */
export function PreferenceGrid({ value, onChange, options, columns = 3 }: PreferenceGridProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: '12px',
      }}
    >
      {options.map((option) => {
        const isSelected = value === option.value;
        const IconComp = option.icon as any;
        return (
          <div
            key={option.value}
            onClick={() => onChange(option.value)}
            style={{
              cursor: 'pointer',
              borderRadius: '12px',
              border: isSelected
                ? '2px solid var(--p-color-border-emphasis)'
                : '2px solid var(--p-color-border-secondary)',
              backgroundColor: 'var(--p-color-bg-surface)',
              padding: '16px',
              transition: 'all 0.2s cubic-bezier(0.2, 0, 0, 1)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '12px',
              boxShadow: isSelected ? 'var(--p-shadow-200)' : 'var(--p-shadow-100)',
              position: 'relative',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '10px',
                backgroundColor: isSelected
                  ? 'var(--p-color-bg-fill-inverse)'
                  : 'var(--p-color-bg-surface-secondary)',
                color: isSelected ? 'var(--p-color-text-inverse)' : 'var(--p-color-icon-subdued)',
                transition: 'all 0.2s ease',
              }}
            >
              <IconComp size={20} strokeWidth={2} />
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}
            >
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: isSelected ? '600' : '500',
                  color: isSelected ? 'var(--p-color-text)' : 'var(--p-color-text-subdued)',
                }}
              >
                {option.label}
              </span>
              {option.description && (
                <span
                  style={{
                    fontSize: '12px',
                    color: 'var(--p-color-text-subdued)',
                    lineHeight: '1.4',
                  }}
                >
                  {option.description}
                </span>
              )}
            </div>

            {isSelected && (
              <div
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  color: 'var(--p-color-bg-fill-inverse)',
                }}
              >
                <CheckCircle2
                  size={18}
                  fill="var(--p-color-bg-fill-inverse)"
                  color="var(--p-color-text-inverse)"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default PreferenceGrid;
