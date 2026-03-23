import * as React from 'react';
import { Card as PolarisCard, Text, Popover, Icon, Box } from '@shopify/polaris';
import { InfoIcon } from '@shopify/polaris-icons';

import { SkeletonText } from '../Skeleton';

type Props = {
  title: string;
  value?: number | string;
  unit?: string;
  suffix?: React.ReactNode;
  infoContent?: React.ReactNode;
  loading?: boolean;
};

export function ValueCard({ title, value, unit, suffix, infoContent, loading = false }: Props) {
  const [open, setOpen] = React.useState(false);

  const display = React.useMemo(() => {
    if (value === undefined || value === null) return '—';

    if (typeof value === 'number') {
      const formatted = new Intl.NumberFormat('en-US', {
        maximumFractionDigits: 2,
      }).format(value);

      return unit ? `${unit} ${formatted}` : formatted;
    }

    return unit ? `${unit} ${value}` : value;
  }, [value, unit]);

  return (
    <PolarisCard padding="0">
      <div className="flex items-start justify-between px-4 pt-4 pb-2 hover:bg-gray-50">
        <div className="relative">
          <Text as="h3" variant="headingSm">
            {title}
          </Text>
          <div className="border-b border-dotted border-gray-300" />
        </div>

        {infoContent ? (
          <Popover
            active={open}
            autofocusTarget="first-node"
            onClose={() => setOpen(false)}
            activator={
              <button
                type="button"
                onClick={() => setOpen((s) => !s)}
                className="p-1 rounded hover:bg-gray-100"
                aria-label="More info"
              >
                <Icon source={InfoIcon} />
              </button>
            }
          >
            <Box padding="400" maxWidth="360px">
              {infoContent}
            </Box>
          </Popover>
        ) : null}
      </div>

      {/* Content */}
      <div className="px-4 pb-4">
        <div className="flex items-end justify-between">
          {loading ? (
            <SkeletonText width="120px" height="28px" />
          ) : (
            <div className="flex items-baseline gap-2">
              <Text as="span" variant="headingSm">
                {display}
              </Text>
              {suffix ? (
                <Text as="span" tone="subdued">
                  {suffix}
                </Text>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </PolarisCard>
  );
}
