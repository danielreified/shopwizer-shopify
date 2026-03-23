# @repo/typescript-config

Shared TypeScript configuration presets for the monorepo.

## Available Presets

| File | Target | Module | Use Case |
|------|--------|--------|----------|
| `base.json` | — | ESNext / Bundler | Base config all others extend |
| `node.json` | ES2022 | NodeNext | Backend services, Lambdas |
| `vite.json` | ESNext | ESNext | Frontend apps (Remix, Next.js) |

### `base.json`

Strict mode enabled. Key settings: `isolatedModules`, `skipLibCheck`, `declarationMap`, `esModuleInterop`.

### `node.json`

Extends base. Emits to `dist/` with declarations. Uses NodeNext module resolution for ESM + CJS compatibility.

### `vite.json`

Extends base. No-emit mode (Vite handles bundling). Includes DOM lib. Enables `noUnusedLocals` and `noUnusedParameters`.

### `vitest.shared.ts`

Shared vitest configuration used across service test setups.

## Usage

In a package's `tsconfig.json`:

```json
{
  "extends": "@repo/typescript-config/node.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```
