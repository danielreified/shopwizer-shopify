import React, { Children, cloneElement, isValidElement } from 'react';
import { BlockStack, InlineStack, Text, Icon, Divider } from '@shopify/polaris';
import { ChevronRightIcon } from '@shopify/polaris-icons';

type Common = { className?: string; children?: React.ReactNode };

export type PolarisMenuProps = Common & {
  outlined?: boolean;
  insetDividers?: boolean;
  size?: 'small' | 'medium';
};

export function PolarisMenu({ children, insetDividers = true, size = 'small' }: PolarisMenuProps) {
  const items = Children.toArray(children).filter(Boolean);

  return (
    <div className="rounded-md">
      <div>
        <div className="bg-white overflow-hidden">
          <BlockStack role="list">
            {items.map((child, i) =>
              isValidElement(child)
                ? cloneElement(child as any, {
                    _index: i,
                    _last: i === items.length - 1,
                    _inset: insetDividers,
                    _size: size,
                    key: (child as any).key ?? i,
                  })
                : child,
            )}
          </BlockStack>
        </div>
      </div>
    </div>
  );
}

type ItemProps = Common & {
  icon?: React.ReactNode;
  right?: React.ReactNode;
  target?: string;
  rel?: string;
  slot?: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  subText?: React.ReactNode;

  _index?: number;
  _last?: boolean;
  _inset?: boolean;
  _size?: 'small' | 'medium';
};

function Item({
  icon,
  slot,
  right,
  onClick,
  children,
  subText,
  _index = 0,
  _inset = true,
  _size = 'small',
}: ItemProps) {
  const hasSub = Boolean(subText);
  const pad = _size === 'medium' ? 'px-3 py-4' : 'p-2';
  const gapX = _size === 'medium' ? 'gap-3' : 'gap-2';
  const iconBox = _size === 'medium' ? 24 : 20;

  const Content = (
    <InlineStack>
      <div className={`flex w-full px-2 ${gapX}`}>
        <div className="flex flex-1 items-center">
          <div className="flex w-full items-center">
            <div
              className="shrink-0 flex items-center justify-center"
              style={{ width: iconBox, height: iconBox }}
            >
              {icon ?? <span style={{ width: iconBox, height: iconBox }} />}
            </div>

            <div className="ml-4 flex-1">
              {hasSub ? (
                <div className="flex flex-col text-left">
                  <Text as="span" tone="base">
                    {children}
                  </Text>
                  <Text as="span" variant="bodySm" tone="subdued">
                    {subText}
                  </Text>
                </div>
              ) : (
                <div className="flex flex-col text-left">{children}</div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center shrink-0 self-center">
          <InlineStack align="center">{slot}</InlineStack>
          {right ?? <Icon source={ChevronRightIcon} tone="subdued" />}
        </div>
      </div>
    </InlineStack>
  );

  const className = `block w-full bg-transparent hover:bg-gray-100 ${pad} no-underline text-inherit`;

  return (
    <div role="listitem">
      {_inset && _index > 0 ? <Divider /> : null}
      <button type="button" onClick={onClick} className={className}>
        {Content}
      </button>
    </div>
  );
}

PolarisMenu.Item = Item;
