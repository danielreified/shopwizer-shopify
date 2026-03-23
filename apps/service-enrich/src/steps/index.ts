// src/steps/index.ts
import type { Step } from './types';

import { categoryLabelStep } from './category-label.step';
import { embeddingStep } from './embedding.step';
import { categoryMatchStep } from './category-match.step';
import { attributesEmbeddingStep } from './attributes-embedding.step';
import { vendorEmbeddingStep } from './vendor-embedding.step';
import { demographicsStep } from './demographics.step';

/**
 * All pipeline steps in execution order
 */
export const PIPELINE_STEPS: Step[] = [
  categoryLabelStep,
  embeddingStep,
  categoryMatchStep,
  attributesEmbeddingStep,
  vendorEmbeddingStep,
  demographicsStep,
];

// Re-export types
export * from './types';
export type { CategoryMatchResult } from './category-match.step';
