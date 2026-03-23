# @repo/ml-core

Shared ML taxonomy constants used by the Python ML services and Node.js enrichment pipeline. Defines the optimal category depth per root taxonomy for product clustering.

## Exports

### `TAXONOMY_TARGET_DEPTH`

A `Record<string, number>` mapping root category names to their target clustering depth:

- **Depth 3** (high functional density): Apparel & Accessories, Health & Beauty, Home & Garden, Sporting Goods, etc.
- **Depth 2** (high brand importance): Electronics, Software, Hardware, Cameras & Optics, etc.
- **Default**: 3

### `EXCLUDED_ROOTS`

Categories excluded from taxonomy processing: Bundles, Gift Cards, Uncategorized, Product Add-Ons.

## Usage

```ts
import { TAXONOMY_TARGET_DEPTH, EXCLUDED_ROOTS } from '@repo/ml-core';

const depth = TAXONOMY_TARGET_DEPTH['Electronics']; // 2
const shouldSkip = EXCLUDED_ROOTS.includes('Gift Cards'); // true
```
