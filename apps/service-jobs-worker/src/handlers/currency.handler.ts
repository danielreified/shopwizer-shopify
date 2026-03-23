import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { logger } from '@repo/logger';

const s3 = new S3Client({});

const API_URL = 'https://api.apilayer.com/exchangerates_data/latest?base=USD';

/**
 * 🔁 Daily Currency Refresh Job
 *
 * Fetches USD → ALL currency rates from API Layer,
 * writes:
 *   • latest.json (overwrite)
 *   • 2025-11-13T22-10-00Z.json (archive snapshot)
 *
 * CloudFront has a 24h TTL, so cache naturally expires daily.
 * No invalidation needed.
 */
export async function handleCurrencyJob() {
  // -----------------------------------------------------------------------
  // 1️⃣ Fetch from API Layer
  // -----------------------------------------------------------------------
  let json;
  try {
    const res = await fetch(API_URL, {
      headers: {
        apikey: process.env.CURRENCY_API_KEY!,
      },
    });

    if (!res.ok) {
      logger.error({ status: res.status }, 'Currency API request failed');
      throw new Error(`Currency API returned ${res.status}`);
    }

    json = await res.json();
  } catch (err) {
    logger.error({ err }, 'Failed fetching from API Layer');
    return { ok: false, error: 'fetch_failed' };
  }

  logger.debug('Fetched currency data from API Layer');

  // -----------------------------------------------------------------------
  // 2️⃣ Build archive filename
  // -----------------------------------------------------------------------
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const archiveKey = `${timestamp}.json`;

  const bucket = process.env.CURRENCY_BUCKET!;

  // -----------------------------------------------------------------------
  // 3️⃣ Upload latest.json (overwrite)
  // -----------------------------------------------------------------------
  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: 'latest.json',
        Body: JSON.stringify(json, null, 2),
        ContentType: 'application/json',
        // Set Cache-Control header for CloudFront to honor
        CacheControl: 'public, max-age=86400', // 24 hours
      }),
    );

    logger.debug({ bucket, key: 'latest.json' }, 'Uploaded latest.json');
  } catch (err) {
    logger.error({ err }, 'Failed uploading latest.json');
    return { ok: false, error: 'latest_upload_failed' };
  }

  // -----------------------------------------------------------------------
  // 4️⃣ Upload archive snapshot
  // -----------------------------------------------------------------------
  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: archiveKey,
        Body: JSON.stringify(json, null, 2),
        ContentType: 'application/json',
      }),
    );

    logger.debug({ bucket, key: archiveKey }, 'Archived snapshot');
  } catch (err) {
    logger.error({ err }, 'Failed archiving snapshot');
    return { ok: false, error: 'archive_upload_failed' };
  }

  logger.info('Currency refresh job completed');

  return { ok: true };
}
