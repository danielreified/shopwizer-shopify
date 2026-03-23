import { Card, BlockStack, InlineStack, Text, Badge, Button, Box } from '@shopify/polaris';
import { EditIcon, PinFilledIcon, PinIcon } from '@shopify/polaris-icons';

export interface ProductCardProps {
  id: string;
  title: string;
  vendor?: string;
  price?: string;
  imageUrl?: string;
  badge?: {
    label: string;
    tone?: 'success' | 'info' | 'warning' | 'critical' | 'attention' | 'subdued';
    onClick?: () => void;
  };
  // Standard actions
  onRemove?: () => void;
  onClick?: () => void;
  // Bundle-specific states
  isPinned?: boolean;
  isEdited?: boolean;
  // Bundle-specific actions
  onTogglePin?: () => void;
  onEdit?: () => void;
  // Loading states
  isPinLoading?: boolean;
  isEditLoading?: boolean;
  isRemoveLoading?: boolean;
}

export function ProductCard({
  title,
  vendor,
  price,
  imageUrl,
  badge,
  onRemove,
  onClick,
  isPinned,
  isEdited,
  onTogglePin,
  onEdit,
  isPinLoading,
  isEditLoading,
  isRemoveLoading,
}: ProductCardProps) {
  // Edited products are automatically pinned
  const effectivelyPinned = isPinned || isEdited;

  // Determine if we have any actions to show
  const hasActions = onRemove || onTogglePin || onEdit || price;

  return (
    <Card padding="300">
      <BlockStack gap="300">
        {/* Image container with badge */}
        <div
          style={{
            width: '100%',
            aspectRatio: '1',
            borderRadius: '6px',
            overflow: 'hidden',
            background: 'var(--p-color-bg-surface-secondary)',
            position: 'relative',
            cursor: onClick ? 'pointer' : 'default',
          }}
          onClick={onClick}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <Box padding="400" background="bg-surface-secondary">
              <Text as="span" tone="subdued">
                No Image
              </Text>
            </Box>
          )}

          {/* Badge - shows Pinned and/or Edited badges */}
          {(badge || effectivelyPinned || isEdited) && (
            <div
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                cursor: badge?.onClick ? 'pointer' : 'default',
                zIndex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                alignItems: 'flex-end',
              }}
              onClick={(e) => {
                if (badge?.onClick) {
                  e.stopPropagation();
                  badge.onClick();
                }
              }}
            >
              {effectivelyPinned && <Badge tone="success">Pinned</Badge>}
              {isEdited && <Badge tone="info">Edited</Badge>}
              {!effectivelyPinned && !isEdited && badge && (
                <Badge tone={badge.tone as any}>{badge.label}</Badge>
              )}
            </div>
          )}
        </div>

        {/* Title and vendor */}
        <BlockStack gap="100">
          <Text variant="bodySm" as="p" fontWeight="bold" truncate>
            {title}
          </Text>
          {vendor && (
            <Text variant="bodyXs" as="p" tone="subdued">
              {vendor}
            </Text>
          )}
        </BlockStack>

        {/* Actions row */}
        {hasActions && (
          <InlineStack align="space-between" blockAlign="center" gap="100">
            {/* Price (left side) */}
            {price && (
              <Text variant="bodySm" as="p" tone="success" fontWeight="bold">
                {price}
              </Text>
            )}

            {/* Bundle actions: Pin + Edit */}
            {(onTogglePin || onEdit) && (
              <div style={{ width: '100%' }}>
                <InlineStack align="space-between" blockAlign="center">
                  {onTogglePin && (
                    <Button
                      size="slim"
                      variant={effectivelyPinned ? 'secondary' : 'tertiary'}
                      loading={isPinLoading}
                      onClick={onTogglePin}
                      icon={effectivelyPinned ? PinFilledIcon : PinIcon}
                    >
                      {effectivelyPinned ? 'Unpin' : 'Pin'}
                    </Button>
                  )}
                  {onEdit && (
                    <Button
                      size="slim"
                      variant="tertiary"
                      icon={EditIcon}
                      loading={isEditLoading}
                      onClick={onEdit}
                      accessibilityLabel="Edit"
                    />
                  )}
                </InlineStack>
              </div>
            )}

            {/* Remove action (merchandising) */}
            {onRemove && (
              <Button
                variant="tertiary"
                tone="critical"
                size="slim"
                loading={isRemoveLoading}
                onClick={onRemove}
              >
                Remove
              </Button>
            )}
          </InlineStack>
        )}
      </BlockStack>
    </Card>
  );
}
