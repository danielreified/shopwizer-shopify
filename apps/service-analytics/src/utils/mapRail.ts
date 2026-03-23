import { RecommendationRail } from '@prisma/client';

/**
 * Converts pixel/widget rail strings → Prisma enum.
 * Ensures analytics, storefront, and DB stay aligned.
 */
export function mapRail(raw: string | null | undefined): RecommendationRail | null {
  if (!raw) return null;

  const val = raw.trim().toLowerCase();

  switch (val) {
    case 'similar':
      return RecommendationRail.SIMILAR;

    case 'sellers':
      return RecommendationRail.BEST_SELLER;

    case 'trending':
      return RecommendationRail.TRENDING;

    case 'recent':
      return RecommendationRail.RECENTLY_VIEWED;

    case 'arrivals':
      return RecommendationRail.NEW_ARRIVALS;

    case 'fbt':
      return RecommendationRail.FBT;

    case 'colors':
      return RecommendationRail.COLOR_MATCH;

    default:
      return null; // skip unknown rails
  }
}
