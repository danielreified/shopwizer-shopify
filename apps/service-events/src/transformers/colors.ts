// src/transformers/colors.ts
import { TProductDTO } from '../types/product';
import { resolveColorFromName } from '../utils/colors';

/**
 * Adds color metadata to variants *only if* the product has a color-related option.
 * - Keeps all variants (important for recommender + analytics)
 * - Color enrichment runs only when an option name includes 'color' or 'colour'
 */
export function addVariantColors(product: TProductDTO): TProductDTO {
  const colorBases = new Set<string>();

  // detect if product has a color-related option
  const hasColorOption = (product.options ?? []).some((opt) =>
    /color|colour/i.test(opt.name ?? ''),
  );

  const variants = (product.variants ?? []).map((v) => {
    // only resolve color if the option name indicates color
    const colorLabel = hasColorOption ? v.title?.trim() : undefined;
    const guess = hasColorOption && colorLabel ? resolveColorFromName(colorLabel) : null;

    if (guess?.base) colorBases.add(guess.base);

    return {
      ...v,
      color_base: guess?.base ?? undefined,
      color_label: guess?.label ?? undefined,
      color_hex: guess?.hex ?? undefined,
      lab_l: guess?.lab?.l ?? undefined,
      lab_a: guess?.lab?.a ?? undefined,
      lab_b: guess?.lab?.b ?? undefined,
      hue: undefined,
      color_source: (guess?.source ?? 'NONE') as 'METAFIELD' | 'FALLBACK' | 'NONE',
      color_version: guess?.version ?? 1,
    };
  });

  return { ...product, variants, colorBases: Array.from(colorBases) };
}
