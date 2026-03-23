import type { PrismaClient } from '@prisma/client';
import { mockDeep, type DeepMockProxy } from 'vitest-mock-extended';

export type MockPrismaClient = DeepMockProxy<PrismaClient>;

export function createMockPrisma(): MockPrismaClient {
  return mockDeep<PrismaClient>();
}
