import 'dotenv/config';
import { handleBundleGenerateJobV2Single } from '../src/handlers/bundles.generator.v2';

const shopId = process.argv[2];
const bundleId = process.argv[3];
if (!shopId || !bundleId) {
  console.error('Usage: tsx scripts/run-bundle-v2-single.ts <shopId> <bundleId>');
  process.exit(1);
}

await handleBundleGenerateJobV2Single(shopId, bundleId);
