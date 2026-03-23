import { useId } from 'react';

export interface SwitchProps {
  checked: boolean;
  onChange?: (next: boolean) => void;
  disabled?: boolean;
  id?: string;
  label?: string;
}

export function Switch({ checked, onChange, disabled, id, label }: SwitchProps) {
  const generatedId = useId();
  const btnId = id ?? generatedId;

  const onTrack = 'bg-[#000000] hover:bg-[#0c0d0d] border border-transparent';
  const offTrack = 'bg-[#616161] hover:bg-[#6b6b6b] border border-[#616161]';

  return (
    <button
      id={btnId}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-disabled={disabled || undefined}
      aria-label={label || 'Toggle'}
      onClick={() => !disabled && onChange?.(!checked)}
      className={[
        'relative inline-flex h-5 w-8 items-center justify-start rounded-[6px] select-none',
        checked ? onTrack : offTrack,
        'transition-[background-color,border-color] duration-150 ease-out',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        'focus-visible:outline-none',
      ].join(' ')}
    >
      <span
        className={[
          'pointer-events-none h-3 w-3 rounded-[3px] bg-white',
          'shadow-sm ring-1 ring-black/5',
          'transform transition-transform duration-150 ease-out will-change-transform',
          checked ? 'translate-x-4' : 'translate-x-1',
          'active:scale-95',
        ].join(' ')}
      />
    </button>
  );
}

export default Switch;
