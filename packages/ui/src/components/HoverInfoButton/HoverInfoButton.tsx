import * as React from 'react';
import { Popover, Box, Icon } from '@shopify/polaris';
import { InfoIcon } from '@shopify/polaris-icons';

export type HoverInfoButtonProps = {
  /** Content to show inside the popover */
  children: React.ReactNode;
  /** Accessible label for the activator button */
  label?: string;
};

export function HoverInfoButton({ children, label = 'More info' }: HoverInfoButtonProps) {
  const [open, setOpen] = React.useState(false);
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const openTimer = React.useRef<number | null>(null);
  const closeTimer = React.useRef<number | null>(null);

  const clearTimers = () => {
    if (openTimer.current) {
      window.clearTimeout(openTimer.current);
      openTimer.current = null;
    }
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const scheduleOpen = () => {
    clearTimers();
    openTimer.current = window.setTimeout(() => setOpen(true), 80);
  };

  const scheduleClose = () => {
    clearTimers();
    closeTimer.current = window.setTimeout(() => setOpen(false), 120);
  };

  const onFocus = () => {
    clearTimers();
    setOpen(true);
  };
  const onBlur: React.FocusEventHandler<HTMLDivElement> = (e) => {
    if (!wrapperRef.current?.contains(e.relatedTarget as Node)) {
      scheduleClose();
    }
  };

  const onClick = () => setOpen((v) => !v);

  React.useEffect(() => clearTimers, []);

  const activator = (
    <button
      type="button"
      aria-label={label}
      aria-haspopup="dialog"
      aria-expanded={open}
      onClick={onClick}
      onMouseEnter={scheduleOpen}
      onFocus={onFocus}
      className="p-[1px] rounded hover:bg-gray-100"
    >
      <Icon tone="subdued" source={InfoIcon} />
    </button>
  );

  return (
    <div
      ref={wrapperRef}
      onMouseEnter={scheduleOpen}
      onMouseLeave={scheduleClose}
      onBlur={onBlur}
      className="inline-flex"
    >
      <Popover
        active={open}
        activator={activator}
        onClose={() => setOpen(false)}
        autofocusTarget="none"
        preferBelow={false}
      >
        <Box padding="400" maxWidth="360px">
          {children}
        </Box>
      </Popover>
    </div>
  );
}
