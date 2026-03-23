# @repo/logger

Structured JSON logging for all Node.js services, built on pino. Pretty-prints in development, outputs JSON to stdout in production (for CloudWatch/BetterStack ingestion).

## Exports

- `logger` — base pino logger instance (default export)
- `createLogger(context)` — create a child logger with persistent context fields (shopId, correlationId, etc.)
- `createRequestLogger(context?)` — child logger with auto-generated `correlationId`
- `timer()` — start a performance timer with `.done()` and `.fail()` helpers for logging durations
- `log(options)` — structured event logger (deprecated in favor of `logger.info/warn/error`)
- `logInfo`, `logWarn`, `logError`, `logDebug` — shorthand helpers (deprecated)

## Usage

```ts
import { logger, createLogger, timer } from '@repo/logger';

// Direct usage
logger.info({ event: 'order.created', shopId: 'shop-1' }, 'New order received');

// Scoped child logger
const log = createLogger({ shopId: 'shop-1', correlationId: 'abc-123' });
log.info({ event: 'enrich.start' }, 'Starting enrichment');

// Timer
const t = timer();
await processProducts();
t.done('products.processed', 'Finished', { data: { count: 100 } });
```

## Configuration

| Env Variable | Description | Default |
|---|---|---|
| `NODE_ENV` | `production` for JSON output, otherwise pretty-print | `development` |
| `SERVICE_NAME` | Service identifier in log output | `unknown-service` |
| `LOG_LEVEL` | Minimum log level | `debug` (dev) / `info` (prod) |

## Scripts

```bash
pnpm lint  # Run ESLint
```
