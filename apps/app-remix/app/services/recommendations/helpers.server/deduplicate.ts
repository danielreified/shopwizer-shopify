/**
 * Deduplicate products by title prefix.
 * This handles cases where variant products are stored as separate products
 * with titles like "Cool Chair - Red", "Cool Chair - Blue", etc.
 * 
 * We keep the first (highest scored) product from each title group.
 */
export function deduplicateByTitle<T extends Record<string, any>>(
    products: T[],
    log?: (msg: string, data?: any) => void
): T[] {
    const seen = new Map<string, T>();
    const duplicateCount = { total: 0 };

    for (const product of products) {
        const title = product.title || '';

        // Extract base title by removing common variant suffixes
        // Patterns: "Product - Color", "Product in Color", "Product (Size)"
        const baseTitle = normalizeTitle(title);

        if (!seen.has(baseTitle)) {
            seen.set(baseTitle, product);
        } else {
            duplicateCount.total++;
        }
    }

    if (log && duplicateCount.total > 0) {
        log("🔄 Deduplicated products", { removed: duplicateCount.total, remaining: seen.size });
    }

    return Array.from(seen.values());
}

/**
 * Normalize a product title to its base form for deduplication.
 * Removes variant suffixes like " - Red", " in Blue", " (Large)"
 */
function normalizeTitle(title: string): string {
    if (!title) return '';

    // Convert to lowercase for comparison
    let normalized = title.toLowerCase().trim();

    // Remove patterns: " - Color/Size" at the end
    normalized = normalized.replace(/\s+-\s+[a-z0-9\s]+$/i, '');

    // Remove patterns: " in Color" at the end
    normalized = normalized.replace(/\s+in\s+[a-z0-9\s]+$/i, '');

    // Remove patterns: " (Size/Color)" at the end
    normalized = normalized.replace(/\s+\([^)]+\)$/i, '');

    // Remove trailing whitespace
    normalized = normalized.trim();

    return normalized;
}
