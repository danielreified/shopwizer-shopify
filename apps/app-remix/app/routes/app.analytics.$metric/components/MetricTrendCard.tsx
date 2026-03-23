import { LineChartCard, type ChartSeries } from "@repo/ui/components/LineChartCard";

interface MetricTrendCardProps {
  chartData: ChartSeries[];
  title: string;
  total: number;
  unit?: string;
}

export function MetricTrendCard({ chartData, title, total, unit = "" }: MetricTrendCardProps) {
  const primary = chartData[0] ?? { name: title, data: [] };

  return (
    <LineChartCard
      title={title}
      metric={total}
      metricSuffix="—"
      primary={primary}
      unit={unit}
      height={360}
    />
  );
}
