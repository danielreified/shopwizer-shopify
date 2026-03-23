import { vi } from "vitest";

export const authenticate = {
  admin: vi.fn().mockResolvedValue({
    admin: {
      graphql: vi.fn(),
      rest: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
    },
    session: {
      id: "test-session",
      shop: "test-shop.myshopify.com",
      state: "active",
      isOnline: false,
      accessToken: "test-token",
    },
  }),
};

export const login = vi.fn();
export const unauthenticated = { admin: vi.fn() };
export const sessionStorage = { storeSession: vi.fn(), loadSession: vi.fn(), deleteSession: vi.fn() };
export const addDocumentResponseHeaders = vi.fn();
export const apiVersion = "2025-01";

export default {
  authenticate,
  login,
  unauthenticated,
  sessionStorage,
  addDocumentResponseHeaders,
  apiVersion,
};
