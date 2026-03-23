# @repo/event-toolkit

SQS polling, health checks, graceful shutdown, and JSON utilities for event-driven services. Provides the runtime infrastructure that services use alongside `@repo/event-contracts`.

## Exports

### SQS Polling (`pollSQS`)

- `pollSQS(queues, options)` — long-poll one or more SQS queues concurrently with configurable backoff, visibility timeout, and abort signal support. Auto-deletes messages on successful processing; leaves failed messages for SQS redrive/DLQ.
- `createSqsClient(region?)` — create a raw SQS client

### Health Server (`createHealthServer`)

- `createHealthServer(port?)` — start an HTTP server responding to `GET /health` (used by ECS health checks)

### Graceful Shutdown (`setupGracefulShutdown`)

- `setupGracefulShutdown(callback)` — register SIGINT/SIGTERM handlers that run async cleanup before exit

### JSON Utilities

- `parseJsonSafe<T>(s)` — parse JSON without throwing, returns `null` on failure
- `unwrapEventBridge<T>(raw)` — extract `detail` payload from EventBridge envelope format
- `parseAndUnwrap<T>(s)` — combines parse + unwrap in one step

## Usage

```ts
import { pollSQS, createHealthServer, setupGracefulShutdown, parseAndUnwrap } from '@repo/event-toolkit';

createHealthServer(3000);

const { stop } = pollSQS([
  {
    url: process.env.QUEUE_URL!,
    handler: async (msg) => {
      const payload = parseAndUnwrap(msg.Body);
      // process...
    },
  },
]);

setupGracefulShutdown(() => stop());
```

## Scripts

```bash
pnpm build  # Compile TypeScript
pnpm dev    # Watch mode
pnpm lint   # Run ESLint
```
