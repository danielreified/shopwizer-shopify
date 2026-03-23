// app/components/Guide.tsx
import type { ReactNode } from 'react';
import { Card, BlockStack, Box, InlineStack, Text, Button, Collapsible } from '@shopify/polaris';
import { CircleDashed, Check as CheckIcon } from 'lucide-react';
import { CircleProgress } from '../CircleProgress';

export type GuideItem = {
  id: string;
  title: string;
  description?: string;
  content?: ReactNode; // ⭐ NEW: custom UI block
  completed?: boolean;
  primaryAction?: { label: string; onClick?: () => void; loading?: boolean };
  secondaryAction?: { label: string; onClick?: () => void };
  media?: ReactNode;
  disabled?: boolean;
};

export type GuideProps = {
  onboardingStep: number;
  title: string;
  subtitle?: string;
  items: GuideItem[];
};

export function Guide({ onboardingStep, title, subtitle, items }: GuideProps) {
  const total = items.length;
  const completed = Math.max(0, Math.min(onboardingStep ?? 0, total));
  const progress = total ? Math.round((completed / total) * 100) : 0;

  const label =
    completed >= total ? `Completed ${total} of ${total}` : `Step ${completed + 1} of ${total}`;

  const forcedOpenId = completed < total ? items[completed]?.id : undefined;
  const isOpen = (id: string) => (forcedOpenId ? id === forcedOpenId : false);

  return (
    <Box>
      <Card>
        <BlockStack>
          <Box padding="400">
            <BlockStack gap="200">
              <InlineStack gap="200" blockAlign="center">
                <CircleProgress progress={progress} size={24} />
                <Text as="span" variant="bodySm">
                  {label}
                </Text>
              </InlineStack>

              <InlineStack align="space-between" blockAlign="center" wrap={false}>
                <Text as="h2" variant="headingMd">
                  {title}
                </Text>
              </InlineStack>

              {subtitle && (
                <Text as="p" tone="subdued">
                  {subtitle}
                </Text>
              )}
            </BlockStack>
          </Box>

          {/* Steps */}
          <BlockStack>
            {items.map((item, idx) => {
              const open = isOpen(item.id);
              const panelId = `${item.id}-panel`;
              const isCompleted = idx < completed;

              return (
                <div key={item.id}>
                  <Box>
                    <div
                      className={[
                        'rounded-md',
                        open ? 'bg-[var(--p-color-bg-surface-secondary)]' : '',
                      ].join(' ')}
                    >
                      {/* HEADER */}
                      <button
                        type="button"
                        onClick={() => {}}
                        disabled={!open || item.disabled}
                        aria-expanded={open}
                        aria-controls={panelId}
                        style={{
                          width: '100%',
                          background: 'transparent',
                          border: 0,
                          cursor: !open ? 'default' : 'pointer',
                          padding: 'var(--p-space-400)',
                          borderTopLeftRadius: 6,
                          borderTopRightRadius: 6,
                          outlineOffset: 2,
                        }}
                      >
                        <InlineStack align="space-between" blockAlign="center" wrap={false}>
                          <div className="flex flex-1 min-w-0">
                            <InlineStack gap="200" blockAlign="center" wrap>
                              {isCompleted ? (
                                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-black">
                                  <CheckIcon size={10} className="text-white" strokeWidth={3} />
                                </span>
                              ) : (
                                <CircleDashed size={16} />
                              )}

                              <Text
                                as="span"
                                variant="bodyMd"
                                fontWeight={open ? 'semibold' : 'regular'}
                              >
                                {item.title}
                              </Text>
                            </InlineStack>
                          </div>
                        </InlineStack>
                      </button>

                      {/* COLLAPSIBLE BODY */}
                      <Collapsible id={panelId} open={open} transition={{ duration: '150' }}>
                        <Box padding="400" paddingBlockStart="0">
                          <InlineStack align="space-between" gap="400" wrap>
                            <div className="flex-1 min-w-0">
                              <BlockStack gap="300">
                                {/* TEXT DESCRIPTION */}
                                {item.description && <Text as="p">{item.description}</Text>}

                                {/* ⭐ CUSTOM CONTENT (radio buttons, chips, UI) */}
                                {item.content}

                                {/* BUTTONS */}
                                {(item.primaryAction || item.secondaryAction) && (
                                  <div className="flex gap-2">
                                    {item.primaryAction && (
                                      <Button
                                        onClick={item.primaryAction.onClick}
                                        loading={item.primaryAction.loading}
                                        variant="primary"
                                      >
                                        {item.primaryAction.label}
                                      </Button>
                                    )}

                                    {item.secondaryAction && (
                                      <Button
                                        onClick={item.secondaryAction.onClick}
                                        variant="secondary"
                                      >
                                        {item.secondaryAction.label}
                                      </Button>
                                    )}
                                  </div>
                                )}
                              </BlockStack>
                            </div>

                            {/* MEDIA IMAGE BLOCK */}
                            {item.media && (
                              <div className="relative top-[-24px]">
                                <Box minWidth="220px">{item.media}</Box>
                              </div>
                            )}
                          </InlineStack>
                        </Box>
                      </Collapsible>
                    </div>
                  </Box>
                </div>
              );
            })}
          </BlockStack>
        </BlockStack>
      </Card>
    </Box>
  );
}
