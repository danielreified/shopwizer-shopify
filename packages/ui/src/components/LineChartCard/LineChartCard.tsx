import type { ReactNode } from 'react';
import * as React from 'react';
import { Card, Text, Popover, Box } from '@shopify/polaris';
import { LineChart } from '../LineChart';

import { SkeletonText, SkeletonBlock } from '../Skeleton'; // <-- USE YOUR SKELETONS

export type ChartPoint = { key: string; value: number };
export type ChartSeries = {
  name: string;
  data: ChartPoint[];
  style?: 'solid' | 'dotted';
};

type Props = {
  title: string;
  metric?: ReactNode;
  metricSuffix?: ReactNode;
  primary: ChartSeries;
  comparison?: ChartSeries;
  unit?: string;
  height?: number;
  theme?: 'Light' | 'Dark';
  infoContent?: ReactNode;
  loading?: boolean;
  onTitleClick?: () => void; // Optional click handler for navigation
};

export const LineChartCard = ({
  title,
  metric,
  metricSuffix,
  primary,
  comparison,
  unit = '',
  height = 180,
  theme = 'Light',
  infoContent,
  loading = false,
  onTitleClick,
}: Props) => {
  const [open, setOpen] = React.useState(false);

  const data = React.useMemo(() => {
    if (loading) return [];
    const series: ChartSeries[] = [{ ...primary, style: 'solid' }];
    if (comparison) series.push({ ...comparison, style: 'dotted' });
    return series;
  }, [primary, comparison, loading]);

  const yAxisLabel = React.useCallback(
    (v: number) => (unit ? `${unit} ${formatNumber(v)}` : formatNumber(v)),
    [unit],
  );

  return (
    <Card padding="0">
      {/* Header */}
      <div
        className={`flex items-start justify-between px-4 pt-4 pb-2 ${
          onTitleClick ? 'hover:bg-gray-50 cursor-pointer' : ''
        }`}
        onClick={onTitleClick}
        role={onTitleClick ? 'button' : undefined}
        tabIndex={onTitleClick ? 0 : undefined}
        onKeyDown={onTitleClick ? (e) => e.key === 'Enter' && onTitleClick() : undefined}
      >
        <div className="relative">
          <Text as="h3" variant="headingSm">
            <span className={onTitleClick ? 'hover:underline' : ''}>{title}</span>
          </Text>
          <div className="h-[-1px] border-b border-dotted border-gray-400" />
        </div>

        {infoContent && !onTitleClick ? (
          <Popover
            active={open}
            autofocusTarget="first-node"
            onClose={() => setOpen(false)}
            activator={<></>}
          >
            <Box padding="400" maxWidth="360px">
              {infoContent}
            </Box>
          </Popover>
        ) : null}
      </div>

      <div className="px-4 pb-4">
        {/*────────────────────*/}
        {/* Metric Skeleton */}
        {/*────────────────────*/}
        {loading ? (
          <SkeletonText width="120px" height="28px" className="my-2" />
        ) : (
          (metric !== undefined || metricSuffix) && (
            <div className="flex items-baseline gap-2">
              {metric === 0 || metric === '0' ? (
                <Text as="span" variant="headingLg" fontWeight="regular">
                  —
                </Text>
              ) : (
                <>
                  {metric !== undefined && (
                    <Text as="span" variant="headingLg">
                      {unit} {typeof metric === 'number' ? formatNumber(metric) : metric}
                    </Text>
                  )}
                  {metricSuffix && (
                    <Text as="span" tone="subdued">
                      {metricSuffix}
                    </Text>
                  )}
                </>
              )}
            </div>
          )
        )}

        {/*────────────────────*/}
        {/* Chart Skeleton */}
        {/*────────────────────*/}
        {loading ? (
          <SkeletonBlock height={height} className="rounded-xl mt-4" />
        ) : (
          <LineChart
            className="py-4"
            data={data as any}
            theme={theme}
            height={height}
            yAxisOptions={{ labelFormatter: yAxisLabel }}
          />
        )}
      </div>
    </Card>
  );
};

function formatNumber(n: number) {
  if (Number.isInteger(n)) return n.toString();
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(n);
}
