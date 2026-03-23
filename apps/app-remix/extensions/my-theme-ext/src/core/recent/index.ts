// src/core/recent/index.ts

import { createDebugger } from "../utils/debug";

const debug = createDebugger("RECENT", true);

const KEY = "__shopwizer_recent__v1";
const MAX = 16;

interface RecentItem {
  pid: string | number;
  handle: string;
  ts: number;
}

/**
 * Get raw list from storage (oldest first)
 */
function getRawList(): RecentItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Get recently viewed products (newest first for display)
 */
export function getRecentlyViewed(): RecentItem[] {
  const list = getRawList();
  // Return newest first
  return [...list].reverse();
}

/**
 * Record a product view - removes duplicate and adds to end (newest)
 */
export function recordRecentlyViewed(pid: string | number, handle: string) {
  try {
    if (!pid || !handle) return;

    const list = getRawList();

    // Remove existing entry for this product (dedupe)
    const filtered = list.filter((r) => String(r.pid) !== String(pid));

    // Add new entry at end (newest)
    filtered.push({
      pid,
      handle,
      ts: Date.now(),
    });

    // Keep only last MAX items
    const toSave = filtered.slice(-MAX);
    localStorage.setItem(KEY, JSON.stringify(toSave));

    debug.log("Recorded:", handle, "| Total:", toSave.length);
  } catch (err) {
    debug.warn("Failed to record", err);
  }
}
