import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  'apps/service-*/vitest.config.ts',
  'apps/fn-*/vitest.config.ts',
  'apps/app-remix/vitest.config.ts',
  'packages/*/vitest.config.ts',
]);
