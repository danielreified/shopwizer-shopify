import { BlockStack, Button, Card, ChoiceList, InlineStack, Popover } from "@shopify/polaris";
import { DateRangePicker } from "@repo/ui/components/DateRangePicker";
import { allowedPeriods } from "../../../utils/analytics";

interface MetricControlsProps {
  selectedPeriod: string[];
  popoverActive: boolean;
  onTogglePopover: () => void;
  onClosePopover: () => void;
  onPeriodChange: (value: string[]) => void;
  onDateChange: (range: { since: Date; until: Date }) => void;
  layout?: "horizontal" | "vertical";
}

export function MetricControls({
  selectedPeriod,
  popoverActive,
  onTogglePopover,
  onClosePopover,
  onPeriodChange,
  onDateChange,
  layout = "horizontal",
}: MetricControlsProps) {
  const periodButton = (
    <Popover
      active={popoverActive}
      activator={
        <Button onClick={onTogglePopover} disclosure>
          {selectedPeriod[0]}
        </Button>
      }
      autofocusTarget="first-node"
      onClose={onClosePopover}
    >
      <Card>
        <ChoiceList
          title="Period"
          titleHidden
          choices={allowedPeriods.map((p) => ({ label: p, value: p }))}
          selected={selectedPeriod}
          onChange={onPeriodChange}
        />
      </Card>
    </Popover>
  );

  if (layout === "vertical") {
    return (
      <BlockStack gap="200">
        <DateRangePicker onChange={onDateChange} />
        {periodButton}
      </BlockStack>
    );
  }

  return (
    <InlineStack wrap={false} gap="200">
      <DateRangePicker onChange={onDateChange} />
      {periodButton}
    </InlineStack>
  );
}
