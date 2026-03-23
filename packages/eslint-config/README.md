# @repo/eslint-config

Shared ESLint 8 configuration for all TypeScript packages in the monorepo.

## What It Includes

- `eslint:recommended`
- `@typescript-eslint/recommended`
- `eslint-config-prettier` (disables formatting rules that conflict with Prettier)
- Parser: `@typescript-eslint/parser` (ESNext modules, ES2020)

## Notable Rules

- `@typescript-eslint/no-unused-vars` — errors, with `_` prefix ignored
- `@typescript-eslint/no-explicit-any` — warns
- `@typescript-eslint/no-non-null-assertion` — off
- `no-empty` — errors, but allows empty catch blocks

## Usage

In a package's `.eslintrc.js`:

```js
module.exports = {
  extends: ['@repo/eslint-config'],
};
```

Or in `package.json`:

```json
{
  "eslintConfig": {
    "extends": ["@repo/eslint-config"]
  }
}
```
