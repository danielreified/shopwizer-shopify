import type { ReactNode } from 'react';
import * as React from 'react';
import { Card, Text } from '@shopify/polaris';
import { LineChart } from '../LineChart';
import { SkeletonText, SkeletonBlock } from '../Skeleton';
import type { ChartSeries } from '../LineChartCard';

type Props = {
  title: string;
  metric?: ReactNode;
  metricSuffix?: ReactNode;
  series: ChartSeries[];
  height?: number;
  theme?: 'Light' | 'Dark';
  loading?: boolean;
  onTitleClick?: () => void;
};

export const MultiLineChartCard = ({
  title,
  metric,
  metricSuffix,
  series,
  height = 300,
  theme = 'Light',
  loading = false,
  onTitleClick,
}: Props) => {
  const data = React.useMemo(() => {
    if (loading) return [];
    return series.map((s) => ({ ...s, style: s.style || 'solid' }));
  }, [series, loading]);

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
      </div>

      <div className="px-4 pb-4">
        {/* Metric display */}
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
                      {typeof metric === 'number' ? formatNumber(metric) : metric}
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

        {/* Chart - uses built-in Polaris Viz legend */}
        {loading ? (
          <SkeletonBlock height={height} className="rounded-xl mt-4" />
        ) : (
          <LineChart
            className="py-4"
            data={data}
            theme={theme}
            height={height}
            showLegend={series.length > 0}
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
