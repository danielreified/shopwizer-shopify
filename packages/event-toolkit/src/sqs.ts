import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
  Message,
  type ReceiveMessageCommandInput,
} from '@aws-sdk/client-sqs';

export type ProcessMessageFn = (message: Message) => Promise<void> | void;

export type PollOptions = {
  region?: string; // default: process.env.AWS_REGION || "us-east-1"
  maxMessages?: number; // default: 10
  waitTimeSeconds?: number; // default: 20 (long polling)
  visibilityTimeout?: number; // default: 30
  idleBackoffMs?: number; // default: 1000 (when queue is empty)
  errorBackoffMs?: number; // default: 5000 (on receive error)
  signal?: AbortSignal; // optional: clean shutdown
};

export type QueueItem = {
  url: string;
  handler: ProcessMessageFn;
  /** Optional per-queue overrides (merged over the global options) */
  options?: Partial<PollOptions>;
};

export function createSqsClient(region?: string) {
  return new SQSClient({ region: region || process.env.AWS_REGION || 'us-east-1' });
}

function abortableSleep(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve) => {
    if (signal?.aborted) return resolve();
    const t = setTimeout(resolve, ms);
    if (signal) {
      const onAbort = () => {
        clearTimeout(t);
        resolve();
      };
      signal.addEventListener('abort', onAbort, { once: true });
    }
  });
}

/**
 * pollSQS (array-first):
 * - Pass an array of queues; for a single queue, pass array length 1.
 * - Returns a { stop } you can call to abort all loops (unless you pass your own signal).
 */
export function pollSQS(
  queues: QueueItem[],
  globalOptions: PollOptions = {},
): { stop: () => void } {
  // If caller didn't provide a signal, create one we can stop().
  const internal = !globalOptions.signal ? new AbortController() : null;
  const signal = globalOptions.signal ?? internal!.signal;

  for (const { url, handler, options } of queues) {
    const merged: Required<PollOptions> = {
      region: options?.region ?? globalOptions.region ?? process.env.AWS_REGION ?? 'us-east-1',
      maxMessages: options?.maxMessages ?? globalOptions.maxMessages ?? 10,
      waitTimeSeconds: options?.waitTimeSeconds ?? globalOptions.waitTimeSeconds ?? 20,
      visibilityTimeout: options?.visibilityTimeout ?? globalOptions.visibilityTimeout ?? 30,
      idleBackoffMs: options?.idleBackoffMs ?? globalOptions.idleBackoffMs ?? 1000,
      errorBackoffMs: options?.errorBackoffMs ?? globalOptions.errorBackoffMs ?? 5000,
      signal,
    };

    const sqs = createSqsClient(merged.region);

    // fire-and-forget loop for this queue
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    (async () => {
      while (!merged.signal?.aborted) {
        try {
          const input: ReceiveMessageCommandInput = {
            QueueUrl: url,
            MaxNumberOfMessages: merged.maxMessages,
            WaitTimeSeconds: merged.waitTimeSeconds,
            VisibilityTimeout: merged.visibilityTimeout,
            MessageAttributeNames: ['All'],
            // ✅ Request all system attributes (includes ApproximateReceiveCount)
            AttributeNames: ['All'],
          };

          const resp = await sqs.send(new ReceiveMessageCommand(input));

          const msgs = resp.Messages ?? [];
          if (msgs.length === 0) {
            await abortableSleep(merged.idleBackoffMs, merged.signal);
            continue;
          }

          await Promise.all(
            msgs.map(async (m) => {
              try {
                // m.Attributes?.ApproximateReceiveCount is now available
                await Promise.resolve(handler(m));
                if (m.ReceiptHandle) {
                  await sqs.send(
                    new DeleteMessageCommand({
                      QueueUrl: url,
                      ReceiptHandle: m.ReceiptHandle,
                    }),
                  );
                }
              } catch (err) {
                // Leave message; SQS redrive handles retries/DLQ.
                // eslint-disable-next-line no-console
                console.error(`[SQS] handler error (queue=${url}):`, err);
              }
            }),
          );
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error(`[SQS] receive error (queue=${url}):`, err);
          await abortableSleep(merged.errorBackoffMs, merged.signal);
        }
      }
    })();
  }

  return {
    stop: () => {
      internal?.abort();
    },
  };
}
