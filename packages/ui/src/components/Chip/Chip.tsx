import type { ReactNode } from 'react';
import { Text } from '@shopify/polaris';

export interface ChipProps {
  slot?: ReactNode;
  children: ReactNode;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  className?: string;
}

// simple internal helper
function cx(...args: Array<string | false | null | undefined>) {
  return args.filter(Boolean).join(' ');
}

export function Chip({
  slot,
  children,
  onClick,
  active = false,
  disabled = false,
  className,
}: ChipProps) {
  const interactive = !!onClick && !disabled;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cx(
        // layout
        'inline-flex items-center gap-1.5 align-middle rounded-lg select-none',
        'min-h-[28px] px-2 py-1',
        'bg-[#F0F0F0] border border-transparent transition-colors',
        active && 'border-[#dcdcdc] bg-[#ebebec]',
        disabled
          ? 'opacity-60 cursor-not-allowed'
          : interactive
            ? 'cursor-pointer hover:bg-[#ebebec]'
            : 'cursor-default',
        className,
      )}
    >
      {slot && <span className="-translate-y-[0.5px] leading-none flex items-center">{slot}</span>}
      <Text as="span" tone={active ? '' : 'subdued'} variant="bodySm">
        {children}
      </Text>
    </button>
  );
}

export default Chip;
