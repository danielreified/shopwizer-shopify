'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { Box, Text, Collapsible, Button, Card } from '@shopify/polaris';
import { ChevronUpIcon, ChevronDownIcon } from '@shopify/polaris-icons';

export interface CollapsibleCardProps {
  id?: string;
  title: string;
  icon: any; // Lucide icon or similar
  description?: string;
  children: ReactNode;
  /** Optional content to show on the left side of the header (after title) */
  leftSlot?: ReactNode;
  /** Optional content to show on the right side of the header (before chevron) */
  rightSlot?: ReactNode;
  defaultOpen?: boolean;
  storageKey?: string;
  /** Icon background gradient colors - defaults to blue-purple */
  iconGradient?: { from: string; to: string };
}

export function CollapsibleCard({
  id,
  title,
  icon: Icon,
  description,
  children,
  leftSlot,
  rightSlot,
  defaultOpen = true,
  storageKey,
  iconGradient = { from: '#3b82f6', to: '#8b5cf6' },
}: CollapsibleCardProps) {
  const [open, setOpen] = useState(defaultOpen);

  // Load state from local storage on mount
  useEffect(() => {
    if (!storageKey) return;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored !== null) {
        setOpen(stored === 'true');
      }
    } catch {
      // Ignore storage errors
    }
  }, [storageKey]);

  const handleToggle = () => {
    setOpen((prev) => {
      const next = !prev;
      if (storageKey) {
        try {
          localStorage.setItem(storageKey, String(next));
        } catch {
          // Ignore
        }
      }
      return next;
    });
  };

  const titleId = id ? `${id}-title` : undefined;
  const descId = id ? `${id}-desc` : undefined;

  return (
    <Card padding="0">
      <div
        id={id}
        style={{
          borderRadius: '20px',
          overflow: 'hidden',
          backgroundColor: 'var(--p-color-bg-surface)',
          border: '1px solid var(--p-color-border-subdued)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          transition: 'box-shadow 0.3s ease',
        }}
      >
        {/* Header */}
        <button
          onClick={handleToggle}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            background: `linear-gradient(135deg, ${iconGradient.from}08 0%, ${iconGradient.to}08 100%)`,
            border: 'none',
            borderBottom: open ? '1px solid var(--p-color-border-subdued)' : 'none',
            cursor: 'pointer',
            transition: 'background 0.2s ease',
          }}
        >
          {/* Left side - Icon, Title, Description */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Icon with gradient background */}
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: `linear-gradient(135deg, ${iconGradient.from} 0%, ${iconGradient.to} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 2px 8px ${iconGradient.from}4D`,
                flexShrink: 0,
              }}
            >
              <Icon size={18} color="white" />
            </div>

            {/* Title and description */}
            <div style={{ textAlign: 'left' }}>
              <Text variant="headingSm" as="h4" id={titleId}>
                {title}
              </Text>
              {description && (
                <Text variant="bodySm" as="p" tone="subdued" id={descId}>
                  {description}
                </Text>
              )}
            </div>

            {/* Optional left slot */}
            {leftSlot}
          </div>

          {/* Right side - rightSlot and chevron */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {rightSlot}

            {/* Expand/Collapse button */}
            <Button
              variant="secondary"
              icon={open ? ChevronUpIcon : ChevronDownIcon}
              accessibilityLabel={open ? 'Collapse' : 'Expand'}
            />
          </div>
        </button>

        {/* Collapsible Content */}
        <Collapsible open={open} id={id ? `${id}-collapsible` : 'collapsible'}>
          <Box padding="400">{children}</Box>
        </Collapsible>
      </div>
    </Card>
  );
}
