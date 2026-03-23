#!/usr/bin/env npx tsx
/**
 * Simple Lambda build script using esbuild
 * Usage: npx tsx scripts/lambda/build.ts [--entry src/index.ts] [--out .lambda]
 */
import * as esbuild from 'esbuild';
import { execSync } from 'child_process';
import { mkdirSync, rmSync, existsSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';

interface BuildOptions {
  entry: string;
  outDir: string;
  name: string;
  external: string[];
  minify: boolean;
  sourcemap: boolean;
}

function parseArgs(): BuildOptions {
  const args = process.argv.slice(2);
  const options: BuildOptions = {
    entry: 'src/index.ts',
    outDir: '.lambda',
    name: 'function',
    external: ['@aws-sdk/*'],
    minify: true,
    sourcemap: true,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--entry' && args[i + 1]) {
      options.entry = args[++i];
    } else if (args[i] === '--out' && args[i + 1]) {
      options.outDir = args[++i];
    } else if (args[i] === '--name' && args[i + 1]) {
      options.name = args[++i];
    } else if (args[i] === '--no-minify') {
      options.minify = false;
    } else if (args[i] === '--no-sourcemap') {
      options.sourcemap = false;
    } else if (args[i] === '--external' && args[i + 1]) {
      options.external = args[++i].split(',');
    }
  }

  return options;
}

async function buildLambda(options: BuildOptions) {
  const { entry, outDir, name, external, minify, sourcemap } = options;
  const buildDir = join(outDir, 'build');
  const zipPath = join(outDir, `${name}.zip`);

  console.log(`📦 Building Lambda "${name}" from ${entry}...`);

  // Clean and create output directory
  if (existsSync(outDir)) {
    rmSync(outDir, { recursive: true, force: true });
  }
  mkdirSync(buildDir, { recursive: true });

  // Bundle with esbuild
  const result = await esbuild.build({
    entryPoints: [entry],
    bundle: true,
    platform: 'node',
    target: 'node20',
    outfile: join(buildDir, 'index.js'),
    external,
    sourcemap,
    minify,
    metafile: true,
  });

  const outputs = Object.values(result.metafile?.outputs ?? {});
  const totalBytes = outputs.reduce((sum, o) => sum + o.bytes, 0);
  console.log(`📊 Bundle size: ${(totalBytes / 1024).toFixed(1)} KB`);

  // --- COPY PRISMA ENGINE ---
  // Lambda runs on ARM64 (Amazon Linux 2/2023), so we need the linux-arm64 binary.
  // It should be generated in root node_modules/.prisma/client
  const PRISMA_ENGINE = 'libquery_engine-linux-arm64-openssl-3.0.x.so.node';
  const possiblePaths = [
    join(process.cwd(), 'node_modules', '.prisma', 'client', PRISMA_ENGINE),
    join(process.cwd(), '..', '..', 'node_modules', '.prisma', 'client', PRISMA_ENGINE), // Monorepo root
  ];

  let engineCopied = false;
  const { copyFileSync, existsSync: fileExists } = await import('fs');

  for (const p of possiblePaths) {
    if (fileExists(p)) {
      console.log(`🧩 Copying Prisma engine: ${p}`);

      // Prisma Client looks in /node_modules/.prisma/client relative to execution
      // So we create that structure inside the lambda zip
      const prismaDir = join(buildDir, 'node_modules', '.prisma', 'client');
      mkdirSync(prismaDir, { recursive: true });

      copyFileSync(p, join(prismaDir, PRISMA_ENGINE));

      // ALSO copy to root as a fallback (sometimes helps with "next to bundle" logic)
      copyFileSync(p, join(buildDir, PRISMA_ENGINE));

      engineCopied = true;
      break;
    }
  }

  if (!engineCopied) {
    console.warn(`⚠️  Prisma engine (${PRISMA_ENGINE}) not found! Database calls may fail.`);
    console.warn(`   Checked: ${possiblePaths.join(', ')}`);
    console.warn(`   Run 'pnpm --filter @repo/prisma run generate' to fix.`);
  }

  // Create zip
  try {
    execSync(`cd "${resolve(buildDir)}" && zip -qr "../${name}.zip" .`, {
      stdio: 'pipe',
    });
  } catch {
    // Fallback: just copy the JS file if zip isn't available
    console.log('⚠️  zip command not found, copying JS directly...');
    const { copyFileSync } = await import('fs');
    copyFileSync(join(buildDir, 'index.js'), join(outDir, 'index.js'));
    console.log(`✅ Built (no zip): ${resolve(join(outDir, 'index.js'))}`);
    return join(outDir, 'index.js');
  }

  console.log(`✅ Built: ${resolve(zipPath)}`);
  return zipPath;
}

// Run
buildLambda(parseArgs()).catch((err) => {
  console.error('❌ Build failed:', err.message);
  process.exit(1);
});
