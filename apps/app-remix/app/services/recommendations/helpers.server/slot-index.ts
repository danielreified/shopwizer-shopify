const VARIANT_SLOT_MAP: Record<string, number> = {
    control: 1,
    explore: 2,
    explore_a: 2,
    explore_b: 3,
    bundle_1: 1,
    bundle_2: 2,
    bundle_3: 3,
};

export function getSlotIndex(variant: string | null | undefined, fallback = 1): number {
    if (!variant) return fallback;
    return VARIANT_SLOT_MAP[variant.toLowerCase()] ?? fallback;
}
