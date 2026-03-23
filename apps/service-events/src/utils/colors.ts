import Fuse from 'fuse.js';
import { parse, converter } from 'culori';
import { logger } from '@repo/logger';

// ---
// Load color-name-list (works with v13+ where export = { colornames })
// ---
let colorNameList: any[] = [];

try {
  const mod = await import('color-name-list');

  const maybeList =
    (mod as any).colornames ||
    (mod as any).default?.colornames ||
    (mod as any).colorNameList ||
    (mod as any).default ||
    (Array.isArray(mod) ? mod : null);

  if (Array.isArray(maybeList)) {
    colorNameList = maybeList;
    logger.debug({ count: colorNameList.length }, 'Loaded color-name-list');
  } else {
    logger.warn({ keys: Object.keys(mod) }, 'color-name-list import structure unexpected');
  }
} catch (err) {
  logger.error({ err }, 'Failed to import color-name-list');
}

// ---
// Normalize and index
// ---
const colorNameListNormalized = colorNameList.map((c: any) => ({
  name: (c.name || '').toLowerCase(),
  hex: c.hex,
}));

const toLab = converter('lab65');
const toRgb = converter('rgb');

const fuse = new Fuse(colorNameListNormalized, {
  keys: ['name'],
  threshold: 0.45,
  distance: 400,
  ignoreLocation: true,
  isCaseSensitive: false,
});

// ---
// Main resolver
// ---
export function resolveColorFromName(label?: string) {
  const version = 1;
  if (!label) return { source: 'NONE', version };
  const s = label.trim().toLowerCase();
  if (!s) return { source: 'NONE', version };

  // Exact match
  const exact =
    colorNameListNormalized.find((c) => c.name === s) ||
    colorNameListNormalized.find((c) => c.name.includes(s)) ||
    colorNameListNormalized.find((c) => s.includes(c.name));
  if (exact) {
    const lab = hexToLab(exact.hex);
    return {
      base: exact.name,
      label,
      hex: exact.hex,
      lab: lab ?? undefined,
      confidence: 1,
      source: 'FUZZY',
      version,
    };
  }

  // Fuzzy match fallback
  const best = fuse.search(s, { limit: 1 })[0];
  if (best?.item?.hex) {
    const hex = best.item.hex;
    const lab = hexToLab(hex);
    return {
      base: best.item.name,
      label,
      hex,
      lab: lab ?? undefined,
      confidence: 1 - (best.score ?? 1),
      source: 'FUZZY',
      version,
    };
  }

  // CSS color parse fallback
  const parsed = parse(s);
  if (parsed) {
    const lab = toLab(parsed);
    const hex = toHex(parsed);
    return {
      base: s,
      label,
      hex,
      lab: lab ? { l: lab.l, a: lab.a, b: lab.b } : undefined,
      confidence: 1,
      source: 'CSS',
      version,
    };
  }

  return { label, source: 'NONE', version };
}

// ---
// Helpers
// ---
function hexToLab(hex: string) {
  const parsed = parse(hex);
  const lab = parsed ? toLab(parsed) : null;
  if (!lab) return null;
  return { l: lab.l as number, a: lab.a as number, b: lab.b as number };
}

function toHex(parsed: any): string | undefined {
  if (!parsed) return undefined;
  const rgb = toRgb(parsed);
  if (!rgb) return undefined;
  const r = Math.round((rgb.r ?? 0) * 255);
  const g = Math.round((rgb.g ?? 0) * 255);
  const b = Math.round((rgb.b ?? 0) * 255);
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}
