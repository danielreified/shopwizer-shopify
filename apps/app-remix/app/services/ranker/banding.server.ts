// services/ranker/banding.server.ts

export function applyBands(
    scored: Array<{ product: any; score: number }>
  ) {
    const high = scored.filter((x) => x.score >= 0.8);
    const mid = scored.filter((x) => x.score >= 0.65 && x.score < 0.8);
    const low = scored.filter((x) => x.score < 0.65);
  
    return [
      ...high.map((p) => ({ ...p, band: 1 })),
      ...mid.map((p) => ({ ...p, band: 2 })),
      ...low.map((p) => ({ ...p, band: 3 })),
    ];
  }
  