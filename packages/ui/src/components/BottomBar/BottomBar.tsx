import { useEffect, useState } from 'react';
import { Button, Text } from '@shopify/polaris';
import { CircleDashed, CheckIcon } from 'lucide-react';

export interface BottomBarProps {
  open: boolean;
  message: string;
  isComplete?: boolean;
  onDismiss?: () => void;
}

const AnimatedMessageDots = ({
  message,
  active = true,
  speedMs = 300,
  maxDots = 3,
}: {
  message: string;
  active?: boolean;
  speedMs?: number;
  maxDots?: number;
}) => {
  const [dots, setDots] = useState(0);

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => {
      setDots((prev) => (prev + 1) % (maxDots + 1));
    }, speedMs);
    return () => clearInterval(id);
  }, [active, speedMs, maxDots]);

  return (
    <Text as="span" variant="bodyMd" aria-live="polite">
      {message}
      {'.'.repeat(dots)}
    </Text>
  );
};

export function BottomBar({ open, message, isComplete = false, onDismiss }: BottomBarProps) {
  return (
    <div
      className={[
        'fixed inset-x-0 bottom-0 z-[100]',
        'transform-gpu transition-all duration-300 ease-out will-change-transform',
        open
          ? 'translate-y-0 opacity-100 pointer-events-auto'
          : 'translate-y-full opacity-0 pointer-events-none',
      ].join(' ')}
      role="status"
      aria-live="polite"
    >
      <div className="bg-white border-t shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
        <div className="flex items-center gap-4 px-4 py-3">
          <div className="flex flex-1 items-center gap-2">
            {isComplete ? (
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-black">
                <CheckIcon size={10} className="text-white" strokeWidth={3} />
              </span>
            ) : (
              <CircleDashed size={16} className={open ? 'animate-spin text-black' : 'text-black'} />
            )}

            {isComplete ? (
              <Text as="span" variant="bodyMd">
                {message}
              </Text>
            ) : (
              <AnimatedMessageDots message={message} active={open} />
            )}
          </div>

          {isComplete && onDismiss && (
            <Button onClick={onDismiss} size="micro" variant="secondary">
              Dismiss
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
