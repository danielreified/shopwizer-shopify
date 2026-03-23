import * as React from 'react';
import { Popover, Badge, Box } from '@shopify/polaris';

type Props = {
  parentCategory: string;
  leafCategory: string;
  popoverContent: React.ReactNode;
};

export function CategoryBadgePopover({ parentCategory, leafCategory, popoverContent }: Props) {
  const [open, setOpen] = React.useState(false);

  const toggle = () => setOpen((v) => !v);
  const openOn = () => setOpen(true);
  const closeOn = () => setOpen(false);

  const activator = (
    <button
      type="button"
      onClick={toggle}
      onMouseEnter={openOn}
      onMouseLeave={closeOn}
      onFocus={openOn}
      onBlur={closeOn}
      aria-haspopup="dialog"
      aria-expanded={open}
      // make the button look like plain text so the Badge is the visual
      style={{
        background: 'none',
        border: 0,
        padding: 0,
        lineHeight: 0,
        cursor: 'pointer',
      }}
    >
      <Badge tone="info" size="large">
        <b>{leafCategory}</b> in {parentCategory}
      </Badge>
    </button>
  );

  return (
    <Popover
      active={open}
      activator={activator}
      onClose={closeOn}
      autofocusTarget="none"
      preferBelow
    >
      <Box padding="400" maxWidth="360px">
        {popoverContent}
      </Box>
    </Popover>
  );
}
