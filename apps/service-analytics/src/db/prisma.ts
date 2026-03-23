import { PrismaClient } from '@prisma/client';

// Create variable scoped to the module
let prisma: PrismaClient;

// Extend Node.js global type to store cached client
declare global {
  var __prisma: PrismaClient | undefined;
}

// Use one instance in dev, fresh in production
if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient(); // new for each container
} else {
  prisma = global.__prisma ?? new PrismaClient(); // reuse between reloads
  global.__prisma = prisma;
}

export { prisma };
