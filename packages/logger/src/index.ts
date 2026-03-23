import pino, { Logger } from 'pino';
import { randomUUID } from 'crypto';

// -----------------------------------------------------------------------------
// Configuration
// -----------------------------------------------------------------------------
const isDev = process.env.NODE_ENV !== 'production';
const serviceName = process.env.SERVICE_NAME || 'unknown-service';
const logLevel = process.env.LOG_LEVEL || (isDev ? 'debug' : 'info');

// -----------------------------------------------------------------------------
// Transport Setup
// -----------------------------------------------------------------------------
function createTransport() {
  // Local dev → pretty print to console
  if (isDev) {
    return pino.transport({
      target: 'pino-pretty',
      options: {
        colorize: true,
        ignore: 'pid,hostname',
        translateTime: 'HH:MM:ss.l',
      },
    });
  }

  // Production → JSON to stdout (CloudWatch captures, forwards to BetterStack)
  return undefined;
}

// -----------------------------------------------------------------------------
// Base Logger
// -----------------------------------------------------------------------------
export const logger: Logger = pino(
  {
    level: logLevel,
    base: {
      service: serviceName,
      env: process.env.NODE_ENV || 'development',
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label) => ({ level: label }),
    },
  },
  createTransport(),
);

export default logger;

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------
export type LogContext = {
  shopId?: string;
  correlationId?: string;
  requestId?: string;
  userId?: string;
  [key: string]: unknown;
};

export type LogData = Record<string, unknown>;

// -----------------------------------------------------------------------------
// Child Logger - for request/operation scoped logging
// -----------------------------------------------------------------------------

/**
 * Create a scoped logger with context that appears in every log.
 */
export function createLogger(context: LogContext): Logger {
  return logger.child(context);
}

/**
 * Create a request logger with auto-generated correlationId.
 */
export function createRequestLogger(context: Omit<LogContext, 'correlationId'> = {}): Logger {
  return logger.child({
    correlationId: randomUUID(),
    ...context,
  });
}

// -----------------------------------------------------------------------------
// Structured Log Helper
// -----------------------------------------------------------------------------

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogOptions {
  /** Log level (default: info) */
  level?: LogLevel;
  /** Event name for filtering (e.g., "job.completed", "order.created") */
  event: string;
  /** Human-readable message */
  msg: string;
  /** Shop identifier (top-level for easy search) */
  shopId?: string;
  /** Correlation ID for request tracing */
  correlationId?: string;
  /** Duration in milliseconds */
  durationMs?: number;
  /** Error object or message */
  error?: Error | string;
  /** Additional context data */
  data?: LogData;
}

/**
 * Log a structured event.
 * @deprecated Use logger.info/warn/error({ event: "..." }, "msg") instead.
 *
 * @example
 * log({
 *   event: "job.completed",
 *   msg: "Trending job finished",
 *   shopId: "shop.myshopify.com",
 *   durationMs: 1523,
 *   data: { productsUpdated: 150 }
 * });
 */
export function log(options: LogOptions): void {
  const { level = 'info', event, msg, shopId, correlationId, durationMs, error, data } = options;

  const logObj: Record<string, unknown> = {
    event,
    ...(shopId && { shopId }),
    ...(correlationId && { correlationId }),
    ...(durationMs !== undefined && { durationMs }),
    ...(data && { data }),
  };

  if (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    logObj.error = errorMsg;
    if (stack) logObj.stack = stack;
    logger.error(logObj, msg);
  } else {
    logger[level](logObj, msg);
  }
}

// -----------------------------------------------------------------------------
// Shorthand helpers
// -----------------------------------------------------------------------------

/** @deprecated Use logger.info({ event: "..." }, "msg") instead */
export const logInfo = (
  event: string,
  msg: string,
  opts?: Omit<LogOptions, 'event' | 'msg' | 'level'>,
) => log({ level: 'info', event, msg, ...opts });

/** @deprecated Use logger.warn({ event: "..." }, "msg") instead */
export const logWarn = (
  event: string,
  msg: string,
  opts?: Omit<LogOptions, 'event' | 'msg' | 'level'>,
) => log({ level: 'warn', event, msg, ...opts });

/** @deprecated Use logger.error({ event: "..." }, "msg") instead */
export const logError = (
  event: string,
  msg: string,
  error: Error | string,
  opts?: Omit<LogOptions, 'event' | 'msg' | 'level' | 'error'>,
) => log({ level: 'error', event, msg, error, ...opts });

/** @deprecated Use logger.debug({ event: "..." }, "msg") instead */
export const logDebug = (
  event: string,
  msg: string,
  opts?: Omit<LogOptions, 'event' | 'msg' | 'level'>,
) => log({ level: 'debug', event, msg, ...opts });

// -----------------------------------------------------------------------------
// Timer utility
// -----------------------------------------------------------------------------

export interface Timer {
  /** Get elapsed time in ms */
  elapsed(): number;
  /** Log completion */
  done(event: string, msg: string, opts?: Omit<LogOptions, 'event' | 'msg' | 'durationMs'>): void;
  /** Log error with duration */
  fail(
    event: string,
    msg: string,
    error: Error | string,
    opts?: Omit<LogOptions, 'event' | 'msg' | 'durationMs' | 'error'>,
  ): void;
}

/**
 * Start a timer for measuring operation duration.
 *
 * @example
 * const t = timer();
 * await processProducts();
 * t.done("products.processed", "Finished processing", { data: { count: 100 } });
 */
export function timer(): Timer {
  const start = performance.now();

  return {
    elapsed: () => Math.round(performance.now() - start),
    done(event, msg, opts) {
      log({ level: 'info', event, msg, durationMs: this.elapsed(), ...opts });
    },
    fail(event, msg, error, opts) {
      log({ level: 'error', event, msg, durationMs: this.elapsed(), error, ...opts });
    },
  };
}
