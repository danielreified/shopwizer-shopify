import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Button,
  Icon,
  Popover,
  Scrollable,
  TextField,
  DatePicker,
  OptionList,
  InlineStack,
  BlockStack,
  InlineGrid,
  Box,
} from '@shopify/polaris';
import { CalendarIcon, ArrowRightIcon } from '@shopify/polaris-icons';

// ============================================================================
// Types
// ============================================================================

export interface DateRange {
  since: Date;
  until: Date;
}

export interface DateRangePreset {
  title: string;
  alias: string;
  period: DateRange;
}

export interface DateRangePickerProps {
  /** Callback when date range is applied */
  onChange?: (range: DateRange) => void;
  /** Initial selected range (defaults to last 7 days) */
  initialRange?: DateRange;
  /** Custom presets to show in the list */
  presets?: DateRangePreset[];
  /** Disable dates after this date (defaults to today) */
  disableDatesAfter?: Date;
  /** Show multi-month calendar on large screens */
  multiMonth?: boolean;
}

// ============================================================================
// Helpers
// ============================================================================

const VALID_DATE_REGEX = /^\d{4}-\d{1,2}-\d{1,2}$/;

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isValidDateString(date: string): boolean {
  return VALID_DATE_REGEX.test(date) && !isNaN(new Date(date).getTime());
}

function parseDateString(input: string): Date {
  const [year, month, day] = input.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ============================================================================
// Default Presets
// ============================================================================

function createDefaultPresets(): DateRangePreset[] {
  const today = startOfDay(new Date());
  const yesterday = startOfDay(new Date(today.getTime() - 86400000));

  return [
    {
      title: 'Today',
      alias: 'today',
      period: { since: today, until: today },
    },
    {
      title: 'Yesterday',
      alias: 'yesterday',
      period: { since: yesterday, until: yesterday },
    },
    {
      title: 'Last 7 days',
      alias: 'last7days',
      period: {
        since: startOfDay(new Date(today.getTime() - 6 * 86400000)),
        until: today,
      },
    },
    {
      title: 'Last 30 days',
      alias: 'last30days',
      period: {
        since: startOfDay(new Date(today.getTime() - 29 * 86400000)),
        until: today,
      },
    },
    {
      title: 'Last 90 days',
      alias: 'last90days',
      period: {
        since: startOfDay(new Date(today.getTime() - 89 * 86400000)),
        until: today,
      },
    },
    {
      title: 'This month',
      alias: 'thisMonth',
      period: {
        since: new Date(today.getFullYear(), today.getMonth(), 1),
        until: today,
      },
    },
    {
      title: 'Last month',
      alias: 'lastMonth',
      period: {
        since: new Date(today.getFullYear(), today.getMonth() - 1, 1),
        until: new Date(today.getFullYear(), today.getMonth(), 0),
      },
    },
  ];
}

// ============================================================================
// Component
// ============================================================================

export function DateRangePicker({
  onChange,
  initialRange,
  presets,
  disableDatesAfter,
  multiMonth = true,
}: DateRangePickerProps) {
  const datePickerRef = useRef<HTMLDivElement>(null);
  const defaultPresets = useMemo(() => presets ?? createDefaultPresets(), [presets]);
  const defaultRange = initialRange ?? defaultPresets[2].period; // Last 7 days

  // State
  const [popoverActive, setPopoverActive] = useState(false);
  const [activeDateRange, setActiveDateRange] = useState<DateRangePreset>(() => {
    const match = defaultPresets.find(
      (p) =>
        p.period.since.getTime() === defaultRange.since.getTime() &&
        p.period.until.getTime() === defaultRange.until.getTime(),
    );
    return (
      match ?? {
        title: 'Custom',
        alias: 'custom',
        period: defaultRange,
      }
    );
  });

  const [inputValues, setInputValues] = useState({
    since: formatDate(activeDateRange.period.since),
    until: formatDate(activeDateRange.period.until),
  });

  const [{ month, year }, setDate] = useState({
    month: activeDateRange.period.until.getMonth(),
    year: activeDateRange.period.until.getFullYear(),
  });

  // Sync input values when active range changes
  useEffect(() => {
    setInputValues({
      since: formatDate(activeDateRange.period.since),
      until: formatDate(activeDateRange.period.until),
    });

    // Scroll calendar to show the selected range
    const untilMonth = activeDateRange.period.until.getMonth();
    const untilYear = activeDateRange.period.until.getFullYear();
    const monthDiff = (year - untilYear) * 12 + (month - untilMonth);

    if (monthDiff > 1 || monthDiff < 0) {
      setDate({ month: untilMonth, year: untilYear });
    }
  }, [activeDateRange, month, year]);

  // Handlers
  const handleStartInputChange = useCallback((value: string) => {
    setInputValues((prev) => ({ ...prev, since: value }));

    if (isValidDateString(value)) {
      const newSince = parseDateString(value);
      setActiveDateRange((prev) => ({
        title: 'Custom',
        alias: 'custom',
        period: {
          since: newSince,
          until: newSince <= prev.period.until ? prev.period.until : newSince,
        },
      }));
    }
  }, []);

  const handleEndInputChange = useCallback((value: string) => {
    setInputValues((prev) => ({ ...prev, until: value }));

    if (isValidDateString(value)) {
      const newUntil = parseDateString(value);
      setActiveDateRange((prev) => ({
        title: 'Custom',
        alias: 'custom',
        period: {
          since: newUntil >= prev.period.since ? prev.period.since : newUntil,
          until: newUntil,
        },
      }));
    }
  }, []);

  const handleCalendarChange = useCallback(
    ({ start, end }: { start: Date; end: Date }) => {
      const match = defaultPresets.find(
        (p) =>
          p.period.since.getTime() === start.getTime() &&
          p.period.until.getTime() === end.getTime(),
      );

      setActiveDateRange(
        match ?? {
          title: 'Custom',
          alias: 'custom',
          period: { since: start, until: end },
        },
      );
    },
    [defaultPresets],
  );

  const handlePresetSelect = useCallback(
    (selected: string[]) => {
      const preset = defaultPresets.find((p) => p.alias === selected[0]);
      if (preset) {
        setActiveDateRange(preset);
      }
    },
    [defaultPresets],
  );

  const handleApply = useCallback(() => {
    setPopoverActive(false);
    onChange?.(activeDateRange.period);
  }, [activeDateRange, onChange]);

  const handleCancel = useCallback(() => {
    setPopoverActive(false);
  }, []);

  // Button label
  const buttonLabel = useMemo(() => {
    if (activeDateRange.alias !== 'custom') {
      return activeDateRange.title;
    }
    return `${formatDisplayDate(activeDateRange.period.since)} – ${formatDisplayDate(activeDateRange.period.until)}`;
  }, [activeDateRange]);

  return (
    <Popover
      active={popoverActive}
      autofocusTarget="none"
      preferredAlignment="left"
      preferredPosition="below"
      fluidContent
      sectioned={false}
      fullHeight
      activator={
        <Button size="slim" icon={CalendarIcon} onClick={() => setPopoverActive((v) => !v)}>
          {buttonLabel}
        </Button>
      }
      onClose={() => setPopoverActive(false)}
    >
      <Popover.Pane fixed>
        <InlineGrid columns={{ xs: '1fr', md: 'max-content max-content' }} gap="0">
          {/* Presets List */}
          <Box
            maxWidth="212px"
            width="212px"
            padding="0"
            borderInlineEndWidth="025"
            borderColor="border"
          >
            <Scrollable style={{ height: '334px' }}>
              <OptionList
                options={defaultPresets.map((preset) => ({
                  value: preset.alias,
                  label: preset.title,
                }))}
                selected={[activeDateRange.alias]}
                onChange={handlePresetSelect}
              />
            </Scrollable>
          </Box>

          {/* Calendar */}
          <Box padding="400" maxWidth="516px" ref={datePickerRef}>
            <BlockStack gap="400">
              {/* Date Inputs */}
              <InlineStack gap="200" align="center">
                <div style={{ flexGrow: 1 }}>
                  <TextField
                    label="Start date"
                    labelHidden
                    prefix={<Icon source={CalendarIcon} />}
                    value={inputValues.since}
                    onChange={handleStartInputChange}
                    autoComplete="off"
                    placeholder="YYYY-MM-DD"
                  />
                </div>
                <Icon source={ArrowRightIcon} tone="subdued" />
                <div style={{ flexGrow: 1 }}>
                  <TextField
                    label="End date"
                    labelHidden
                    prefix={<Icon source={CalendarIcon} />}
                    value={inputValues.until}
                    onChange={handleEndInputChange}
                    autoComplete="off"
                    placeholder="YYYY-MM-DD"
                  />
                </div>
              </InlineStack>

              {/* Calendar Picker */}
              <DatePicker
                month={month}
                year={year}
                selected={{
                  start: activeDateRange.period.since,
                  end: activeDateRange.period.until,
                }}
                onMonthChange={(m, y) => setDate({ month: m, year: y })}
                onChange={handleCalendarChange}
                disableDatesAfter={disableDatesAfter ?? new Date()}
                multiMonth={multiMonth}
                allowRange
              />
            </BlockStack>
          </Box>
        </InlineGrid>
      </Popover.Pane>

      {/* Action Buttons */}
      <Popover.Pane fixed>
        <Popover.Section>
          <InlineStack align="end" gap="200">
            <Button onClick={handleCancel}>Cancel</Button>
            <Button variant="primary" onClick={handleApply}>
              Apply
            </Button>
          </InlineStack>
        </Popover.Section>
      </Popover.Pane>
    </Popover>
  );
}

export default DateRangePicker;
