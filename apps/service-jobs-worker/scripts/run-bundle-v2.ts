import 'dotenv/config';
import { handleBundleGenerateJobV2 } from '../src/handlers/bundles.generator.v2';

const shopId = process.argv[2];
if (!shopId) {
  console.error('Usage: tsx scripts/run-bundle-v2.ts <shopId>');
  process.exit(1);
}

await handleBundleGenerateJobV2(shopId);
