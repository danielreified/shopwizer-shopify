import * as React from 'react';
import {
  Card,
  ResourceList,
  ResourceItem,
  Avatar,
  Text,
  Popover,
  Icon,
  Box,
} from '@shopify/polaris';
import { InfoIcon, BlankIcon } from '@shopify/polaris-icons';

/** Generic row item */
export type ListItem = {
  id: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  meta?: React.ReactNode;
  href?: string;
  /** Provide your own media OR just an avatar URL */
  media?: React.ReactNode;
  avatarSrc?: string;
  /** Optional right-side content for the row */
  right?: React.ReactNode;
};

type Props = {
  items: ListItem[];
  /** Count labels for the default count line */
  countLabels?: { singular: string; plural: string };
  /** Custom row renderer (bypass default row layout) */
  renderItem?: (item: ListItem) => React.ReactNode;
  emptyState?: React.ReactNode;

  /** Header (left) */
  headerTitle?: React.ReactNode;
  headerSubtitle?: React.ReactNode; // shown instead of default count if provided
  showCount?: boolean; // default true when no headerSubtitle

  /** Header (right) */
  headerHelpContent?: React.ReactNode; // popover content; hides icon if undefined
  headerHelpLabel?: string; // a11y label for icon
  headerRight?: React.ReactNode; // any extra node on the right

  /** Avatar size if using avatarSrc */
  mediaSize?: 'sm' | 'md' | 'lg';
  className?: string;
};

export function ResourceListCard({
  items,
  countLabels = { singular: 'item', plural: 'items' },
  renderItem,
  emptyState,

  headerTitle,
  headerSubtitle,
  showCount = true,

  headerHelpContent,
  headerHelpLabel = 'More info',
  headerRight,

  mediaSize = 'lg',
  className = '',
}: Props) {
  const countText = `Showing ${items.length} ${
    items.length === 1 ? countLabels.singular : countLabels.plural
  }`;

  /** ------------------------------------------------------------
   *  Default empty state (only if caller didn't pass one)
   * -------------------------------------------------------------*/
  const fallbackEmptyState = (
    <div className="px-4 py-6 text-center text-gray-500 mt-2 flex flex-col items-center gap-2">
      <Icon source={BlankIcon} tone="subdued" />
      <Text as="p" tone="subdued" variant="bodySm">
        This will start filling automatically once your store starts generating data.
      </Text>
    </div>
  );

  return (
    <Card>
      {(headerTitle || headerSubtitle || showCount || headerHelpContent || headerRight) && (
        <div className="px-4 py-2 pb-4 border-b border-neutral-200 bg-white flex items-start justify-between">
          <div>
            {headerTitle ? (
              <Text as="p" variant="headingMd">
                {headerTitle}
              </Text>
            ) : null}
            {headerSubtitle ? (
              <Text as="p" variant="bodySm" tone="subdued">
                {headerSubtitle}
              </Text>
            ) : showCount ? (
              <Text as="p" variant="bodySm" tone="subdued">
                {countText}
              </Text>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            {headerRight}
            {headerHelpContent ? (
              <HeaderHoverInfo label={headerHelpLabel}>{headerHelpContent}</HeaderHoverInfo>
            ) : null}
          </div>
        </div>
      )}

      <div className={className}>
        <ResourceList
          resourceName={countLabels}
          items={items}
          emptyState={emptyState ?? fallbackEmptyState}
          renderItem={(item) => {
            if (renderItem) return renderItem(item);

            const mediaNode =
              item.media ??
              (item.avatarSrc ? (
                <Avatar
                  customer
                  size={mediaSize}
                  name={`${item.title ?? ''}`}
                  source={item.avatarSrc}
                />
              ) : undefined);

            return (
              <ResourceItem
                id={item.id}
                url={item.href}
                media={mediaNode}
                accessibilityLabel={
                  typeof item.title === 'string' ? `View details for ${item.title}` : 'View details'
                }
                name={typeof item.title === 'string' ? item.title : undefined}
              >
                <div className="flex">
                  <div className="flex flex-1 flex-col">
                    <Text variant="bodySm" fontWeight="bold" as="h3">
                      {item.title}
                    </Text>
                    {item.subtitle ? (
                      <Text variant="bodyXs" as="p" fontWeight="medium">
                        {item.subtitle}
                      </Text>
                    ) : null}
                    {item.meta ? (
                      <Text variant="bodyXs" as="p">
                        {item.meta}
                      </Text>
                    ) : null}
                  </div>
                  {item.right ? (
                    <div className="self-center flex items-center justify-center h-6 px-2">
                      {item.right}
                    </div>
                  ) : null}
                </div>
              </ResourceItem>
            );
          }}
        />
      </div>
    </Card>
  );
}

/** Hover/focus popover for the header icon (top-right) */
function HeaderHoverInfo({
  children,
  label = 'More info',
}: {
  children: React.ReactNode;
  label?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const enter = () => setOpen(true);
  const leave = () => setOpen(false);

  const activator = (
    <button
      type="button"
      aria-label={label}
      onMouseEnter={enter}
      onFocus={enter}
      onBlur={leave}
      className="p-1 rounded hover:bg-gray-100"
    >
      <Icon tone="subdued" source={InfoIcon} />
    </button>
  );

  return (
    <Popover
      active={open}
      activator={activator}
      onClose={() => setOpen(false)}
      autofocusTarget="none"
      preferBelow={false}
    >
      <Box padding="400" maxWidth="360px" onMouseEnter={enter} onMouseLeave={leave}>
        {children}
      </Box>
    </Popover>
  );
}
