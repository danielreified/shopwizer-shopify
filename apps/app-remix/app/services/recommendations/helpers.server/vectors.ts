export function parseVectorText(text: string | null): number[] | null {
    if (!text) return null;

    try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
            const arr = parsed.map(Number).filter((n) => Number.isFinite(n));
            return arr.length ? arr : null;
        }
    } catch { }

    const arr = text
        .replace(/^\s*\[|\]\s*$/g, "")
        .split(",")
        .map((s) => Number(s.trim()))
        .filter((n) => Number.isFinite(n));

    return arr.length ? arr : null;
}
