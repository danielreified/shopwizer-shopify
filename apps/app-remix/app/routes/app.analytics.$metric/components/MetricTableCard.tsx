import { BlockStack, Card, DataTable, Text } from "@shopify/polaris";

type Row = [label: string, value: number];

interface MetricTableCardProps {
  rows: Row[];
  total: number;
  hasNext: boolean;
  title?: string;
  formatValue?: (value: number) => string;
}

export function MetricTableCard({
  rows,
  total,
  hasNext,
  title = "Metric breakdown",
  formatValue,
}: MetricTableCardProps) {
  const format = formatValue ?? ((value: number) => value.toLocaleString());
  const tableRows = rows.map(([label, value]) => [label, format(value)]);

  return (
    <Card>
      <BlockStack gap="300">
        <Text as="h3" variant="headingSm">
          {title}
        </Text>
        <DataTable
          columnContentTypes={["text", "text"]}
          headings={["Date", "Value"]}
          totals={[null, format(total)]}
          rows={tableRows}
          pagination={{
            hasPrevious: false,
            hasNext,
            onPrevious: () => {},
            onNext: () => {},
          }}
        />
      </BlockStack>
    </Card>
  );
}
