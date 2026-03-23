import React, { useState, useEffect } from 'react';
import { Text, InlineStack } from '@shopify/polaris';
import { CircleDashed, CheckIcon } from 'lucide-react';

const SyncIcon = CircleDashed as any;
const DoneIcon = CheckIcon as any;

export interface SyncStatusProps {
  message: string;
  isComplete?: boolean;
  className?: string;
  onDismiss?: () => void;
}

const AnimatedDots = ({ active = true }: { active?: boolean }) => {
  const [dots, setDots] = useState(0);

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => {
      setDots((prev) => (prev + 1) % 4);
    }, 400);
    return () => clearInterval(id);
  }, [active]);

  return <>{'.'.repeat(dots)}</>;
};

export function SyncStatus({ message, isComplete = false, className, onDismiss }: SyncStatusProps) {
  return (
    <div
      className={`
        bg-white border-t border-gray-100 px-4 py-3
        transition-all duration-300 ease-out
        ${className ?? ''}
      `}
    >
      <InlineStack align="space-between" blockAlign="center">
        <InlineStack gap="200" blockAlign="center">
          <div className="flex items-center justify-center w-5 h-5">
            {isComplete ? (
              <div className="bg-green-500 rounded-full p-0.5">
                <DoneIcon size={12} className="text-white" strokeWidth={3} />
              </div>
            ) : (
              <SyncIcon size={16} className="animate-spin text-gray-400" />
            )}
          </div>
          <Text as="p" variant="bodySm" tone={isComplete ? 'success' : 'subdued'}>
            {message}
            {!isComplete && <AnimatedDots />}
          </Text>
        </InlineStack>

        {isComplete && onDismiss && (
          <button
            onClick={onDismiss}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            Dismiss
          </button>
        )}
      </InlineStack>
    </div>
  );
}
