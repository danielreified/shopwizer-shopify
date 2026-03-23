// CategoryPicker.tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Combobox,
  InlineStack,
  BlockStack,
  Text,
  Button,
  Icon,
  SkeletonBodyText,
} from '@shopify/polaris';
import {
  ArrowLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@shopify/polaris-icons';

export type CategoryNode = {
  id: string;
  label: string;
  hasChildren: boolean;
  /** Optional full breadcrumb path for search results */
  path?: string;
};

export type CategoryLoader = {
  getChildren: (parentId?: string) => Promise<CategoryNode[]>;
  search: (query: string) => Promise<CategoryNode[]>;
};

type Selectable = 'leaf' | 'any' | number[]; // 1 = top-level, 2 = child, etc.

export function CategoryPicker({
  value,
  onChange,
  loader,
  placeholder = 'Choose a product category',
  minSearchChars = 2,
  selectable = 'leaf',
}: {
  value?: { id: string; path: string };
  onChange: (node: { id: string; path: string }) => void;
  loader: CategoryLoader;
  placeholder?: string;
  minSearchChars?: number;
  selectable?: Selectable;
}) {
  const [query, setQuery] = useState(value?.path ?? '');
  const [stack, setStack] = useState<Array<{ id?: string; label?: string }>>([
    { id: undefined, label: undefined }, // root
  ]);
  const [options, setOptions] = useState<CategoryNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const atRoot = stack.length === 1;

  useEffect(() => {
    if (value?.path) setQuery(value.path);
  }, [value?.path]);

  async function loadFrame(parentId?: string) {
    setLoading(true);
    try {
      const kids = await loader.getChildren(parentId);
      setOptions(kids);
    } finally {
      setLoading(false);
    }
  }

  // open → load current level
  useEffect(() => {
    if (open) {
      const cur = stack.at(-1)?.id;
      loadFrame(cur);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, stack.length]);

  // search mode
  const searchMode = query.trim().length >= minSearchChars;
  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!searchMode) return;
      setLoading(true);
      try {
        const res = await loader.search(query.trim());
        if (!cancelled) setOptions(res);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [query, searchMode, loader]);

  // ----- selection policy helpers
  function depthForNode(node: CategoryNode, browsingDepth: number) {
    if (searchMode && node.path) return node.path.split('›').length;
    return browsingDepth;
  }
  function isSelectable(node: CategoryNode, depth: number) {
    if (selectable === 'any') return true;
    if (selectable === 'leaf') return !node.hasChildren;
    return Array.isArray(selectable) && selectable.includes(depth);
  }

  function push(node: CategoryNode) {
    setStack((s) => [...s, { id: node.id, label: node.label }]);
  }
  function pop() {
    if (atRoot) return;
    const parentId = stack.length > 2 ? stack[stack.length - 2].id : undefined;
    setStack((s) => s.slice(0, -1));
    loadFrame(parentId);
  }
  function commitSelection(node: CategoryNode) {
    const path =
      node.path ?? [...stack.slice(1).map((f) => f.label), node.label].filter(Boolean).join(' › ');
    onChange({ id: node.id, path });
    setQuery(path);
    setOpen(false);
    inputRef.current?.blur();
  }

  // header text (parent crumb + current)
  const headerParts = useMemo(() => {
    if (searchMode) return { parent: undefined, current: 'Search results' };
    const labels = stack
      .slice(1)
      .map((f) => f.label)
      .filter(Boolean) as string[];
    const current = labels.at(-1) ?? 'Category';
    const parent =
      labels.length > 1 ? labels.slice(0, -1).join(' › ') : labels.length ? undefined : 'Category';
    return { parent, current };
  }, [stack, searchMode]);

  // -------- Row (our own list “option”)
  function Row({
    node,
    onClick,
    trailingChevron,
  }: {
    node: CategoryNode | { id: string; label: string; hasChildren?: boolean; path?: string };
    onClick: () => void;
    trailingChevron?: boolean;
  }) {
    return (
      <div
        role="option"
        aria-selected="false"
        onClick={onClick}
        className="px-2 py-2 rounded-md cursor-pointer hover:bg-[#f6f6f7] focus:bg-[#f6f6f7]"
      >
        <InlineStack align="space-between">
          <Text variant="bodyLg" truncate>
            {'path' in node && node.path ? node.path : node.label}
          </Text>
          <div className="flex">
            {trailingChevron && <Icon source={ChevronRightIcon} tone="subdued" />}
          </div>
        </InlineStack>
      </div>
    );
  }

  return (
    <Combobox
      allowMultiple={false}
      activator={
        <Combobox.TextField
          label="Category"
          labelHidden
          role="combobox"
          autoComplete="off"
          aria-expanded={open}
          value={query}
          onChange={setQuery}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          textFieldRef={inputRef}
          placeholder={placeholder}
          suffix={
            <button
              type="button"
              aria-label={open ? 'Collapse' : 'Expand'}
              onMouseDown={(e) => {
                e.preventDefault();
                const el = inputRef.current;
                if (!el) return;
                if (open) {
                  el.blur();
                } else {
                  el.focus();
                }
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 28,
                height: 28,
                borderRadius: 6,
                background: 'transparent',
              }}
            >
              <Icon source={open ? ChevronUpIcon : ChevronDownIcon} tone="subdued" />
            </button>
          }
        />
      }
    >
      {/* Our own “listbox” panel */}
      <div role="listbox" aria-label="Categories">
        {/* Sticky, soft header */}
        <div className="sticky top-0 z-[1]  border-b px-2 pb-2 pointer">
          <div className="p-2 rounded-md hover:bg-[#f6f6f7]">
            <InlineStack gap="200" blockAlign="center">
              <Button
                icon={ArrowLeftIcon}
                onClick={pop}
                accessibilityLabel="Back"
                size="slim"
                variant="tertiary"
              />
              <BlockStack gap="050">
                {headerParts.parent && (
                  <Text variant="bodySm" tone="subdued" truncate>
                    {headerParts.parent}
                  </Text>
                )}
                <Text as="h3" variant="headingSm" fontWeight="semibold" truncate>
                  {headerParts.current}
                </Text>
              </BlockStack>
            </InlineStack>
          </div>
        </div>

        {/* Scroll area */}
        <div style={{ maxHeight: 420, overflowY: 'auto' }}>
          {/* Loading skeleton */}
          {loading && (
            <Box paddingInline="500" paddingBlock="400">
              <SkeletonBodyText lines={3} />
            </Box>
          )}

          {/* Empty */}
          {!loading && options.length === 0 && (
            <Box paddingInline="500" paddingBlock="400">
              <Text tone="subdued">No results</Text>
            </Box>
          )}

          <div className="p-2 rounded-lg">
            {!loading &&
              options.map((node) => {
                const depth = depthForNode(node, stack.length);
                const canSelect = isSelectable(node, depth);
                const canDrill = !searchMode && node.hasChildren;

                return (
                  <Row
                    key={node.id}
                    node={searchMode ? { ...node, label: node.label, path: node.path } : node}
                    trailingChevron={canDrill}
                    onClick={() => {
                      if (searchMode) {
                        if (canSelect) {
                          return commitSelection(node);
                        }

                        if (node.hasChildren) {
                          setQuery('');
                          push(node);
                          loadFrame(node.id);
                        }

                        return;
                      }

                      if (canSelect) {
                        return commitSelection(node);
                      }

                      if (node.hasChildren) {
                        push(node);
                        loadFrame(node.id);
                      }
                    }}
                  />
                );
              })}
          </div>
        </div>
      </div>
    </Combobox>
  );
}
