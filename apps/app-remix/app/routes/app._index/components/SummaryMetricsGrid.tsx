import { BlockStack, Card, InlineGrid, Text } from "@shopify/polaris";
import { SparkLineChart } from "@repo/ui/components/SparkLineChart";
import type { ChartSeries } from "@repo/ui/components/LineChartCard";

interface SummaryMetricsGridProps {
  attributedSales: number;
  attributedOrderCount: number;
  attributedItems: number;
  last7AttributedSales: ChartSeries;
  last7AttributedOrders: ChartSeries;
  last7AttributedItems: ChartSeries;
}

function toSparkSeries(series: ChartSeries) {
  return [
    {
      data: series.data.map((point) => ({
        key: point.key,
        value: Number(point.value ?? 0),
      })),
    },
  ];
}

function renderMetric(value: number, options?: { currency?: string }) {
  if (value === 0) {
    return (
      <Text as="span" variant="headingLg" fontWeight="regular">
        —
      </Text>
    );
  }

  return (
    <Text as="span" variant="headingMd">
      {options?.currency ? `${options.currency} ${value.toLocaleString("en-ZA")}` : value.toLocaleString()}
    </Text>
  );
}

export function SummaryMetricsGrid({
  attributedSales,
  attributedOrderCount,
  attributedItems,
  last7AttributedSales,
  last7AttributedOrders,
  last7AttributedItems,
}: SummaryMetricsGridProps) {
  return (
    <InlineGrid columns={{ xs: 1, sm: 2, md: 3 }} gap={{ xs: "200", md: "400" }}>
      <Card padding="400">
        <BlockStack gap="300">
          <div className="relative" style={{ width: "fit-content" }}>
            <Text as="h3" variant="headingSm">
              Attributed sales (30d)
            </Text>
            <div className="h-[-1px] border-b border-dotted border-gray-400" />
          </div>
          <BlockStack gap="100">
            {renderMetric(attributedSales, { currency: "R" })}
            <SparkLineChart
              data={toSparkSeries(last7AttributedSales)}
              height={56}
              isAnimated
            />
          </BlockStack>
        </BlockStack>
      </Card>
      <Card padding="400">
        <BlockStack gap="300">
          <div className="relative" style={{ width: "fit-content" }}>
            <Text as="h3" variant="headingSm">
              Attributed orders (30d)
            </Text>
            <div className="h-[-1px] border-b border-dotted border-gray-400" />
          </div>
          <BlockStack gap="100">
            {renderMetric(attributedOrderCount)}
            <SparkLineChart
              data={toSparkSeries(last7AttributedOrders)}
              height={56}
              isAnimated
            />
          </BlockStack>
        </BlockStack>
      </Card>
      <Card padding="400">
        <BlockStack gap="300">
          <div className="relative" style={{ width: "fit-content" }}>
            <Text as="h3" variant="headingSm">
              Attributed items (30d)
            </Text>
            <div className="h-[-1px] border-b border-dotted border-gray-400" />
          </div>
          <BlockStack gap="100">
            {renderMetric(attributedItems)}
            <SparkLineChart
              data={toSparkSeries(last7AttributedItems)}
              height={56}
              isAnimated
            />
          </BlockStack>
        </BlockStack>
      </Card>
    </InlineGrid>
  );
}
