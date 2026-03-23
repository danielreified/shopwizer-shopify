import { useState, useEffect } from 'react';
import { Check, ChevronDown, ChevronUp, CircleDashed } from 'lucide-react';
import { Button, InlineStack, Text } from '@shopify/polaris';
import { CircleProgress } from '../CircleProgress';

export interface Step {
  label: string;
  description?: string;
  complete?: boolean;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

type OnboardingFabProps = {
  steps: Step[];
  initialOpen?: boolean;
  className?: string;
  variant?: 'fixed' | 'sidebar';
};

export function OnboardingFab({
  steps,
  initialOpen = false,
  className,
  variant = 'fixed',
}: OnboardingFabProps) {
  const [open, setOpen] = useState(initialOpen);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const completed = steps.filter((s) => s.complete).length;
  const total = steps.length;

  const isFixed = variant === 'fixed';
  const isSidebar = variant === 'sidebar';

  return (
    <div
      className={`
        ${isFixed ? 'fixed left-6 bottom-6 z-50 w-80 shadow-lg rounded-b-2xl' : 'relative z-[60] w-full'}
        bg-white overflow-visible
        transition-all duration-500 ease-out
        ${isFixed ? (mounted ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0') : ''}
        ${className ?? ''}
      `}
    >
      {/* Expanded Overlay (Sidebar variant only) */}
      {isSidebar && (
        <div
          className={`
            absolute bottom-0 left-0 right-0 bg-white shadow-2xl border-t border-gray-200 z-[70] overflow-hidden transition-all duration-300 ease-in-out
            ${open ? 'translate-y-0 opacity-100 pointer-events-auto' : 'translate-y-full opacity-0 pointer-events-none'}
          `}
          style={{ maxHeight: '600px' }}
        >
          <div
            className="flex items-center justify-between cursor-pointer select-none px-4 py-4 border-b"
            onClick={() => setOpen(false)}
          >
            <div className="flex items-center gap-2">
              <CircleProgress progress={(completed / Math.max(total, 1)) * 100} />
              <InlineStack align="center">
                <div className="flex items-center space-x-2">
                  <Text as="p" variant="bodyMd">
                    Get started
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    • {completed}/{total} steps
                  </Text>
                </div>
              </InlineStack>
            </div>
            <ChevronDown className="w-5 h-5 text-gray-600" />
          </div>

          <div className="overflow-y-auto px-4 py-4" style={{ maxHeight: '500px' }}>
            {steps.map((step, i) => {
              const currentStepIndex = steps.findIndex((s) => !s.complete);
              const isCurrentStep = i === currentStepIndex;

              return (
                <div key={i}>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <span className="mt-[3px]">
                        {step.complete ? (
                          <Check size={14} className="text-green-500" />
                        ) : (
                          <CircleDashed size={12} />
                        )}
                      </span>
                      <div className="flex items-center">
                        <Text
                          as="p"
                          variant="bodyMd"
                          textDecorationLine={step.complete ? 'line-through' : undefined}
                        >
                          {step.label}
                        </Text>
                      </div>
                    </div>
                  </div>
                  {isCurrentStep && step.description && (
                    <div className="ml-7 mt-1 gap-2 flex flex-col pb-2">
                      <Text as="p" variant="bodyMd" tone="subdued">
                        {step.description}
                      </Text>
                      {step.actionLabel && (
                        <div className="flex gap-2">
                          <Button onClick={step.onAction}>{step.actionLabel}</Button>
                          {step.secondaryActionLabel && (
                            <Button onClick={step.onSecondaryAction} variant="plain">
                              {step.secondaryActionLabel}
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  {i < steps.length - 1 && <hr className="my-2 border-gray-200" />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Trigger/Fixed Component */}
      {(!isSidebar || !open) && (
        <div
          className={`
            ${isFixed ? 'flex flex-col' : 'w-full rounded-b-lg hover:bg-gray-50 transition-colors py-4'}
            ${isFixed && open ? 'shadow-2xl translate-y-[-4px]' : 'translate-y-0'}
            transition-all duration-300 ease-out
          `}
        >
          <div
            className={`flex items-center justify-between cursor-pointer select-none ${isSidebar ? 'px-4 py-2' : 'px-4 py-4'} ${isFixed && open ? 'border-b' : ''}`}
            onClick={() => setOpen((o) => !o)}
          >
            <div className="flex items-center gap-2">
              <CircleProgress progress={(completed / Math.max(total, 1)) * 100} />
              <InlineStack align="center">
                <div className="flex items-center space-x-2">
                  <Text as="p" variant="bodyMd">
                    Get started
                  </Text>
                  {open && isFixed && (
                    <Text as="p" variant="bodySm" tone="subdued">
                      • {completed}/{total} steps
                    </Text>
                  )}
                </div>
              </InlineStack>
            </div>
            {open ? (
              <ChevronUp className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-600" />
            )}
          </div>

          {isFixed && (
            <div
              className={`overflow-hidden px-4 py-4 transition-all duration-300 ease-in-out ${open ? 'opacity-100 max-h-[1000px] translate-y-0' : 'opacity-0 max-h-0 translate-y-4 pointer-events-none'}`}
            >
              {steps.map((step, i) => {
                const currentStepIndex = steps.findIndex((s) => !s.complete);
                const isCurrentStep = i === currentStepIndex;

                return (
                  <div
                    key={i}
                    className={`transition-all duration-500 delay-[${i * 50}ms] ${open ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <span className="mt-[3px]">
                          {step.complete ? (
                            <Check size={14} className="text-green-500" />
                          ) : (
                            <CircleDashed size={12} />
                          )}
                        </span>
                        <div className="flex items-center">
                          <Text
                            as="p"
                            variant="bodyMd"
                            textDecorationLine={step.complete ? 'line-through' : undefined}
                          >
                            {step.label}
                          </Text>
                        </div>
                      </div>
                    </div>
                    {isCurrentStep && step.description && (
                      <div className="ml-7 mt-1 gap-2 flex flex-col">
                        <Text as="p" variant="bodyMd" tone="subdued">
                          {step.description}
                        </Text>
                        {step.actionLabel && (
                          <div className="flex gap-2">
                            <Button onClick={step.onAction}>{step.actionLabel}</Button>
                            {step.secondaryActionLabel && (
                              <Button onClick={step.onSecondaryAction} variant="plain">
                                {step.secondaryActionLabel}
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    {i < steps.length - 1 && <hr className="my-2 border-gray-200" />}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
