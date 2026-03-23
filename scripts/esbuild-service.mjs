#!/usr/bin/env node
/**
 * shared esbuild bundler for backend services
 * Usage: node scripts/esbuild-service.mjs [entrypoint]
 *
 * Bundles TypeScript source into a single ESM file that runs with plain `node dist/main.js`
 * - Bundles all local imports and @repo/* workspace packages
 * - Keeps npm dependencies external (they're in node_modules)
 * - Handles ESM/CJS interop
 */

import { build } from 'esbuild';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Get entry point from args or default to src/main.ts
const entryPoint = process.argv[2] || 'src/main.ts';
const outFile = process.argv[3] || 'dist/main.js';

console.log(`📦 Building ${entryPoint} → ${outFile}`);

// Plugin to mark npm packages as external but bundle @repo/*
const externalNpmPlugin = {
  name: 'external-npm',
  setup(build) {
    // Mark all bare imports as external EXCEPT @repo/*
    build.onResolve({ filter: /^[^./]/ }, (args) => {
      // Bundle @repo/* packages (they're workspace packages)
      if (args.path.startsWith('@repo/')) {
        return null; // Let esbuild resolve and bundle it
      }
      // Keep all other npm packages external
      return { path: args.path, external: true };
    });
  },
};

try {
  await build({
    entryPoints: [entryPoint],
    bundle: true,
    platform: 'node',
    target: 'node20',
    format: 'esm',
    outfile: outFile,
    plugins: [externalNpmPlugin],
    // Banner to handle require() in ESM context (for CJS deps)
    banner: {
      js: `import { createRequire } from 'module'; const require = createRequire(import.meta.url);`,
    },
    // Source maps for debugging
    sourcemap: true,
    // Keep names for better stack traces
    keepNames: true,
  });

  console.log(`✅ Build complete: ${outFile}`);
} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
}
