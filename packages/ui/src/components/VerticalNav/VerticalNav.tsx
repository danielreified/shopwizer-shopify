import React, { createContext, useContext, useMemo } from 'react';
import { Text } from '@shopify/polaris';

type NavContext = {
  activeHref?: string;
  activeId?: string | number;
  onNavigate?: (to: string, evt: React.MouseEvent) => void;
  dense?: boolean;
};

const Ctx = createContext<NavContext | null>(null);
const useNav = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('VerticalNav.Item must be used inside <VerticalNav>');
  return ctx;
};

export type VerticalNavProps = {
  activeHref?: string;
  activeId?: string | number;
  onNavigate?: (to: string, evt: React.MouseEvent) => void;
  ariaLabel?: string;
  className?: string;
  children?: React.ReactNode;
  /** Slightly tighter row heights if true */
  dense?: boolean;
};

export function VerticalNav({
  activeHref,
  activeId,
  onNavigate,
  ariaLabel = 'Vertical navigation',
  className = '',
  children,
  dense = false,
}: VerticalNavProps) {
  const value = useMemo(
    () => ({ activeHref, activeId, onNavigate, dense }),
    [activeHref, activeId, onNavigate, dense],
  );

  return (
    <Ctx.Provider value={value}>
      <ul role="navigation" aria-label={ariaLabel} className={`list-none m-0 p-1 ${className}`}>
        {children}
      </ul>
    </Ctx.Provider>
  );
}

export type VerticalNavItemProps = {
  id?: string | number;
  href?: string;
  label: string;
  icon?: React.ReactNode; // e.g. <Icon source={...}/> or <svg/>
  onClick?: (evt: React.MouseEvent) => void;
  active?: boolean; // optional override
  className?: string;
};

VerticalNav.Item = function Item({
  id,
  href = '#',
  label,
  icon,
  onClick,
  active,
  className = '',
}: VerticalNavItemProps) {
  const { activeHref, activeId, onNavigate, dense } = useNav();

  const isActive =
    typeof active === 'boolean'
      ? active
      : (activeHref && href === activeHref) || (activeId && id === activeId);

  const baseRow =
    'flex items-center gap-3 rounded-md transition-colors select-none no-underline hover:bg-gray-50'; // text-[#616161]
  const size = dense ? 'h-4 px-2' : 'h-7 px-3';
  const activeRow = isActive ? ' bg-gray-100 text-[#000]' : '';
  const classes = `${baseRow} ${size} ${activeRow} ${className}`;

  const handleClick = (e: React.MouseEvent) => {
    onClick?.(e);
    if (!e.defaultPrevented && onNavigate && href) {
      e.preventDefault();
      onNavigate(href, e);
    }
  };

  const activeTone = isActive ? '' : 'subdued';

  return (
    <li className="my-0.5">
      <a
        href={href}
        className={classes}
        aria-current={isActive ? 'page' : undefined}
        onClick={handleClick}
      >
        {/* Left icon slot (fixed box so labels align) */}
        <span className="w-4 h-4 shrink-0 inline-flex items-center justify-center ">{icon}</span>

        {/* Label */}
        <Text variant="bodySm" as="p" tone={activeTone}>
          {label}
        </Text>
        {/* <span className="flex-1 text-xs leading-none whitespace-nowrap">{label} fds</span> */}

        {/* Right spacer for layout parity */}
        <span className="w-4 h-4 shrink-0" />
      </a>
    </li>
  );
};
