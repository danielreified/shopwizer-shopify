# @repo/tailwind-config

Shared Tailwind CSS configuration for frontend packages in the monorepo.

## What It Provides

A base `tailwind.config.js` with:

- Content paths: `./src/**/*.{js,ts,jsx,tsx,css}`
- Default theme (extensible via spreading)
- No plugins by default

## Usage

In a package's `tailwind.config.js`:

```js
const sharedConfig = require('@repo/tailwind-config');

module.exports = {
  ...sharedConfig,
  content: [
    ...sharedConfig.content,
    './app/**/*.{js,ts,jsx,tsx}',
  ],
};
```
