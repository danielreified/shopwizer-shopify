import { useState } from 'react';

// ============================================================
// Types
// ============================================================

export interface DebugLog {
  label: string;
  data?: unknown;
}

export interface DebugPanelProps {
  /** Debug payload — panel is hidden when undefined */
  debug?: { logs: DebugLog[] };
  /** Panel title */
  title?: string;
  /** Whether the panel starts expanded */
  defaultOpen?: boolean;
}

// ============================================================
// Component
// ============================================================

/**
 * Fixed-position floating debug panel that displays JSON logs.
 * Collapsible, copy-to-clipboard, dark-themed developer overlay.
 * Renders nothing when `debug` is undefined.
 */
export function DebugPanel({ debug, title = 'Debug', defaultOpen = true }: DebugPanelProps) {
  const [open, setOpen] = useState(defaultOpen);

  if (!debug) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(debug.logs, null, 2));
    } catch {
      // no-op
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 12,
        right: 12,
        width: 560,
        maxWidth: '92vw',
        background: 'var(--p-color-bg-fill-inverse)',
        color: '#E5E7EB',
        borderRadius: 8,
        fontSize: 12,
        lineHeight: 1.4,
        zIndex: 9999,
        boxShadow: '0 10px 24px rgba(0,0,0,0.3)',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '70vh',
        overflow: 'hidden',
        border: '1px solid #1F2937',
      }}
    >
      {/* Sticky header */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1,
          background: '#0F172A',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          padding: '8px 12px',
          borderBottom: '1px solid #374151',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Collapse' : 'Expand'}
            style={{
              appearance: 'none',
              border: '1px solid #374151',
              background: 'transparent',
              color: '#E5E7EB',
              padding: '1px 6px',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            {open ? '\u25BE' : '\u25B8'}
          </button>
          <strong style={{ fontWeight: 600 }}>
            {title} ({debug.logs.length})
          </strong>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={copy}
            style={{
              appearance: 'none',
              border: '1px solid #374151',
              background: 'var(--p-color-bg-fill-inverse)',
              color: '#E5E7EB',
              padding: '4px 8px',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            Copy
          </button>
        </div>
      </div>

      {/* Scrollable body */}
      {open && (
        <div style={{ padding: 12, overflowY: 'auto' }}>
          <pre
            style={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              margin: 0,
              fontFamily:
                'ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace',
            }}
          >
            {JSON.stringify(debug.logs, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default DebugPanel;
