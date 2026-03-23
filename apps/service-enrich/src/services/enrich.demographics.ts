// src/services/enrich.demographics.ts
import { z } from 'zod';
import { OPENAI_MODEL, rateLimitedResponses } from '../config/openai';
import { logger } from '@repo/logger';
import { ENRICH_LOGIC, PROMPTS } from '../config/service.config';
import { cleanLlmJson } from '../utils/text';

// ------------------------------------------------------
//  ENUM TYPES — align with Prisma
// ------------------------------------------------------

export type Gender = 'MALE' | 'FEMALE' | 'UNISEX' | 'OTHER' | 'UNKNOWN';

export type AgeBucket = 'NEWBORN' | 'BABY' | 'KID' | 'TEEN' | 'ADULT' | 'ALL_AGE' | 'UNKNOWN';

// ------------------------------------------------------
//  SHOPIFY → INTERNAL MAPPING
// ------------------------------------------------------

const SHOPIFY_GENDER_MAP = ENRICH_LOGIC.DEMOGRAPHICS.GENDER_MAP;

const SHOPIFY_AGE_GROUP_MAP = ENRICH_LOGIC.DEMOGRAPHICS.AGE_GROUP_MAP;

// Dedup helper
const uniq = <T>(arr: T[]) => [...new Set(arr)];

// ------------------------------------------------------
//  OpenAI Structured Output Schema
// ------------------------------------------------------

const DemographicsSchema = z.object({
  gender: z
    .enum(['MALE', 'FEMALE', 'UNISEX', 'UNKNOWN'])
    .describe(
      'The primary target gender for this product. Use UNISEX if the product is for all genders or if unclear.',
    ),
  age_group: z
    .enum(['NEWBORN', 'BABY', 'KID', 'TEEN', 'ADULT', 'ALL_AGE', 'UNKNOWN'])
    .describe(
      'The primary target age group. Use ADULT as default for general products. Use ALL_AGE only if explicitly for all ages.',
    ),
  confidence: z
    .enum(['high', 'medium', 'low'])
    .describe('How confident are you in this classification based on available signals.'),
});

type DemographicsOutput = z.infer<typeof DemographicsSchema>;

// ------------------------------------------------------
//  LLM-BASED DEMOGRAPHICS INFERENCE
// ------------------------------------------------------

async function inferDemographicsViaLLM(data: {
  collections: string[];
  tags: string[];
  productType?: string;
  title?: string;
}): Promise<DemographicsOutput> {
  const signals = [
    data.title && `Title: ${data.title}`,
    data.productType && `Product Type: ${data.productType}`,
    data.collections.length > 0 && `Collections: ${data.collections.join(', ')}`,
    data.tags.length > 0 && `Tags: ${data.tags.join(', ')}`,
  ]
    .filter(Boolean)
    .join('\n');

  const systemPrompt = PROMPTS.DEMOGRAPHICS;

  try {
    const response = await rateLimitedResponses({
      model: OPENAI_MODEL,
      input: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: signals || 'No product metadata available' },
      ],
    });

    const cleaned = cleanLlmJson(response.output_text || '');

    const parsed = DemographicsSchema.safeParse(JSON.parse(cleaned));

    if (!parsed.success) {
      logger.warn({ errors: parsed.error }, 'Demographics schema validation failed');
      return { gender: 'UNISEX', age_group: 'ADULT', confidence: 'low' };
    }

    return parsed.data;
  } catch (err) {
    logger.error({ err }, 'Demographics LLM inference error');
    return { gender: 'UNISEX', age_group: 'ADULT', confidence: 'low' };
  }
}

// ------------------------------------------------------
//  MAIN EXPORT
// ------------------------------------------------------

export async function inferDemographicsMetafields(data: {
  categoryId?: string | null;
  hasTargetGender?: boolean;
  hasAgeGroup?: boolean;
  categoryGender?: string[];
  categoryAgeGroup?: string[];
  metafieldGender?: string[];
  metafieldAgeGroup?: string[];
  collections?: string[];
  tags?: string[];
  productType?: string;
  title?: string;
}) {
  // 1. Check metafields first (highest priority)
  if (data.metafieldGender?.length) {
    const genders = uniq(
      data.metafieldGender.map(
        (v: string) => (SHOPIFY_GENDER_MAP[v.toLowerCase()] as Gender) ?? 'UNKNOWN',
      ),
    );

    // Still need age
    let ageBuckets: AgeBucket[] = ['ADULT'];
    let ageSource = 'NONE';

    if (data.metafieldAgeGroup?.length) {
      ageBuckets = uniq(
        data.metafieldAgeGroup.map(
          (v: string) => (SHOPIFY_AGE_GROUP_MAP[v.toLowerCase()] as AgeBucket) ?? 'UNKNOWN',
        ),
      );
      ageSource = 'METAFIELD';
    }

    return {
      genders,
      genderSource: 'METAFIELD',
      ageBuckets,
      ageSource,
    };
  }

  if (data.metafieldAgeGroup?.length) {
    // Has age metafield but no gender metafield → infer gender via LLM
    const ageBuckets = uniq(
      data.metafieldAgeGroup.map(
        (v: string) => (SHOPIFY_AGE_GROUP_MAP[v.toLowerCase()] as AgeBucket) ?? 'UNKNOWN',
      ),
    );

    const llmResult = await inferDemographicsViaLLM({
      collections: data.collections ?? [],
      tags: data.tags ?? [],
      productType: data.productType,
      title: data.title,
    });

    return {
      genders: [llmResult.gender],
      genderSource: 'AUTO',
      ageBuckets,
      ageSource: 'METAFIELD',
    };
  }

  // 2. Check category demographics
  if (data.categoryGender?.length) {
    const genders = uniq(
      data.categoryGender.map(
        (v: string) => (SHOPIFY_GENDER_MAP[v.toLowerCase()] as Gender) ?? 'UNKNOWN',
      ),
    );

    let ageBuckets: AgeBucket[] = ['ADULT'];
    let ageSource = 'NONE';

    if (data.categoryAgeGroup?.length) {
      ageBuckets = uniq(
        data.categoryAgeGroup.map(
          (v: string) => (SHOPIFY_AGE_GROUP_MAP[v.toLowerCase()] as AgeBucket) ?? 'UNKNOWN',
        ),
      );
      ageSource = 'CATEGORY';
    }

    return {
      genders,
      genderSource: 'CATEGORY',
      ageBuckets,
      ageSource,
    };
  }

  // 3. Skip inference if category doesn't support demographics
  if (!data.hasTargetGender && !data.hasAgeGroup) {
    return {
      genders: ['UNKNOWN'] as Gender[],
      genderSource: 'NONE',
      ageBuckets: ['UNKNOWN'] as AgeBucket[],
      ageSource: 'NONE',
    };
  }

  // 4. Use LLM inference
  const llmResult = await inferDemographicsViaLLM({
    collections: data.collections ?? [],
    tags: data.tags ?? [],
    productType: data.productType,
    title: data.title,
  });

  const genders: Gender[] = data.hasTargetGender ? [llmResult.gender] : ['UNKNOWN'];
  const ageBuckets: AgeBucket[] = data.hasAgeGroup ? [llmResult.age_group] : ['UNKNOWN'];

  return {
    genders,
    genderSource: data.hasTargetGender ? 'AUTO' : 'NONE',
    ageBuckets,
    ageSource: data.hasAgeGroup ? 'AUTO' : 'NONE',
  };
}
