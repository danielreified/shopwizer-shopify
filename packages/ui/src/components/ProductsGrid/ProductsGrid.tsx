import { Box, Text, Icon } from '@shopify/polaris';
import { BlankIcon } from '@shopify/polaris-icons';
import { SkeletonBlock } from '../Skeleton';
import { ProductCard } from '../ProductCard/ProductCard';

// -----------------------------
// Types
// -----------------------------
export type Product = {
  id: string | number;
  title: string;
  url?: string;
  image?: { src: string; alt?: string };
  price: number;
  compareAtPrice?: number;
  badge?: {
    label: string;
    tone?: 'success' | 'info' | 'warning' | 'critical' | 'attention' | 'subdued' | 'neutral';
    onClick?: () => void;
  };
  vendor?: string;
};

export type ProductsGridProps = {
  header?: string;
  products: Product[];
  columns?: 2 | 3 | 4 | 5;
  onProductClick?: (p: Product) => void;
  currency?: string;
  className?: string;
  loading?: boolean;
};

// -----------------------------
// Empty State
// -----------------------------
function EmptyRecommendationsState() {
  return (
    <div className="mt-2 px-6 py-8 border-2 border-dashed rounded-md text-center flex flex-col items-center gap-3 bg-white">
      <Icon source={BlankIcon} tone="subdued" />
      <div className="max-w-[420px]">
        <Text as="p" variant="bodySm" tone="subdued">
          Not enough recommendations available yet. This section will populate automatically as more
          data becomes available.
        </Text>
      </div>
    </div>
  );
}

// -----------------------------
// Product Skeleton
// -----------------------------
function ProductSkeleton() {
  return (
    <div className="flex flex-col animate-pulse">
      {/* image */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-gray-200" />

      {/* title lines */}
      <div className="mt-3 space-y-2">
        <SkeletonBlock height={16} width="70%" />
        <SkeletonBlock height={16} width="40%" />
      </div>
    </div>
  );
}

// -----------------------------
// Products Grid
// -----------------------------
export function ProductsGrid({
  header,
  products,
  columns = 5,
  onProductClick,
  currency = '$',
  className = '',
  loading = false,
}: ProductsGridProps) {
  const visibleCount = 10; // always show first 10
  const visibleProducts = products.slice(0, visibleCount);

  const columnClasses = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
  };

  const cols = columnClasses[columns as keyof typeof columnClasses] || columnClasses[5];

  return (
    <Box>
      <div className={`w-full ${className}`}>
        {header && (
          <div style={{ marginBottom: '8px' }}>
            <Text as="h3" variant="headingMd">
              {header}
            </Text>
          </div>
        )}

        {/* 🔄 Loading state (10 skeletons) */}
        {loading ? (
          <div className={`grid ${cols} gap-2`}>
            {Array.from({ length: 10 }).map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <EmptyRecommendationsState />
        ) : (
          <div className={`grid ${cols} gap-4`}>
            {visibleProducts.map((p) => (
              <ProductCard
                key={p.id}
                id={p.id.toString()}
                title={p.title}
                price={p.price ? `${currency}${p.price.toLocaleString()}` : undefined}
                imageUrl={p.image?.src}
                vendor={p.vendor}
                badge={p.badge as any}
                onClick={() => onProductClick?.(p)}
              />
            ))}
          </div>
        )}
      </div>
    </Box>
  );
}
