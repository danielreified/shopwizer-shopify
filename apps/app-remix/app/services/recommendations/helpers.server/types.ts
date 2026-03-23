export interface ProductRow {
    id: bigint;
    handle: string;
    title: string | null;
    categoryId: string | null;
    tags: string[];
    gender: string[];
    ageBucket: string[];
    rootId: string | null;
}

export function mapProductRows(rows: any[]): ProductRow[] {
    return rows.map((r) => ({
        id: r.id,
        handle: r.handle,
        title: r.title ?? null,
        categoryId: r.categoryId,
        tags: r.tags ?? [],
        gender: r.gender ?? [],
        ageBucket: r.ageBucket ?? [],
        rootId: r.rootId,
    }));
}
