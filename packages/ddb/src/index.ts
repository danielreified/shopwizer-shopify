import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
  QueryCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';

/**
 * Table structure (on-demand, TTL enabled):
 *  - pk = "<shop>#<productId>"
 *  - sk = "enrich#v<version>"
 *
 * New model:
 *  - hashes: Record<string, string>  // per-field hashes
 *  - updatedAt: ISO string
 *  - ttl_expires_at: epoch seconds
 *
 */

const TABLE = process.env.ENRICH_STATE_TABLE_NAME;
if (!TABLE) throw new Error('❌ Missing env ENRICH_STATE_TABLE_NAME');

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
});

/** Flexible enrichment state */
export type EnrichState = {
  hashes?: Record<string, string>; // <--- NEW flexible hash map
  updatedAt?: string;
  ttl_expires_at?: number;
};

/** Primary + sort key generator */
export function makeKeys(shop: string, productId: string, version = 1) {
  return {
    pk: `${shop}#${String(productId)}`,
    sk: `enrich#v${version}`,
  };
}

/** Fetch DDB state for a product */
export async function getEnrichState(args: {
  shop: string;
  productId: string;
  version?: number;
}): Promise<EnrichState | undefined> {
  const { pk, sk } = makeKeys(args.shop, args.productId, args.version ?? 1);

  const out = await ddb.send(
    new GetCommand({
      TableName: TABLE,
      Key: { pk, sk },
      ConsistentRead: true,
    }),
  );

  return (out.Item as EnrichState) ?? undefined;
}

/**
 * Write full hashes after enrichment run.
 * This replaces `updateEnrichStateAfterCompute` (deprecated).
 */
export async function updateEnrichState(args: {
  shop: string;
  productId: string;
  version?: number;
  hashes: Record<string, string>;
  ttlDays?: number;
}) {
  const { pk, sk } = makeKeys(args.shop, args.productId, args.version ?? 1);

  const now = new Date();
  const ttlDays = args.ttlDays ?? 365;
  const ttl = Math.floor(Date.now() / 1000) + ttlDays * 86400;

  await ddb.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { pk, sk },
      UpdateExpression: 'SET hashes = :hashes, updatedAt = :u, ttl_expires_at = :ttl',
      ExpressionAttributeValues: {
        ':hashes': args.hashes,
        ':u': now.toISOString(),
        ':ttl': ttl,
      },
    }),
  );
}

/**
 * LEGACY UTILITIES (kept only for compatibility)
 * You no longer use these in the new pipeline.
 */
export async function shouldComputeEmbedding(args: {
  shop: string;
  productId: string;
  nextEmbeddingHash: string;
  version?: number;
}) {
  const state = await getEnrichState(args);
  // Use new hashes map - check embedding hash
  return state?.hashes?.embedding !== args.nextEmbeddingHash;
}

/**
 * LEGACY API – no longer used by new router.
 * Keep temporarily to avoid breaking old services.
 */
export async function updateEnrichStateAfterCompute(args: {
  shop: string;
  productId: string;
  nextEmbeddingHash: string;
  version?: number;
  ttlDays?: number;
}) {
  const { pk, sk } = makeKeys(args.shop, args.productId, args.version ?? 1);
  const now = new Date();
  const ttlDays = args.ttlDays ?? 365;
  const ttl = Math.floor(Date.now() / 1000) + ttlDays * 86400;

  await ddb.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { pk, sk },
      UpdateExpression: 'SET embeddingHash = :eh, updatedAt = :u, ttl_expires_at = :ttl',
      ExpressionAttributeValues: {
        ':eh': args.nextEmbeddingHash,
        ':u': now.toISOString(),
        ':ttl': ttl,
      },
    }),
  );
}

/**
 * Delete *all* versions of enrich state for a product.
 */
export async function deleteEnrichStates(args: {
  shop: string;
  productId: bigint | string | number;
}) {
  const pk = `${args.shop}#${String(args.productId)}`;

  try {
    const res = await ddb.send(
      new QueryCommand({
        TableName: TABLE,
        KeyConditionExpression: 'pk = :pk',
        ExpressionAttributeValues: { ':pk': pk },
        ProjectionExpression: 'pk, sk',
      }),
    );

    const items = res.Items ?? [];
    if (!items.length) {
      console.log(`[ddb] no enrich states found for ${pk}`);
      return 0;
    }

    for (const item of items) {
      await ddb.send(
        new DeleteCommand({
          TableName: TABLE,
          Key: { pk: item.pk, sk: item.sk },
        }),
      );
    }

    console.log(`[ddb] deleted ${items.length} enrich state(s) for ${pk}`);
    return items.length;
  } catch (err) {
    console.error(`[ddb] failed to delete enrich states for ${pk}`, err);
    throw err;
  }
}
