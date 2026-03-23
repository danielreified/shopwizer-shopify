import { Button, InlineStack, BlockStack } from '@shopify/polaris';

// ============================================================
// Types
// ============================================================

export interface QuickJumpButton {
  /** Display label */
  label: string;
  /** Target element ID to scroll to */
  id: string;
}

export interface QuickJumpButtonsProps {
  /** Array of scroll targets */
  buttons: QuickJumpButton[];
  /** Called when a button is clicked — receives the target ID */
  onScrollTo: (id: string) => void;
}

// ============================================================
// Component
// ============================================================

/**
 * Horizontal row of plain buttons that scroll to sections on the page.
 */
export function QuickJumpButtons({ buttons, onScrollTo }: QuickJumpButtonsProps) {
  return (
    <BlockStack gap="200">
      <InlineStack gap="150">
        {buttons.map((btn) => (
          <Button key={btn.id} variant="plain" onClick={() => onScrollTo(btn.id)}>
            {btn.label}
          </Button>
        ))}
      </InlineStack>
    </BlockStack>
  );
}

export default QuickJumpButtons;
