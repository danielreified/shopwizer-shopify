import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { randomUUID } from 'crypto';

const client = new EventBridgeClient({});

export interface EventMeta {
  correlationId: string;
  timestamp: string;
  environment: string;
}

interface PublishOptions {
  source: string;
  detailType: string;
  detail: unknown;
  correlationId?: string;
  eventBusName?: string;
}

export async function publish(opts: PublishOptions): Promise<{ correlationId: string }> {
  const busName = opts.eventBusName ?? process.env.EVENT_BUS_NAME;

  if (!busName) {
    throw new Error('Missing EVENT_BUS_NAME env var');
  }

  const correlationId = opts.correlationId ?? randomUUID();

  const entry = {
    EventBusName: busName,
    Source: opts.source,
    DetailType: opts.detailType,
    Detail: JSON.stringify({
      ...(opts.detail as object),
      __meta: {
        correlationId,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV ?? 'unknown',
      },
    }),
  };

  console.log('[ENTRY]: ', entry);

  const result = await client.send(new PutEventsCommand({ Entries: [entry] }));

  if (result.FailedEntryCount && result.FailedEntryCount > 0) {
    const failed = result.Entries?.find((e) => e.ErrorCode);
    throw new Error(`EventBridge publish failed: ${failed?.ErrorCode} - ${failed?.ErrorMessage}`);
  }

  console.log(`[eventbridge] published ${opts.detailType} correlationId=${correlationId}`);

  return { correlationId };
}
