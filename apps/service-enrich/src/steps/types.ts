// src/steps/types.ts
import type { EnrichInputData } from '../router/enrich.router';

/**
 * Step names in pipeline execution order
 */
export type StepName =
  | 'categoryLabel'
  | 'embedding'
  | 'categoryMatch'
  | 'attributesEmbedding'
  | 'vendorEmbedding'
  | 'demographics';

/**
 * Result of a step execution
 */
export interface StepResult<T = unknown> {
  skipped: boolean;
  reason?: string; // "no change" | "missing dep" | etc.
  data?: T;
}

/**
 * Context passed to each step
 */
export interface StepContext {
  shop: string;
  productId: string;
  data: EnrichInputData;
  inputHashes: Record<string, string>;
  prevHashes: Record<string, string>;
  results: Map<StepName, StepResult>;
}

/**
 * Step interface - each step decides if it should run
 */
export interface Step<T = unknown> {
  name: StepName;
  keys: string[]; // hash keys that trigger this step (empty = always run)

  shouldRun(ctx: StepContext): boolean;
  execute(ctx: StepContext): Promise<T>;
}

/**
 * Helper to check if a step's hash keys have changed
 */
export function hasKeysChanged(
  keys: string[],
  inputHashes: Record<string, string>,
  prevHashes: Record<string, string>,
): boolean {
  // Empty keys = always run
  if (keys.length === 0) return true;
  return keys.some((k) => inputHashes[k] !== prevHashes[k]);
}

/**
 * Helper to get result data from a previous step
 */
export function getStepResult<T>(ctx: StepContext, stepName: StepName): T | undefined {
  const result = ctx.results.get(stepName);
  if (!result || result.skipped) return undefined;
  return result.data as T;
}
