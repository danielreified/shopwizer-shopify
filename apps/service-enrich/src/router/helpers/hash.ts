import { createHash } from 'crypto';

export function hashField(value: unknown): string {
  return createHash('sha1')
    .update(JSON.stringify(value) || '')
    .digest('hex');
}

export function computeFieldHashes(data: Record<string, any>): Record<string, string> {
  const hashes: Record<string, string> = {};

  for (const key of Object.keys(data)) {
    hashes[key] = hashField(data[key]);
  }

  return hashes;
}
