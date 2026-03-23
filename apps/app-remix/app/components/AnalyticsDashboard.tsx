import {
  LineChartCard,
  type ChartSeries,
} from "@repo/ui/components/LineChartCard";
import { MultiLineChartCard } from "@repo/ui/components/MultiLineChartCard";
import { BlockStack, InlineGrid } from "@shopify/polaris";
import { useNavigate } from "react-router";

type RailClicksSeriesData = {
  series: ChartSeries[];
  totalClicks: number;
};

type RailImpressionsSeriesData = {
  series: ChartSeries[];
  totalImpressions: number;
};

type AttributedRevenuePercentageData = {
  name: string;
  data: { key: string; value: number }[];
  overallPercentage: number;
};

export default function Analytics({
  last30_attributedSales,
  last30_attributedOrderCount,
  last30_attributedItems,
  last7_attributedSales,
  last7_attributedOrders,
  last7_attributedItems,
  last7_railClicksSeries,
  last7_railImpressionsSeries,
  last7_attributedRevenuePercentage,
}: {
  last30_attributedSales: number;
  last30_attributedOrderCount: number;
  last30_attributedItems: number;
  last7_attributedSales: ChartSeries;
  last7_attributedOrders: ChartSeries;
  last7_attributedItems: ChartSeries;
  last7_railClicksSeries: RailClicksSeriesData;
  last7_railImpressionsSeries: RailImpressionsSeriesData;
  last7_attributedRevenuePercentage: AttributedRevenuePercentageData;
}) {
  const navigate = useNavigate();

  return (
    <BlockStack gap="600">
      {/* ---------------------------------------------- */}
      {/* LAST 7 DAYS — LINE CHARTS (2x2 grid)           */}
      {/* ---------------------------------------------- */}
      <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
        <LineChartCard
          title="Attributed sales (7d)"
          metric={last30_attributedSales}
          primary={last7_attributedSales}
          unit="ZAR"
          metricSuffix="—"
          height={300}
          onTitleClick={() => navigate("/app/analytics/attributed-sales")}
        />

        <LineChartCard
          title="Attributed orders (7d)"
          metric={last30_attributedOrderCount}
          metricSuffix="—"
          unit=""
          primary={last7_attributedOrders}
          height={300}
          onTitleClick={() => navigate("/app/analytics/attributed-orders")}
        />

        <LineChartCard
          title="Attributed items (7d)"
          metric={last30_attributedItems}
          metricSuffix="—"
          primary={last7_attributedItems}
          height={300}
          onTitleClick={() => navigate("/app/analytics/attributed-items")}
        />

        <LineChartCard
          title="Attributed revenue % (7d)"
          metric={last7_attributedRevenuePercentage.overallPercentage}
          metricSuffix="%"
          unit="%"
          primary={last7_attributedRevenuePercentage}
          height={300}
        />
      </InlineGrid>

      {/* ---------------------------------------------- */}
      {/* RAIL METRICS — LINE CHARTS (2-column)          */}
      {/* ---------------------------------------------- */}
      <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
        <MultiLineChartCard
          title="Rail clicks (7d)"
          metric={last7_railClicksSeries.totalClicks}
          metricSuffix="—"
          series={last7_railClicksSeries.series}
          height={300}
        />

        <MultiLineChartCard
          title="Rail impressions (7d)"
          metric={last7_railImpressionsSeries.totalImpressions}
          metricSuffix="—"
          series={last7_railImpressionsSeries.series}
          height={300}
        />
      </InlineGrid>
    </BlockStack>
  );
}
