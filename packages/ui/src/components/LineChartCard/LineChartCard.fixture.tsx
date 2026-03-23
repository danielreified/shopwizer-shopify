import { LineChartCard } from '.';
import type { ChartSeries } from '.';
import { PolarisFixtureProvider } from '../PolarisFixtureProvider';

const today = new Date();
const fmtDate = (d: Date) => new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(d);
const iso = (d: Date) => d.toISOString();

function hourlySeries(offsetDays: number, spikeHourUTC: number, name: string): ChartSeries {
  const base = new Date(
    Date.UTC(
      today.getUTCFullYear(),
      today.getUTCMonth(),
      today.getUTCDate() + offsetDays,
      0,
      0,
      0,
      0,
    ),
  );

  const hours = Array.from({ length: 24 }).map((_, h) => {
    const d = new Date(base);
    d.setUTCHours(h);
    return { key: iso(d), value: h === spikeHourUTC ? 5 : 0 };
  });

  return { name, data: hours };
}

const primaryDate = new Date(today);
const comparisonDate = new Date(today);
comparisonDate.setUTCDate(today.getUTCDate() - 1);

const primary = hourlySeries(0, 8, fmtDate(primaryDate));

const Info = () => (
  <div>
    <div className="mb-2">
      <strong>Total sales over time</strong>
    </div>
    <div className="mb-3">
      Amount spent (subtotal, taxes, shipping, returns, discounts, fees, etc.)
    </div>
    <div style={{ whiteSpace: 'pre-wrap' }}>
      <span style={{ color: '#008060' }}>Total sales</span> = net sales + additional fees +{'\n'}
      duties + shipping charges + taxes
    </div>
  </div>
);

export default {
  component: () => (
    <PolarisFixtureProvider>
      <div style={{ padding: 24, maxWidth: 980 }}>
        <LineChartCard
          title="Total sales over time"
          metric={5}
          metricSuffix="—"
          primary={primary}
          unit="ZAR"
          height={300}
          infoContent={<Info />}
        />
      </div>
    </PolarisFixtureProvider>
  ),
};
