// src/router/enrich.router.ts
import { getEnrichState, updateEnrichState } from '../db/enrich-state';
import { computeFieldHashes } from './helpers/hash';
import { prisma } from '../db/prisma';
import { PIPELINE_STEPS, StepContext, StepResult, StepName } from '../steps';
import { logger, timer } from '@repo/logger';

// -----------------------------------------------------------
// Input Data Type
// -----------------------------------------------------------
export interface EnrichInputData {
  title: string;
  descriptionHtml?: string | null;
  vendor?: string | null;
  productType?: string | null;
  tags: string[];
  category?: {
    id: string | null;
    gid?: string | null;
    name: string | null;
    fullName: string | null;
  } | null;
  collections?: string[];
  gender?: string[];
  ageGroup?: string[];
  handle?: string | null;
}

// -----------------------------------------------------------
// Main Pipeline
// -----------------------------------------------------------
export async function handleEnrichPipeline(input: {
  shop: string;
  productId: string;
  data: EnrichInputData;
  forceEnrich?: boolean;
}) {
  const { shop, productId, data, forceEnrich = false } = input;

  logger.info({ shop, productId, forceEnrich }, 'Starting enrichment pipeline');

  const t = timer();

  // 1️⃣ Compute hashes
  const inputHashes = computeFieldHashes(data);

  // 2️⃣ Load previous state (skip if forceEnrich=true)
  const prevState = forceEnrich ? null : await getEnrichState({ shop, productId });
  const prevHashes = prevState?.hashes ?? {};

  // 3️⃣ Build context
  const ctx: StepContext = {
    shop,
    productId,
    data,
    inputHashes,
    prevHashes,
    results: new Map(),
  };

  // 4️⃣ Execute all steps
  const stepsRun: StepName[] = [];
  const stepsSkipped: StepName[] = [];

  for (const step of PIPELINE_STEPS) {
    const shouldRun = step.shouldRun(ctx);

    if (!shouldRun) {
      ctx.results.set(step.name, { skipped: true, reason: 'no change' });
      stepsSkipped.push(step.name);
      continue;
    }

    // Execute step
    try {
      const stepData = await step.execute(ctx);
      ctx.results.set(step.name, { skipped: false, data: stepData });
      stepsRun.push(step.name);
    } catch (err: any) {
      logger.error({ shop, productId, step: step.name, err: err.message }, 'Step failed');
      ctx.results.set(step.name, {
        skipped: false,
        reason: `error: ${err.message}`,
      });
    }
  }

  // 5️⃣ Save hashes
  await updateEnrichState({ shop, productId, hashes: inputHashes });

  // 6️⃣ Mark pipeline as COMPLETED
  await prisma.product.update({
    where: { id: BigInt(productId) },
    data: { pipelineState: 'COMPLETED' },
  });

  // Log completion
  t.done('enrich.pipeline_complete', 'Enrichment pipeline completed', {
    data: { shop, productId, stepsRun, stepsSkippedCount: stepsSkipped.length },
  });

  // Convert results map to object for return
  const resultsObj: Record<string, any> = {};
  for (const [name, result] of ctx.results) {
    resultsObj[name] = result;
  }

  return { ok: true, stepsRun, results: resultsObj };
}
