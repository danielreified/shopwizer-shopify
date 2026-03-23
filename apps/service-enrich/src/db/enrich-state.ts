import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

/**
 * Table shape (on-demand, TTL enabled):
 *  - pk = "<shopDomain>#<productId>"
 *  - sk = "enrich#v1" or "enrich#v2"
 *
 *  Final form:
 *    {
 *      pk,
 *      sk,
 *      hashes: {
 *        title: "...",
 *        productType: "...",
 *        tags: "...",
 *        descriptionHtml: "...",
 *        collections: "...",
 *        metafields: "...",
 *        vendor: "...",
 *        handle: "..."
 *      },
 *      updatedAt: ISO,
 *      ttl_expires_at: number
 *    }
 */

const TABLE = process.env.ENRICH_STATE_TABLE_NAME;
if (!TABLE) throw new Error('❌ Missing env ENRICH_STATE_TABLE_NAME');

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
});

export type EnrichState = {
  hashes?: Record<string, string>;
  updatedAt?: string;
  ttl_expires_at?: number;
};

export function makeKeys(shop: string, productId: string, version = 1) {
  return {
    pk: `${shop}#${String(productId)}`,
    sk: `enrich#v${version}`,
  };
}

/** 🔍 Load entire enrichment state */
export async function getEnrichState(args: { shop: string; productId: string; version?: number }) {
  const { pk, sk } = makeKeys(args.shop, args.productId, args.version ?? 1);
  const res = await ddb.send(
    new GetCommand({
      TableName: TABLE,
      Key: { pk, sk },
      ConsistentRead: true,
    }),
  );
  return (res.Item as EnrichState | undefined) ?? undefined;
}

/**
 * 💾 Save full hash set after the router runs
 */
export async function updateEnrichState(args: {
  shop: string;
  productId: string;
  hashes: Record<string, string>;
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
      UpdateExpression: 'SET hashes = :h, updatedAt = :u, ttl_expires_at = :ttl',
      ExpressionAttributeValues: {
        ':h': args.hashes,
        ':u': now.toISOString(),
        ':ttl': ttl,
      },
    }),
  );
}
