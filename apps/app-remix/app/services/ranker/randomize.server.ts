// services/ranker/randomize.server.ts

export function randomizeWithinBands(
  banded: Array<{ product: any; score: number; band: number }>,
) {
  const groups: Record<number, any[]> = {};

  for (const item of banded) {
    groups[item.band] ??= [];
    groups[item.band].push(item);
  }

  const out: any[] = [];

  for (const band of Object.keys(groups).map(Number)) {
    const arr = groups[band];

    // Fisher-Yates shuffle
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    out.push(...arr);
  }

  return out;
}
