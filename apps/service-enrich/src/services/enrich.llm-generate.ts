// src/services/enrich.llm-generate.ts
import { OPENAI_MODEL, rateLimitedResponses } from '../config/openai';

export interface ProductSignals {
  title: string;
  productType?: string;
  vendor?: string;
  tags?: string[];
  collections?: string[];
  description?: string;
}

import { PROMPTS } from '../config/service.config';

export async function generateCategoryLabel(signals: ProductSignals): Promise<string> {
  const systemPrompt = PROMPTS.CATEGORY;

  const userContent = JSON.stringify(signals, null, 2);

  const res = await rateLimitedResponses({
    model: OPENAI_MODEL,
    input: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ],
  });

  let out = (res.output_text || '').toLowerCase().trim();

  // Clean up output
  out = out
    .replace(/^["']|["']$/g, '')
    .replace(/\s*>\s*/g, ' > ')
    .replace(/[^\w\s>&]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return out;
}
