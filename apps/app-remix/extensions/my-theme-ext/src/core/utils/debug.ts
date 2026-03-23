// src/core/utils/debug.ts

const DEBUG_KEY = "swdebug";

/**
 * Check if debug mode is enabled via URL param or localStorage.
 * - ?swdebug=1 enables debug (persists to localStorage)
 * - ?swdebug=0 disables debug (clears localStorage)
 * - localStorage.swdebug=1 enables debug across navigations
 */
function isDebugEnabled(): boolean {
  if (typeof window === "undefined") return false;

  try {
    // Check URL param first (allows toggling)
    const urlParams = new URLSearchParams(window.location.search);
    const urlDebug = urlParams.get(DEBUG_KEY);

    if (urlDebug === "1") {
      // Enable and persist
      localStorage.setItem(DEBUG_KEY, "1");
      return true;
    } else if (urlDebug === "0") {
      // Disable and clear
      localStorage.removeItem(DEBUG_KEY);
      return false;
    }

    // Fall back to localStorage
    return localStorage.getItem(DEBUG_KEY) === "1";
  } catch {
    // localStorage might be blocked
    return false;
  }
}

// Cache the result once per page load
let _debugEnabled: boolean | null = null;
function getDebugEnabled(): boolean {
  if (_debugEnabled === null) {
    _debugEnabled = isDebugEnabled();
    if (_debugEnabled) {
      console.log(
        "%c🔧 Shopwizer Debug Mode ON %c Add ?swdebug=0 to disable",
        "background: #2563eb; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;",
        "color: #666; font-size: 11px;"
      );
    }
  }
  return _debugEnabled;
}

/**
 * Create a debug logger for a specific module.
 * Logs are only shown when debug mode is enabled via ?swdebug=1
 */
export function createDebugger(name: string, _enabled: boolean = false) {
  const prefix = `🔧 [${name}]`;

  return {
    log: (...args: any[]) => {
      if (getDebugEnabled()) console.log(prefix, ...args);
    },
    warn: (...args: any[]) => {
      if (getDebugEnabled()) console.warn(prefix, ...args);
    },
    error: (...args: any[]) => {
      // Errors always show
      console.error(prefix, ...args);
    },
    table: (data: any) => {
      if (getDebugEnabled()) {
        console.log(prefix);
        console.table(data);
      }
    },
    group: (label: string) => {
      if (getDebugEnabled()) console.group(`${prefix} ${label}`);
    },
    groupEnd: () => {
      if (getDebugEnabled()) console.groupEnd();
    },
  };
}