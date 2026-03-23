// services/ranker/index.server.ts

import { computeScore } from "./scores.server";
import { applyBands } from "./banding.server";
import { randomizeWithinBands } from "./randomize.server";

type RankerProduct = {
  id: bigint | number;
  title: string;
  handle: string;
  price: number | null;
  vendor: string | null;
  categoryId: string | null;
  categoryTopLevel?: string | null;
  embeddingVector: number[] | null;
  attrEmbedding?: number[] | null;
  vendorEmbedding?: number[] | null;
  colorLab?: [number, number, number] | null;
};

export async function rankProducts(input: {
  queryType: "similar" | "fbt" | "personalized";
  originProduct: RankerProduct;
  products: Array<RankerProduct>;
}) {
  const { originProduct, products, queryType } = input;

  // 1. Score each product
  const scored = products.map((p) => ({
    product: p,
    score: computeScore(originProduct, p, queryType),
  }));

  // 2. Banding
  const banded = applyBands(scored);

  // 3. Shuffle within band
  const shuffled = randomizeWithinBands(banded);

  // 4. Sort & strip
  return shuffled.sort((a, b) => b.score - a.score).map((x) => x.product);
}
