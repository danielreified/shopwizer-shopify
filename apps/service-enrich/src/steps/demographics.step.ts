// src/steps/demographics.step.ts
import { inferDemographicsMetafields } from '../services/enrich.demographics';
import { prisma } from '../db/prisma';
import { AgeBucket, AgeSource, Gender, GenderSource } from '@prisma/client';
import type { Step, StepContext } from './types';
import { hasKeysChanged, getStepResult } from './types';
import type { CategoryMatchResult } from './category-match.step';
import { logger } from '@repo/logger';

// -----------------------------------------------------------
// Normalizers
// -----------------------------------------------------------
const normalizeGender = (value: unknown): Gender => {
  if (typeof value === 'string' && value in Gender) {
    return Gender[value as keyof typeof Gender];
  }
  return Gender.UNKNOWN;
};

const normalizeAgeBucket = (value: unknown): AgeBucket => {
  if (typeof value !== 'string') return AgeBucket.UNKNOWN;
  const normalized = value.toUpperCase();
  if (normalized === 'TEENS') return AgeBucket.TEEN;
  if (normalized === 'ALL_AGES') return AgeBucket.ALL_AGE;
  if (normalized in AgeBucket) {
    return AgeBucket[normalized as keyof typeof AgeBucket];
  }
  return AgeBucket.UNKNOWN;
};

const normalizeGenderSource = (value: unknown): GenderSource => {
  if (typeof value !== 'string') return GenderSource.NONE;
  const normalized = value.toUpperCase();
  switch (normalized) {
    case 'METAFIELD':
      return GenderSource.METAFIELD;
    case 'AUTO':
    case 'KEYWORD':
    case 'CATEGORY':
      return GenderSource.AUTO;
    case 'NONE':
      return GenderSource.NONE;
    default:
      return GenderSource.NONE;
  }
};

const normalizeAgeSource = (value: unknown): AgeSource => {
  if (typeof value !== 'string') return AgeSource.NONE;
  const normalized = value.toUpperCase();
  switch (normalized) {
    case 'METAFIELD':
      return AgeSource.METAFIELD;
    case 'AUTO':
    case 'KEYWORD':
    case 'CATEGORY':
      return AgeSource.AUTO;
    case 'NONE':
      return AgeSource.NONE;
    default:
      return AgeSource.NONE;
  }
};

/**
 * Infers demographics (gender, age) from product data
 */
export const demographicsStep: Step<unknown> = {
  name: 'demographics',
  keys: ['tags', 'collections', 'gender', 'ageGroup'],

  shouldRun(ctx: StepContext): boolean {
    return hasKeysChanged(this.keys, ctx.inputHashes, ctx.prevHashes);
  },

  async execute(ctx: StepContext): Promise<unknown> {
    // Get categoryId from categoryMatch result or input data
    const categoryMatch = getStepResult<CategoryMatchResult>(ctx, 'categoryMatch');
    let categoryId = categoryMatch?.id ?? ctx.data.category?.id ?? null;
    let categoryMeta: { id: string | null; hasTargetGender: boolean; hasAgeGroup: boolean } | null =
      categoryMatch
        ? {
            id: categoryMatch.id,
            hasTargetGender: categoryMatch.hasTargetGender,
            hasAgeGroup: categoryMatch.hasAgeGroup,
          }
        : null;

    logger.debug({ categoryId, productId: ctx.productId }, 'Resolved categoryId');

    // Fetch category metadata from DB if not in categoryMatch result
    if (!categoryMeta && categoryId) {
      const found = await prisma.category.findUnique({
        where: { id: categoryId },
        select: {
          id: true,
          hasTargetGender: true,
          hasAgeGroup: true,
        },
      });

      if (found) {
        categoryMeta = {
          id: found.id,
          hasTargetGender: found.hasTargetGender,
          hasAgeGroup: found.hasAgeGroup,
        };
      } else {
        logger.debug({ categoryId }, 'Category not found in DB, using defaults');
        categoryMeta = {
          id: categoryId,
          hasTargetGender: false,
          hasAgeGroup: false,
        };
      }
    }

    const demo = await inferDemographicsMetafields({
      categoryId,
      hasTargetGender: categoryMeta?.hasTargetGender,
      hasAgeGroup: categoryMeta?.hasAgeGroup,
      metafieldAgeGroup: ctx.data?.ageGroup ?? [],
      metafieldGender: ctx.data?.gender ?? [],
      collections: ctx.data.collections ?? [],
      tags: ctx.data.tags ?? [],
      title: ctx.data.title,
      productType: ctx.data.productType ?? undefined,
    });

    await prisma.product.update({
      where: { id: BigInt(ctx.productId) },
      data: {
        gender: (demo?.genders ?? ['UNKNOWN']).map(normalizeGender),
        genderSource: normalizeGenderSource(demo?.genderSource),
        ageBucket: (demo?.ageBuckets ?? ['UNKNOWN']).map(normalizeAgeBucket),
        ageSource: normalizeAgeSource(demo?.ageSource),
      },
    });

    logger.debug({ productId: ctx.productId }, 'demographics completed');
    return demo;
  },
};
