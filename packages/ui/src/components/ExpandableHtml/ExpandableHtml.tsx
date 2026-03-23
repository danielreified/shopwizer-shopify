import { useState, useRef, useEffect, type ReactNode } from 'react';
import { Button } from '@shopify/polaris';

// ============================================================
// Types
// ============================================================

export interface ExpandableHtmlProps {
  /** HTML string to render (should be sanitized by the consumer) */
  html: string;
  /** Maximum number of visible lines before truncation */
  maxLines?: number;
  /** Label for the expand button */
  expandLabel?: string;
  /** Label for the collapse button */
  collapseLabel?: string;
  /** Optional sanitize function — if provided, html is sanitized before rendering */
  sanitize?: (html: string) => string;
}

// ============================================================
// Component
// ============================================================

/**
 * Renders HTML content with line-clamp truncation and expand/collapse toggle.
 * Pass a `sanitize` function (e.g., DOMPurify.sanitize) for XSS protection.
 */
export function ExpandableHtml({
  html,
  maxLines = 2,
  expandLabel = 'Show more',
  collapseLabel = 'Show less',
  sanitize,
}: ExpandableHtmlProps) {
  const safeHtml = sanitize ? sanitize(html) : html;
  const [expanded, setExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = contentRef.current;
    if (el) {
      setIsOverflowing(el.scrollHeight > el.clientHeight);
    }
  }, [html]);

  return (
    <div>
      <div
        ref={contentRef}
        className="overflow-hidden transition-all"
        style={{
          color: 'var(--p-color-text-subdued)',
          ...(expanded
            ? { maxHeight: 'none' }
            : {
                display: '-webkit-box',
                WebkitLineClamp: maxLines,
                WebkitBoxOrient: 'vertical',
              }),
        }}
        dangerouslySetInnerHTML={{ __html: safeHtml }}
      />

      {isOverflowing && (
        <div style={{ marginTop: '8px' }}>
          <Button variant="plain" onClick={() => setExpanded((s) => !s)}>
            {expanded ? collapseLabel : expandLabel}
          </Button>
        </div>
      )}
    </div>
  );
}

export default ExpandableHtml;
