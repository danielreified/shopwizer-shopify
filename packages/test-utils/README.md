# @repo/test-utils

Shared test mock factories and fixtures for vitest-based service tests.

## Exports

### Root (`@repo/test-utils`)

Re-exports everything from the sub-modules below.

### Mock Prisma (`@repo/test-utils/mock-prisma`)

- `createMockPrisma()` — returns a deep mock of `PrismaClient` via `vitest-mock-extended`
- `MockPrismaClient` — type alias for the mock

### Mock SQS (`@repo/test-utils/mock-sqs`)

- `createMockSQSMessage(opts?)` — create a JSON-encoded SQS message body with Shopify webhook headers
- `createMockProductWebhook(overrides?)` — create a full product webhook payload with sensible defaults

### Fixtures (`@repo/test-utils/fixtures`)

- `MOCK_SHOP` — a complete shop fixture (`id`, `domain`, `name`, `currency`, etc.)
- `MOCK_PRODUCT` — a complete product fixture with variants, images, and options

## Usage

```ts
import { createMockPrisma, MOCK_SHOP } from '@repo/test-utils';

const prisma = createMockPrisma();
prisma.shop.findUnique.mockResolvedValue(MOCK_SHOP);
```

## Scripts

```bash
pnpm lint  # Run ESLint
```
