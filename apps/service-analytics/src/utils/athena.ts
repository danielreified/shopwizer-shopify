import {
  AthenaClient,
  StartQueryExecutionCommand,
  GetQueryExecutionCommand,
  GetQueryResultsCommand,
} from '@aws-sdk/client-athena';
import { logger } from '@repo/logger';
import { INFRA_CONFIG } from '../config/service.config';

const athena = new AthenaClient({ region: INFRA_CONFIG.ATHENA.REGION });

export async function runAthenaQuery<T = any>(query: string): Promise<T[]> {
  logger.debug({ query: query.substring(0, 200) }, 'Running Athena query');

  // 1️⃣ Start query
  const startRes = await athena.send(
    new StartQueryExecutionCommand({
      QueryString: query,
      QueryExecutionContext: { Database: INFRA_CONFIG.ATHENA.DATABASE },
      ResultConfiguration: { OutputLocation: INFRA_CONFIG.ATHENA.OUTPUT_LOCATION },
    }),
  );

  const queryId = startRes.QueryExecutionId!;
  logger.debug({ queryId }, 'Athena query started');

  // 2️⃣ Poll until done
  while (true) {
    const exec = await athena.send(new GetQueryExecutionCommand({ QueryExecutionId: queryId }));
    const status = exec.QueryExecution?.Status?.State;
    if (status === 'SUCCEEDED') break;
    if (status === 'FAILED' || status === 'CANCELLED') {
      throw new Error(`Athena query failed: ${exec.QueryExecution?.Status?.StateChangeReason}`);
    }
    await new Promise((r) => setTimeout(r, 3000));
  }

  const res = await athena.send(new GetQueryResultsCommand({ QueryExecutionId: queryId }));

  const rows = res.ResultSet?.Rows ?? [];
  if (rows.length < 2) return [];

  const headers = rows[0]
    .Data!.map((d) => d.VarCharValue)
    .filter((h): h is string => h !== undefined);
  const data = rows.slice(1).map((row) => {
    const values = row.Data!.map((d) => d.VarCharValue ?? null);
    const obj: Record<string, any> = {};

    headers.forEach((h, i) => (obj[h] = values[i]));
    return obj as T;
  });

  logger.info({ rowCount: data.length, queryId }, 'Athena query completed');
  return data;
}

/**
 * Run MSCK REPAIR TABLE to discover new partitions from S3.
 * Should be called before querying px_events when new partitions may exist.
 */
export async function repairPxEventsPartitions(): Promise<void> {
  logger.info('Running MSCK REPAIR TABLE for px_events');

  const startRes = await athena.send(
    new StartQueryExecutionCommand({
      QueryString: 'MSCK REPAIR TABLE px_events',
      QueryExecutionContext: { Database: INFRA_CONFIG.ATHENA.DATABASE },
      ResultConfiguration: { OutputLocation: INFRA_CONFIG.ATHENA.OUTPUT_LOCATION },
    }),
  );

  const queryId = startRes.QueryExecutionId!;

  // Poll until done (MSCK REPAIR is usually fast)
  while (true) {
    const exec = await athena.send(new GetQueryExecutionCommand({ QueryExecutionId: queryId }));
    const status = exec.QueryExecution?.Status?.State;
    if (status === 'SUCCEEDED') {
      logger.info({ queryId }, 'MSCK REPAIR completed');
      return;
    }
    if (status === 'FAILED' || status === 'CANCELLED') {
      logger.warn(
        { reason: exec.QueryExecution?.Status?.StateChangeReason },
        'MSCK REPAIR failed (non-fatal)',
      );
      return; // Don't throw - MSCK REPAIR failure shouldn't stop the job
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
}
