import { Card, Text } from '@shopify/polaris';
import { LineChart } from './LineChart';

const now = new Date();
const days = Array.from({ length: 14 }).map((_, i) => {
  const d = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - (13 - i)),
  );
  return d.toISOString();
});

const data = [
  {
    name: 'Total Requests',
    data: days.map((k, idx) => ({ key: k, value: Math.round(50 + 40 * Math.sin(idx / 2)) })),
  },
];

export default {
  component: () => (
    <div style={{ padding: 24 }}>
      <Card>
        <div style={{ padding: 16 }}>
          <Text variant="headingMd" as="h2">
            Total Requests
          </Text>
          <div style={{ marginTop: 12 }}>
            <LineChart data={data} theme="Light" height={360} />
          </div>
        </div>
      </Card>
    </div>
  ),
};
