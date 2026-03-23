import { AppProvider, Text, Badge } from '@shopify/polaris';
import en from '@shopify/polaris/locales/en.json';
import { HeroCard, HeroItemCard } from './HeroCard'; // 🆕 import HeroItemCard
import { LineChartCard } from '../LineChartCard';
import { type ChartSeries } from '../LineChartCard';
import { PolarisFixtureProvider } from '../PolarisFixtureProvider';

import { SimpleCard } from '../SimpleCard/SimpleCard';

import { PolarisMenu } from '../Menu/Menu';
import { KeyboardIcon, ReceiptIcon } from 'lucide-react';

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
const comparison = hourlySeries(-1, 14, fmtDate(comparisonDate));

const I = (Icon: any) => <Icon size={16} strokeWidth={2} />;

const RightSlot = () => (
  <div className="flex gap-4 flex-col">
    <PolarisMenu outlined insetDividers size="small">
      <PolarisMenu.Item
        slot={<Badge tone="success">Enabled</Badge>}
        icon={I(KeyboardIcon)}
        href="#"
      >
        Locksmith is{' '}
        <Text as="span" fontWeight="semibold">
          enabled
        </Text>
      </PolarisMenu.Item>

      <PolarisMenu.Item slot={<Badge tone="success">Enabled</Badge>} icon={I(ReceiptIcon)} href="#">
        You have{' '}
        <Text as="span" fontWeight="semibold">
          11 trial days left
        </Text>
      </PolarisMenu.Item>

      <PolarisMenu.Item
        slot={<Badge tone="success">Enabled</Badge>}
        icon={I(KeyboardIcon)}
        href="#"
      >
        Locksmith is{' '}
        <Text as="span" fontWeight="semibold">
          enabled
        </Text>
      </PolarisMenu.Item>

      <PolarisMenu.Item slot={<Badge tone="success">Enabled</Badge>} icon={I(ReceiptIcon)} href="#">
        You have{' '}
        <Text as="span" fontWeight="semibold">
          11 trial days left
        </Text>
      </PolarisMenu.Item>
    </PolarisMenu>

    <SimpleCard
      title="Learn how to use Checkout Links"
      description="Learn how to use Checkout Links to its fullest potential with our documentation"
      href="https://example.com/docs"
    />
  </div>
);

export default {
  component: () => (
    <AppProvider i18n={en}>
      <PolarisFixtureProvider>
        <div style={{ padding: 20, background: '#f6f6f7' }}>
          <HeroCard
            imageUrl="https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1600&auto=format&fit=crop"
            imageHeight={220}
            leftSlot={
              <LineChartCard
                title="Total sales over time"
                metric={5}
                metricSuffix="—"
                primary={primary}
                comparison={comparison}
                unit="ZAR"
                height={300}
                infoContent={
                  <div>
                    <div className="mb-2">
                      <strong>Total sales over time</strong>
                    </div>
                    <div className="mb-3">
                      Amount spent (subtotal, taxes, shipping, returns, discounts, fees, etc.)
                    </div>
                    <div style={{ whiteSpace: 'pre-wrap' }}>
                      <span style={{ color: '#008060' }}>Total sales</span> = net sales + additional
                      fees + {'\n'}
                      duties + shipping charges + taxes
                    </div>
                  </div>
                }
              />
            }
            rightSlot={<RightSlot />}
            overlay={
              <div className="flex items-center gap-6 max-md:flex-col max-md:items-start">
                <HeroItemCard
                  label="Generated Revenue"
                  value={3104}
                  prefix="ZAR"
                  colorClass="text-gray-900"
                />

                <div className="w-px h-10 bg-gradient-to-b from-transparent via-gray-400/50 to-transparent max-md:hidden" />

                <HeroItemCard label="Generated Orders" value={12} colorClass="text-gray-900" />
              </div>
            }
          />
        </div>
      </PolarisFixtureProvider>
    </AppProvider>
  ),
};
