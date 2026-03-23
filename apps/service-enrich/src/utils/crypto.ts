import crypto from 'crypto';

export function createSha256(input: string) {
  return crypto.createHash('sha256').update(input).digest('hex');
}
