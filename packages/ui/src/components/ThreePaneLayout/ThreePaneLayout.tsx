import React, { useState, useRef, useEffect } from 'react';
import { Box, Text, InlineStack, Button, Badge, Icon, Spinner } from '@shopify/polaris';
import { XIcon } from '@shopify/polaris-icons';
import { PanelLeft, PanelRight, ChevronDown } from 'lucide-react';

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------
export interface ThreePaneLayoutProps {
  /** Content for the left sidebar (navigation, actions) */
  leftPane?: React.ReactNode;
  /** Main content area */
  children: React.ReactNode;
  /** Content for the right sidebar (context, help, info) */
  rightPane?: React.ReactNode;
  /** Fixed bottom content for the left sidebar (e.g. settings link) */
  leftPaneBottom?: React.ReactNode;
  /** Fixed bottom content for the right sidebar (e.g. actions) */
  rightPaneBottom?: React.ReactNode;
  /** Width of left pane in pixels. Default: 260 */
  leftPaneWidth?: number;
  /** Width of right pane in pixels. Default: 280 */
  rightPaneWidth?: number;
  /** Header configuration */
  header?: {
    /** Back button config */
    backButton?: {
      label: string;
      onClick: () => void;
    };
    /** Title text */
    title: string;
    /** Optional badge next to title */
    badge?: {
      text: string;
      tone?: 'info' | 'success' | 'warning' | 'critical' | 'attention' | 'magic';
    };
    /** Right-side actions */
    actions?: React.ReactNode;
    /** Optional icon next to title */
    icon?: any;
  };
  /** Background color for main content area. Default: '#f6f6f7' */
  backgroundColor?: string;
  /** Whether to completely hide the left pane (no toggle) */
  hideLeftPane?: boolean;
  /** Whether to completely hide the right pane (no toggle) */
  hideRightPane?: boolean;
  /** Whether the left pane starts collapsed */
  leftPaneCollapsed?: boolean;
  /** Whether the right pane starts collapsed */
  rightPaneCollapsed?: boolean;
  /** Callback when left pane collapse state changes */
  onLeftPaneToggle?: (collapsed: boolean) => void;
  /** Callback when right pane collapse state changes */
  onRightPaneToggle?: (collapsed: boolean) => void;
  /** Title for left pane header */
  leftPaneTitle?: string;
  /** Title for right pane header */
  rightPaneTitle?: string;
  /** Allow collapsing panes (shows toggle buttons). Default: true */
  collapsible?: boolean;
  /** Layout for the main content area. 'fluid' is full width, 'contained' is max-width 1240px, 'narrow' is 800px. Default: 'fluid' */
  contentLayout?: 'fluid' | 'contained' | 'narrow';
  /** Header for the main content area, aligned with sidebar headers */
  contentHeader?: React.ReactNode;
  /** Whether the main content area is in a loading state */
  loading?: boolean;
  /** Layout mode for the left pane (inline in layout or overlay drawer) */
  leftPaneMode?: 'inline' | 'overlay';
  /** Layout mode for the right pane (inline in layout or overlay drawer) */
  rightPaneMode?: 'inline' | 'overlay';
}

// ---------------------------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------------------------
export function ThreePaneLayout({
  leftPane,
  children,
  rightPane,
  leftPaneBottom,
  rightPaneBottom,
  leftPaneWidth = 260,
  rightPaneWidth = 280,
  header,
  backgroundColor = '#f6f6f7',
  hideLeftPane = false,
  hideRightPane = false,
  leftPaneCollapsed: leftPaneCollapsedProp = false,
  rightPaneCollapsed: rightPaneCollapsedProp = false,
  onLeftPaneToggle,
  onRightPaneToggle,
  leftPaneTitle,
  rightPaneTitle,
  collapsible = true,
  contentLayout = 'fluid',
  contentHeader,
  loading = false,
  leftPaneMode = 'inline',
  rightPaneMode = 'inline',
}: ThreePaneLayoutProps) {
  const [leftCollapsed, setLeftCollapsed] = useState(leftPaneCollapsedProp);
  const [rightCollapsed, setRightCollapsed] = useState(rightPaneCollapsedProp);
  const [leftOverlayOpen, setLeftOverlayOpen] = useState(false);
  const [rightOverlayOpen, setRightOverlayOpen] = useState(false);

  const isLeftOverlay = leftPaneMode === 'overlay';
  const isRightOverlay = rightPaneMode === 'overlay';

  useEffect(() => {
    setLeftCollapsed(leftPaneCollapsedProp);
  }, [leftPaneCollapsedProp]);

  useEffect(() => {
    setRightCollapsed(rightPaneCollapsedProp);
  }, [rightPaneCollapsedProp]);

  useEffect(() => {
    if (!isLeftOverlay) {
      setLeftOverlayOpen(false);
    }
  }, [isLeftOverlay]);

  useEffect(() => {
    if (!isRightOverlay) {
      setRightOverlayOpen(false);
    }
  }, [isRightOverlay]);

  // Scroll hints logic
  const leftScrollRef = useRef<HTMLDivElement>(null);
  const rightScrollRef = useRef<HTMLDivElement>(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  const checkScroll = (ref: React.RefObject<HTMLDivElement>, setter: (show: boolean) => void) => {
    const el = ref.current;
    if (!el) return;
    const canScroll = el.scrollHeight > el.clientHeight;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 20;
    setter(canScroll && !atBottom);
  };

  useEffect(() => {
    const leftEl = leftScrollRef.current;
    if (leftEl) {
      const handleScroll = () => checkScroll(leftScrollRef, setShowLeftFade);
      leftEl.addEventListener('scroll', handleScroll);
      const observer = new ResizeObserver(handleScroll);
      observer.observe(leftEl);
      handleScroll();
      return () => {
        leftEl.removeEventListener('scroll', handleScroll);
        observer.disconnect();
      };
    }
  }, [leftPane, leftCollapsed]);

  useEffect(() => {
    const rightEl = rightScrollRef.current;
    if (rightEl) {
      const handleScroll = () => checkScroll(rightScrollRef, setShowRightFade);
      rightEl.addEventListener('scroll', handleScroll);
      const observer = new ResizeObserver(handleScroll);
      observer.observe(rightEl);
      handleScroll();
      return () => {
        rightEl.removeEventListener('scroll', handleScroll);
        observer.disconnect();
      };
    }
  }, [rightPane, rightCollapsed]);

  const toggleLeftPane = () => {
    if (isLeftOverlay) {
      setLeftOverlayOpen(true);
      setRightOverlayOpen(false);
      return;
    }
    const newState = !leftCollapsed;
    setLeftCollapsed(newState);
    onLeftPaneToggle?.(newState);
  };

  const toggleRightPane = () => {
    if (isRightOverlay) {
      setRightOverlayOpen(true);
      setLeftOverlayOpen(false);
      return;
    }
    const newState = !rightCollapsed;
    setRightCollapsed(newState);
    onRightPaneToggle?.(newState);
  };

  const collapsedPaneWidth = 44; // Width when collapsed (just the button)
  const leftPaneWidthValue =
    isLeftOverlay || (collapsible && leftCollapsed) ? collapsedPaneWidth : leftPaneWidth;
  const rightPaneWidthValue =
    isRightOverlay || (collapsible && rightCollapsed) ? collapsedPaneWidth : rightPaneWidth;

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (!leftOverlayOpen && !rightOverlayOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setLeftOverlayOpen(false);
        setRightOverlayOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [leftOverlayOpen, rightOverlayOpen]);

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor,
      }}
    >
      {/* Top Header Bar */}
      {header && (
        <Box padding="400" background="bg-surface" borderBlockEndWidth="025" borderColor="border">
          <InlineStack align="space-between" blockAlign="center">
            <InlineStack gap="300" blockAlign="center">
              {header.backButton && (
                <Button variant="tertiary" onClick={header.backButton.onClick}>
                  ← {header.backButton.label}
                </Button>
              )}
              {header.icon && (
                <div
                  style={{
                    width: 20,
                    height: 20,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {typeof header.icon === 'function' ||
                  (typeof header.icon === 'object' && (header.icon as any)?.$$typeof) ? (
                    React.createElement(header.icon as any, { size: 20 })
                  ) : (
                    <Icon source={header.icon} />
                  )}
                </div>
              )}
              <Text as="p" variant="bodyMd" fontWeight="semibold">
                {header.title}
              </Text>
              {header.badge && (
                <Badge tone={header.badge.tone || 'info'}>{header.badge.text}</Badge>
              )}
            </InlineStack>
            {header.actions && <InlineStack gap="200">{header.actions}</InlineStack>}
          </InlineStack>
        </Box>
      )}

      {/* Three Pane Content Area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left Pane */}
        {!hideLeftPane && leftPane && (
          <div
            style={{
              width: leftPaneWidthValue,
              transition: 'width 0.2s ease-in-out',
              display: 'flex',
              flexDirection: 'column',
              borderRight: '1px solid var(--p-color-border)',
              background: 'var(--p-color-bg-surface)',
            }}
          >
            {/* Pane Header with Toggle */}
            {collapsible && (
              <div
                style={{
                  padding: '8px',
                  borderBottom: '1px solid var(--p-color-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: leftCollapsed ? 'center' : 'space-between',
                  minHeight: 44,
                }}
              >
                {!leftCollapsed && leftPaneTitle && (
                  <Text as="span" variant="headingXs" tone="subdued">
                    {leftPaneTitle.toUpperCase()}
                  </Text>
                )}
                <button
                  onClick={toggleLeftPane}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 4,
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--p-color-icon-subdued)',
                  }}
                  title={leftCollapsed ? 'Expand panel' : 'Collapse panel'}
                >
                  <PanelLeft size={18} />
                </button>
              </div>
            )}
            {/* Pane Content */}
            {!leftCollapsed && !isLeftOverlay && (
              <>
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  <div
                    ref={leftScrollRef}
                    style={{
                      flex: 1,
                      overflowY: 'auto',
                      padding: 16,
                    }}
                  >
                    {leftPane}
                  </div>
                  {showLeftFade && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: 80,
                        background: 'linear-gradient(transparent, var(--p-color-bg-surface))',
                        pointerEvents: 'none',
                        display: 'flex',
                        alignItems: 'flex-end',
                        justifyContent: 'center',
                        paddingBottom: 12,
                        zIndex: 10,
                      }}
                    >
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          leftScrollRef.current?.scrollBy({ top: 150, behavior: 'smooth' });
                        }}
                        style={{
                          pointerEvents: 'auto',
                          cursor: 'pointer',
                          background: 'var(--p-color-bg-surface)',
                          border: '1px solid var(--p-color-border)',
                          borderRadius: '50%',
                          width: 32,
                          height: 32,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: 'var(--p-shadow-100)',
                          color: 'var(--p-color-icon-subdued)',
                        }}
                      >
                        <ChevronDown size={18} />
                      </div>
                    </div>
                  )}
                </div>
                {leftPaneBottom && (
                  <div
                    style={{
                      borderTop: '1px solid var(--p-color-border)',
                      flexShrink: 0,
                    }}
                  >
                    {leftPaneBottom}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Main Content */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {loading && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 100,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.4)',
                backdropFilter: 'blur(4px)',
              }}
            >
              <Spinner size="large" />
            </div>
          )}
          {contentHeader && (
            <div
              style={{
                padding: '8px 16px',
                borderBottom: '1px solid var(--p-color-border)',
                background: 'var(--p-color-bg-surface)',
                display: 'flex',
                alignItems: 'center',
                minHeight: 44,
              }}
            >
              <div
                style={{
                  width: '100%',
                  maxWidth:
                    contentLayout === 'contained'
                      ? 1240
                      : contentLayout === 'narrow'
                        ? 800
                        : 'none',
                  margin: contentLayout === 'fluid' ? '0' : '0 auto',
                }}
              >
                {contentHeader}
              </div>
            </div>
          )}
          <div
            style={{
              width: '100%',
              maxWidth:
                contentLayout === 'contained' ? 1240 : contentLayout === 'narrow' ? 800 : 'none',
              margin: contentLayout === 'fluid' ? '0' : '0 auto',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
            }}
          >
            {children}
          </div>
        </div>

        {/* Right Pane */}
        {!hideRightPane && rightPane && (
          <div
            style={{
              width: rightPaneWidthValue,
              transition: 'width 0.2s ease-in-out',
              display: 'flex',
              flexDirection: 'column',
              borderLeft: '1px solid var(--p-color-border)',
              background: 'var(--p-color-bg-surface)',
            }}
          >
            {/* Pane Header with Toggle */}
            {collapsible && (
              <div
                style={{
                  padding: '8px',
                  borderBottom: '1px solid var(--p-color-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: rightCollapsed ? 'center' : 'space-between',
                  minHeight: 44,
                }}
              >
                <button
                  onClick={toggleRightPane}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 4,
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--p-color-icon-subdued)',
                  }}
                  title={rightCollapsed ? 'Expand panel' : 'Collapse panel'}
                >
                  <PanelRight size={18} />
                </button>
                {!rightCollapsed && rightPaneTitle && (
                  <Text as="span" variant="headingXs" tone="subdued">
                    {rightPaneTitle.toUpperCase()}
                  </Text>
                )}
              </div>
            )}
            {/* Pane Content */}
            {!rightCollapsed && !isRightOverlay && (
              <>
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  <div
                    ref={rightScrollRef}
                    style={{
                      flex: 1,
                      overflowY: 'auto',
                      padding: 16,
                    }}
                  >
                    {rightPane}
                  </div>
                  {showRightFade && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: 80,
                        background: 'linear-gradient(transparent, var(--p-color-bg-surface))',
                        pointerEvents: 'none',
                        display: 'flex',
                        alignItems: 'flex-end',
                        justifyContent: 'center',
                        paddingBottom: 12,
                        zIndex: 10,
                      }}
                    >
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          rightScrollRef.current?.scrollBy({ top: 150, behavior: 'smooth' });
                        }}
                        style={{
                          pointerEvents: 'auto',
                          cursor: 'pointer',
                          background: 'var(--p-color-bg-surface)',
                          border: '1px solid var(--p-color-border)',
                          borderRadius: '50%',
                          width: 32,
                          height: 32,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: 'var(--p-shadow-100)',
                          color: 'var(--p-color-icon-subdued)',
                        }}
                      >
                        <ChevronDown size={18} />
                      </div>
                    </div>
                  )}
                </div>
                {rightPaneBottom && (
                  <div
                    style={{
                      padding: 16,
                      borderTop: '1px solid var(--p-color-border)',
                      flexShrink: 0,
                    }}
                  >
                    {rightPaneBottom}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
      {(isLeftOverlay || isRightOverlay) && (
        <>
          {(leftOverlayOpen || rightOverlayOpen) && (
            <div
              onClick={() => {
                setLeftOverlayOpen(false);
                setRightOverlayOpen(false);
              }}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.35)',
                zIndex: 510,
                transition: 'opacity 200ms ease',
              }}
            />
          )}
          {isLeftOverlay && leftPane && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                bottom: 0,
                left: 0,
                width: leftPaneWidth,
                background: 'var(--p-color-bg-surface)',
                borderRight: '1px solid var(--p-color-border)',
                boxShadow: 'var(--p-shadow-300)',
                zIndex: 520,
                display: 'flex',
                flexDirection: 'column',
                transform: leftOverlayOpen ? 'translateX(0)' : 'translateX(-100%)',
                transition: 'transform 220ms ease',
                willChange: 'transform',
                pointerEvents: leftOverlayOpen ? 'auto' : 'none',
              }}
              aria-hidden={!leftOverlayOpen}
            >
              <div
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--p-color-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  minHeight: 48,
                }}
              >
                <Text as="span" variant="headingSm">
                  {leftPaneTitle || 'Navigation'}
                </Text>
                <Button
                  icon={XIcon}
                  variant="tertiary"
                  accessibilityLabel="Close left panel"
                  onClick={() => setLeftOverlayOpen(false)}
                />
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>{leftPane}</div>
              {leftPaneBottom && (
                <div style={{ borderTop: '1px solid var(--p-color-border)' }}>{leftPaneBottom}</div>
              )}
            </div>
          )}
          {isRightOverlay && rightPane && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                bottom: 0,
                right: 0,
                width: rightPaneWidth,
                background: 'var(--p-color-bg-surface)',
                borderLeft: '1px solid var(--p-color-border)',
                boxShadow: 'var(--p-shadow-300)',
                zIndex: 520,
                display: 'flex',
                flexDirection: 'column',
                transform: rightOverlayOpen ? 'translateX(0)' : 'translateX(100%)',
                transition: 'transform 220ms ease',
                willChange: 'transform',
                pointerEvents: rightOverlayOpen ? 'auto' : 'none',
              }}
              aria-hidden={!rightOverlayOpen}
            >
              <div
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--p-color-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  minHeight: 48,
                }}
              >
                <Text as="span" variant="headingSm">
                  {rightPaneTitle || 'Details'}
                </Text>
                <Button
                  icon={XIcon}
                  variant="tertiary"
                  accessibilityLabel="Close right panel"
                  onClick={() => setRightOverlayOpen(false)}
                />
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>{rightPane}</div>
              {rightPaneBottom && (
                <div style={{ padding: 16, borderTop: '1px solid var(--p-color-border)' }}>
                  {rightPaneBottom}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SUB-COMPONENTS
// ---------------------------------------------------------------------------

/** Section header for the left/right pane */
ThreePaneLayout.SectionHeader = function SectionHeader({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Text as="h3" variant="headingXs" tone="subdued">
      {typeof children === 'string' ? children.toUpperCase() : children}
    </Text>
  );
};

export interface NavItemProps {
  label: string;
  description?: string;
  active?: boolean;
  onClick?: () => void;
  icon?: any;
  tone?: 'subdued';
}

ThreePaneLayout.NavItem = function NavItem({
  label,
  description,
  active = false,
  onClick,
  icon,
  tone,
}: NavItemProps) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '10px 12px',
        borderRadius: '8px',
        cursor: onClick ? 'pointer' : 'default',
        backgroundColor: active ? '#edeef0' : 'transparent',
        transition: 'background-color 0.2s',
        opacity: tone === 'subdued' ? 0.5 : 1,
      }}
    >
      <InlineStack gap="200" blockAlign="center" wrap={false}>
        {icon && (
          <div
            style={{
              width: 16,
              height: 16,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {typeof icon === 'function' || (typeof icon === 'object' && (icon as any)?.$$typeof) ? (
              React.createElement(icon as any, {
                size: 16,
                style: { color: tone === 'subdued' ? 'var(--p-color-icon-subdued)' : 'inherit' },
              })
            ) : (
              <Icon source={icon} tone={tone === 'subdued' ? 'subdued' : undefined} />
            )}
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, minWidth: 0 }}>
          <Text as="span" variant="bodySm" fontWeight={active ? 'bold' : 'regular'} truncate>
            {label}
          </Text>
          {description && (
            <Text as="span" variant="bodyXs" tone="subdued" truncate>
              {description}
            </Text>
          )}
        </div>
      </InlineStack>
    </div>
  );
};

/** Group container for nav items */
ThreePaneLayout.NavGroup = function NavGroup({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {title && <ThreePaneLayout.SectionHeader>{title}</ThreePaneLayout.SectionHeader>}
      {children}
    </div>
  );
};
