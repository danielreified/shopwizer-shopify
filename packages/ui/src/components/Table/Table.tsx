import { useCallback, useState, useEffect, useRef } from 'react';
import {
  Card,
  IndexTable,
  IndexFilters,
  Text,
  useSetIndexFiltersMode,
  useBreakpoints,
  Box,
  InlineStack,
  Thumbnail,
} from '@shopify/polaris';

import { PaintBucket, UsersRound, VenusAndMars, Eye, EyeOff, Loader2 } from 'lucide-react';

const IconPaint = PaintBucket as any;
const IconUsers = UsersRound as any;
const IconGender = VenusAndMars as any;
const IconEye = Eye as any;
const IconEyeOff = EyeOff as any;
const IconLoader = Loader2 as any;
import { useNavigate, useSearchParams } from 'react-router';

export type ProductRow = {
  id: string;
  title: string;
  status: 'Active' | 'Inactive';
  thumbnailUrl?: string;
  gender: string[];
  ageBuckets: string[];
  attributesCategoryCount: number;
  attributesValueCount: number;
  enabled: boolean;
  pipelineState?: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  category: {
    fullName: string;
    hasAgeGroup: boolean;
    hasColor: boolean;
    hasTargetGender: boolean;
    id: string;
    isLeaf: boolean;
    name: string;
    topLevel: string;
  };
};

type TableProps = {
  products: ProductRow[];
  page: number;
  total: number;
  pageSize: number;
  q?: string;
  selectedId?: string;
  onRowClick?: (id: string) => void;
};

export function Table({ products, page, total, pageSize, q, selectedId, onRowClick }: TableProps) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { mode, setMode } = useSetIndexFiltersMode();
  const { smDown } = useBreakpoints();

  // Local state for immediate input feedback
  const [searchValue, setSearchValue] = useState(q ?? '');
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Sync local state when URL q param changes (e.g., browser back/forward)
  useEffect(() => {
    setSearchValue(q ?? '');
  }, [q]);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const hasPrevious = page > 1;
  const hasNext = page < pageCount;

  //
  // -- Debounced Server Search Handler
  //
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchValue(value); // Immediate local update

      // Clear previous debounce
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      // Debounce navigation by 300ms
      debounceRef.current = setTimeout(() => {
        const p = new URLSearchParams(params);
        if (value) {
          p.set('q', value);
        } else {
          p.delete('q');
        }
        p.set('page', '1');
        navigate('?' + p.toString());
      }, 300);
    },
    [params, navigate],
  );

  const handleSearchClear = useCallback(() => {
    setSearchValue('');
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    const p = new URLSearchParams(params);
    p.delete('q');
    p.set('page', '1');
    navigate('?' + p.toString());
  }, [params, navigate]);

  //
  // Pagination Handlers
  //
  const goToPage = (newPage: number) => {
    const p = new URLSearchParams(params);
    p.set('page', String(newPage));
    navigate('?' + p.toString());
  };

  //
  // Row Markup
  //
  const rowMarkup = products.map((row, index) => {
    const isProcessing = row.pipelineState === 'PROCESSING';

    return (
      <IndexTable.Row
        id={row.id}
        key={row.id}
        position={index}
        selected={selectedId === row.id}
        onClick={() => !isProcessing && onRowClick?.(row.id)}
        disabled={isProcessing}
      >
        <IndexTable.Cell
          className={selectedId === row.id ? '!bg-[var(--p-color-bg-surface-selected)]' : ''}
        >
          <InlineStack gap="300" blockAlign="center">
            {isProcessing ? (
              <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded">
                <IconLoader size={20} className="animate-spin text-gray-500" />
              </div>
            ) : (
              <Thumbnail size="small" source={row.thumbnailUrl || ''} alt={row.title} />
            )}
            <div className={isProcessing ? 'opacity-60' : ''}>
              <Text as="span" variant="bodySm">
                {row.title}
              </Text>
            </div>
          </InlineStack>
        </IndexTable.Cell>

        {/* 8 categories • 17 values */}

        <IndexTable.Cell>
          {row.category ? (
            <div className="flex flex-col gap-0.5">
              <span className="font-bold text-sm">{String(row.category.name || 'Unknown')}</span>
              <span className="text-xs text-gray-500">
                in {String(row.category.topLevel || 'N/A')}
              </span>
            </div>
          ) : (
            <span className="text-sm text-gray-400">Uncategorized</span>
          )}
        </IndexTable.Cell>

        <IndexTable.Cell>
          <span className="inline-flex items-center gap-1">
            {row?.attributesCategoryCount > 0 && (
              <Text as="span" variant="bodySm">
                <b>{row?.attributesCategoryCount}</b> categories and{' '}
                <b>{row?.attributesValueCount}</b> values
              </Text>
            )}
          </span>
        </IndexTable.Cell>

        <IndexTable.Cell>
          <div className="flex justify-end pr-2">
            <InlineStack gap="200">
              {/* Enabled/Disabled indicator */}
              {row.category?.hasColor && (
                <div className="rounded-lg bg-blue-100 p-1.5">
                  <IconPaint size={12} strokeWidth={2} className="text-blue-600" />
                </div>
              )}
              {row.category?.hasAgeGroup && (
                <div className="rounded-lg bg-blue-100 p-1.5">
                  <IconUsers size={12} strokeWidth={2} className="text-blue-600" />
                </div>
              )}
              {row.category?.hasTargetGender && (
                <div className="rounded-lg bg-blue-100 p-1.5">
                  <IconGender size={12} strokeWidth={2} className="text-blue-600" />
                </div>
              )}
              <div className={`rounded-lg p-1.5 ${row.enabled ? 'bg-green-100' : 'bg-gray-100'}`}>
                {row.enabled ? (
                  <IconEye size={12} strokeWidth={2} className="text-green-600" />
                ) : (
                  <IconEyeOff size={12} strokeWidth={2} className="text-gray-400" />
                )}
              </div>
            </InlineStack>
          </div>
        </IndexTable.Cell>
      </IndexTable.Row>
    );
  });

  return (
    <Card>
      <Box paddingBlockStart="200" paddingInline="200">
        <IndexFilters
          queryValue={searchValue}
          queryPlaceholder="Search products"
          onQueryChange={handleSearchChange}
          onQueryClear={handleSearchClear}
          sortOptions={[]}
          sortSelected={[]}
          onSort={() => {}}
          filters={[]}
          appliedFilters={[]}
          onClearAll={handleSearchClear}
          tabs={[]}
          selected={0}
          onSelect={() => {}}
          mode={mode}
          setMode={setMode}
        />
      </Box>

      <IndexTable
        condensed={smDown}
        resourceName={{ singular: 'product', plural: 'products' }}
        itemCount={total}
        selectable={false}
        headings={[
          { title: 'Product' },
          { title: 'Category' },
          { title: 'Enriched Attributes' },
          { title: '' },
        ]}
        pagination={{
          hasPrevious,
          hasNext,
          onPrevious: () => goToPage(page - 1),
          onNext: () => goToPage(page + 1),
        }}
      >
        {rowMarkup}
      </IndexTable>
      <style>{`
        .Polaris-IndexTable__TableRow--selected .Polaris-IndexTable__TableCell--sticky,
        .Polaris-IndexTable__TableRow--active .Polaris-IndexTable__TableCell--sticky {
          background-color: inherit !important;
        }
        /* Fallback for some browsers */
        .Polaris-IndexTable__TableCell--sticky {
          transition: background-color 0.2s ease;
        }
      `}</style>
    </Card>
  );
}
