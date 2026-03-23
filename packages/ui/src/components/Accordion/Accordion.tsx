import type { ReactNode } from 'react';
import { Children, cloneElement, isValidElement, useMemo, useState, useId } from 'react';
import { BlockStack, Divider, Icon, InlineStack, Text } from '@shopify/polaris';
import { ChevronDownIcon } from '@shopify/polaris-icons';

export interface PolarisAccordionProps {
  className?: string;
  children?: ReactNode;
  multiple?: boolean;
  defaultOpen?: number[];
  value?: number[];
  onChange?: (open: number[]) => void;
  outlined?: boolean;
}

export interface PolarisAccordionItemProps {
  className?: string;
  title: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  children?: ReactNode;
}

export const PolarisAccordion: React.FC<PolarisAccordionProps> & {
  Item: React.FC<PolarisAccordionItemProps>;
} = ({
  className = '',
  children,
  multiple = false,
  defaultOpen = [],
  value,
  onChange,
  outlined = true,
}) => {
  const items = useMemo(() => Children.toArray(children).filter(isValidElement), [children]);

  const isControlled = Array.isArray(value);
  const [open, setOpen] = useState<number[]>(
    () => (isControlled ? (value as number[]) : defaultOpen) ?? [],
  );

  const current = (isControlled ? value : open) ?? [];
  const openSet = new Set<number>(current);

  const toggle = (index: number) => {
    const next = new Set(openSet);
    if (next.has(index)) next.delete(index);
    else {
      if (!multiple) next.clear();
      next.add(index);
    }
    const arr = Array.from(next).sort((a, b) => a - b);
    if (isControlled) onChange?.(arr);
    else {
      setOpen(arr);
      onChange?.(arr);
    }
  };

  return (
    <div
      className={`${outlined ? 'border rounded-2xl' : ''} bg-white ${className}`}
      role="list"
      aria-label="Accordion"
    >
      <BlockStack>
        {items.map((child, i) =>
          cloneElement(child as React.ReactElement<any>, {
            _index: i,
            _open: openSet.has(i),
            _toggle: () => toggle(i),
            _showDivider: i > 0,
            key: (child as any).key ?? i,
          }),
        )}
      </BlockStack>
    </div>
  );
};

const Item: React.FC<
  PolarisAccordionItemProps & {
    _index?: number;
    _open?: boolean;
    _toggle?: () => void;
    _showDivider?: boolean;
  }
> = ({
  title,
  description,
  disabled = false,
  className = '',
  children,
  _open = false,
  _toggle,
  _showDivider = false,
}) => {
  const uid = useId();
  const panelId = `acc-panel-${uid}`;
  const btnId = `acc-btn-${uid}`;

  return (
    <div role="listitem" className={className}>
      {_showDivider ? <Divider /> : null}

      <button
        id={btnId}
        type="button"
        className={`w-full text-left px-4 py-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${disabled ? 'opacity-60 cursor-not-allowed' : 'hover:bg-gray-50'}`}
        aria-controls={panelId}
        aria-expanded={_open}
        disabled={disabled}
        onClick={() => !disabled && _toggle?.()}
      >
        <InlineStack align="space-between" blockAlign="center">
          <div className="min-w-0 flex flex-1">
            <Text as="span" variant="headingMd">
              {title}
            </Text>
            {description ? (
              <div className="mt-1">
                <Text as="p" tone="subdued">
                  {description}
                </Text>
              </div>
            ) : null}
          </div>
          <div className={`transition-transform duration-200 ${_open ? '' : 'rotate-180'}`}>
            <Icon source={ChevronDownIcon} tone="subdued" />
          </div>
        </InlineStack>
      </button>

      <div
        id={panelId}
        role="region"
        aria-labelledby={btnId}
        className={`grid transition-[grid-template-rows] duration-200 ease-out px-4 ${
          _open ? 'grid-rows-[1fr] pb-4' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <div className="border-t mb-4" />
          <div className="prose max-w-none">{children}</div>
        </div>
      </div>
    </div>
  );
};

PolarisAccordion.Item = Item;
