'use client';

import { Text } from '@shopify/polaris';
import type { ReactNode } from 'react';

export interface SectionHeaderProps {
  title: string;
  description?: string;
  icon: any; // Lucide icon or similar
  /** Icon background gradient colors - defaults to blue-purple */
  iconGradient?: { from: string; to: string };
  /** Optional content to render on the right side */
  rightSlot?: ReactNode;
}

export function SectionHeader({
  title,
  description,
  icon: Icon,
  iconGradient = { from: '#3b82f6', to: '#8b5cf6' },
  rightSlot,
}: SectionHeaderProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Gradient icon background */}
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: `linear-gradient(135deg, ${iconGradient.from} 0%, ${iconGradient.to} 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 2px 12px ${iconGradient.from}40`,
            flexShrink: 0,
          }}
        >
          <Icon size={20} color="white" />
        </div>

        {/* Title and description */}
        <div>
          <Text variant="headingMd" as="h3">
            {title}
          </Text>
          {description && (
            <Text variant="bodySm" as="p" tone="subdued">
              {description}
            </Text>
          )}
        </div>
      </div>

      {/* Optional right slot */}
      {rightSlot}
    </div>
  );
}
