import { rateLimitedEmbeddings } from '../config/openai';
import { AI_CONFIG } from '../config/service.config';

const MODEL = AI_CONFIG.EMBEDDING_MODEL;

export async function generateEmbedding(text: string): Promise<number[]> {
  const clean = text
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const res = await rateLimitedEmbeddings({ model: MODEL, input: clean });
  const vec = res.data?.[0]?.embedding ?? [];

  if (!Array.isArray(vec) || vec.length !== 1536) {
    throw new Error(`Expected 1536-dim vector, got ${vec.length}`);
  }

  return vec as number[];
}
