export { RouteErrorBoundary as ErrorBoundary } from "../../components/RouteErrorBoundary";
import type { ActionFunctionArgs } from "react-router";
import { useFetcher, useNavigate, useParams } from "react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge, BlockStack, Card, InlineStack, Text } from "@shopify/polaris";
import { ThreePaneLayout } from "@repo/ui";
import { z } from "zod";

import { Period, allowedPeriods, toUTCDate } from "../../utils/analytics";
import { MetricControls, MetricTableCard, MetricTrendCard } from "./components";
import { authenticate } from "../../shopify.server";
import { SidebarGroup, SidebarItem } from "../../components/SidebarMenu";
import OnboardingFab from "../../components/OnboardingFab.app";
import { usePaneMode } from "../../hooks/use-pane-mode";

type Row = [label: string, value: number];
type ChartPoint = { key: string; value: number };
type ChartSeries = { name: string; data: ChartPoint[] };

type ActionOk = {
  ok: true;
  rows: Row[];
  period: Period;
  limitReached: boolean;
  total: number;
  chartData: ChartSeries[];
};

type ActionError = {
  ok: false;
  error: string;
};

type ActionResult = ActionOk | ActionError;

const ActionSchema = z.object({
  actionType: z.literal("fetchMetric"),
  period: z.enum(allowedPeriods),
  since: z.string().datetime(),
  until: z.string().datetime(),
});

type MetricQueryResult = {
  rows: Row[];
  chart: ChartSeries;
  total: number;
};

type MetricConfig = {
  title: string;
  description: string;
  unit: "currency" | "count";
};

const METRIC_CONFIG = {
  "attributed-sales": {
    title: "Attributed sales",
    description: "Revenue from recommendation clicks",
    unit: "currency",
  },
  "attributed-orders": {
    title: "Attributed orders",
    description: "Orders with at least one attributed item",
    unit: "count",
  },
  "attributed-items": {
    title: "Attributed items",
    description: "Attributed line-item quantities",
    unit: "count",
  },
  "total-sales": {
    title: "Total sales",
    description: "All storefront sales",
    unit: "currency",
  },
  orders: {
    title: "Orders",
    description: "All orders in selected range",
    unit: "count",
  },
} satisfies Record<string, MetricConfig>;

type MetricKey = keyof typeof METRIC_CONFIG;

const METRIC_NAV_ORDER: MetricKey[] = [
  "attributed-sales",
  "attributed-orders",
  "attributed-items",
  "total-sales",
  "orders",
];

function isMetricKey(value: string): value is MetricKey {
  return value in METRIC_CONFIG;
}

function createInitialRange() {
  const now = new Date();
  const since = new Date(now);
  since.setUTCDate(now.getUTCDate() - 13);
  return { since, until: now };
}

function formatIntervalValue(value: number, unit: MetricConfig["unit"]) {
  if (value === 0) return "—";
  if (unit === "currency") {
    return `R ${new Intl.NumberFormat("en-ZA", { maximumFractionDigits: 2 }).format(value)}`;
  }
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
}

function formatDateForHeader(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shopId = session.shop;

  const form = await request.formData();
  const parsed = ActionSchema.safeParse({
    actionType: form.get("actionType"),
    period: form.get("period"),
    since: form.get("since"),
    until: form.get("until"),
  });

  if (!parsed.success) {
    return { ok: false, error: "Bad request" } satisfies ActionError;
  }

  const metricParam = String(params.metric || "");
  if (!isMetricKey(metricParam)) {
    return { ok: false, error: `Unknown metric: ${metricParam}` } satisfies ActionError;
  }

  const period = parsed.data.period;
  const since = new Date(parsed.data.since);
  const until = new Date(parsed.data.until);

  const {
    getFlexibleAttributedItems,
    getFlexibleAttributedOrdersCount,
    getFlexibleAttributedSales,
    getFlexibleOrdersCount,
    getFlexibleTotalSales,
  } = await import("../../services/analytics.server");

  const metricQueries: Record<
    MetricKey,
    (args: { shopId: string; since: Date; until: Date; period: Period }) => Promise<MetricQueryResult>
  > = {
    "attributed-sales": getFlexibleAttributedSales,
    "attributed-orders": getFlexibleAttributedOrdersCount,
    "attributed-items": getFlexibleAttributedItems,
    "total-sales": getFlexibleTotalSales,
    orders: getFlexibleOrdersCount,
  };

  const { rows, chart, total } = await metricQueries[metricParam]({
    shopId,
    since,
    until,
    period,
  });

  const limitReached = rows.length >= 1000;

  return {
    ok: true,
    rows,
    period,
    total,
    limitReached,
    chartData: [chart],
  } satisfies ActionOk;
}

export default function AnalyticsMetricPage() {
  const navigate = useNavigate();
  const { metric } = useParams();
  const fetcher = useFetcher<ActionResult>();
  const { isCompact, paneMode } = usePaneMode();

  const metricParam = String(metric || "");
  const metricKey: MetricKey = isMetricKey(metricParam) ? metricParam : "attributed-sales";
  const metricConfig = METRIC_CONFIG[metricKey];

  const [total, setTotal] = useState(0);
  const [rows, setRows] = useState<Row[]>([]);
  const [limitReached, setLimitReached] = useState(false);
  const [chartData, setChartData] = useState<ChartSeries[]>([]);
  const [currentPeriod, setCurrentPeriod] = useState<Period>("Daily");
  const [currentRange, setCurrentRange] = useState(createInitialRange);
  const [popoverActive, setPopoverActive] = useState(false);

  useEffect(() => {
    if (!isMetricKey(metricParam)) {
      navigate("/app/analytics/attributed-sales", { replace: true });
    }
  }, [metricParam, navigate]);

  useEffect(() => {
    if (fetcher.data?.ok) {
      setRows(fetcher.data.rows);
      setTotal(fetcher.data.total);
      setLimitReached(fetcher.data.limitReached);
      setChartData(fetcher.data.chartData);
    }
  }, [fetcher.data]);

  const fetchData = useCallback(
    (range: { since: Date; until: Date }, period: Period) => {
      if (!metric) return;
      const fd = new FormData();
      fd.append("actionType", "fetchMetric");
      fd.append("period", period);
      fd.append("since", range.since.toISOString());
      fd.append("until", range.until.toISOString());
      fetcher.submit(fd, { method: "post" });
    },
    [fetcher, metric],
  );

  useEffect(() => {
    fetchData(currentRange, currentPeriod);
  }, [fetchData, currentPeriod, currentRange]);

  const onDateChange = (range: { since: Date; until: Date }) => {
    setCurrentRange({
      since: toUTCDate(range.since),
      until: toUTCDate(range.until),
    });
  };

  const onPeriodChange = (value: string[]) => {
    const nextPeriod = value[0] as Period;
    setCurrentPeriod(nextPeriod);
    setPopoverActive(false);
  };

  const selectedPeriod = useMemo(() => [currentPeriod], [currentPeriod]);
  const pageRows = useMemo(() => rows.slice(0, 100), [rows]);
  const hasNext = rows.length > 100;

  const nonZeroIntervals = useMemo(
    () => rows.reduce((count, [, value]) => count + (value > 0 ? 1 : 0), 0),
    [rows],
  );

  const peak = useMemo(() => {
    if (rows.length === 0) return null;
    return rows.reduce((currentPeak, row) => (row[1] > currentPeak[1] ? row : currentPeak), rows[0]);
  }, [rows]);

  const average = rows.length > 0 ? total / rows.length : 0;
  const rangeText = `${formatDateForHeader(currentRange.since)} - ${formatDateForHeader(currentRange.until)}`;

  return (
    <ThreePaneLayout
      header={{
        backButton: { label: "Overview", onClick: () => navigate("/app") },
        title: metricConfig.title,
        badge: { text: currentPeriod, tone: "info" },
        actions: <Badge tone="info">{rangeText}</Badge>,
      }}
      leftPaneTitle="Analytics"
      leftPane={
        <BlockStack gap="400">
          <SidebarGroup title="Metrics">
            {METRIC_NAV_ORDER.map((key) => (
              <SidebarItem
                key={key}
                label={METRIC_CONFIG[key].title}
                description={METRIC_CONFIG[key].description}
                selected={metricKey === key}
                url={`/app/analytics/${key}`}
              />
            ))}
          </SidebarGroup>

          <SidebarGroup title="Filters" noDivider={true}>
            <MetricControls
              selectedPeriod={selectedPeriod}
              popoverActive={popoverActive}
              onTogglePopover={() => setPopoverActive((value) => !value)}
              onClosePopover={() => setPopoverActive(false)}
              onPeriodChange={onPeriodChange}
              onDateChange={onDateChange}
              layout="vertical"
            />
          </SidebarGroup>
        </BlockStack>
      }
      leftPaneBottom={<OnboardingFab variant="sidebar" />}
      rightPaneTitle="Summary"
      rightPane={
        <BlockStack gap="400">
          <Card padding="400">
            <BlockStack gap="250">
              <Text as="h3" variant="headingSm">
                Metric Summary
              </Text>
              <InlineStack align="space-between" blockAlign="center">
                <Text as="span" variant="bodySm" tone="subdued">
                  Total
                </Text>
                <Text as="span" variant="bodySm" fontWeight="bold">
                  {formatIntervalValue(total, metricConfig.unit)}
                </Text>
              </InlineStack>
              <InlineStack align="space-between" blockAlign="center">
                <Text as="span" variant="bodySm" tone="subdued">
                  Avg / interval
                </Text>
                <Text as="span" variant="bodySm" fontWeight="bold">
                  {formatIntervalValue(average, metricConfig.unit)}
                </Text>
              </InlineStack>
              <InlineStack align="space-between" blockAlign="center">
                <Text as="span" variant="bodySm" tone="subdued">
                  Peak interval
                </Text>
                <Text as="span" variant="bodySm" fontWeight="bold">
                  {peak ? `${peak[0]} · ${formatIntervalValue(peak[1], metricConfig.unit)}` : "—"}
                </Text>
              </InlineStack>
            </BlockStack>
          </Card>

          <Card padding="400">
            <BlockStack gap="250">
              <Text as="h3" variant="headingSm">
                Data Quality
              </Text>
              <InlineStack align="space-between" blockAlign="center">
                <Text as="span" variant="bodySm" tone="subdued">
                  Intervals with activity
                </Text>
                <Text as="span" variant="bodySm" fontWeight="bold">
                  {nonZeroIntervals} / {rows.length}
                </Text>
              </InlineStack>
              <InlineStack align="space-between" blockAlign="center">
                <Text as="span" variant="bodySm" tone="subdued">
                  Loaded rows
                </Text>
                <Badge tone={limitReached ? "warning" : "success"}>
                  {limitReached ? "Limited to first 1,000 rows" : `${rows.length} rows`}
                </Badge>
              </InlineStack>
              {fetcher.data && !fetcher.data.ok && (
                <Badge tone="critical">{fetcher.data.error}</Badge>
              )}
            </BlockStack>
          </Card>
        </BlockStack>
      }
      contentLayout="contained"
      leftPaneMode={paneMode}
      rightPaneMode={paneMode}
      leftPaneCollapsed={isCompact}
      rightPaneCollapsed={isCompact}
    >
      <div style={{ padding: isCompact ? "16px" : "24px" }}>
        <BlockStack gap="400">
          <MetricTrendCard
            chartData={chartData}
            title={`${metricConfig.title} trend`}
            total={total}
            unit={metricConfig.unit === "currency" ? "R" : ""}
          />
          <MetricTableCard
            rows={pageRows}
            total={total}
            hasNext={hasNext}
            title={`${metricConfig.title} by interval`}
            formatValue={(value) => formatIntervalValue(value, metricConfig.unit)}
          />
        </BlockStack>
      </div>
    </ThreePaneLayout>
  );
}
