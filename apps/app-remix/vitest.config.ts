import { defineConfig, mergeConfig } from "vitest/config";
import shared from "../../packages/typescript-config/vitest.shared";

export default mergeConfig(shared, defineConfig({
  test: {
    root: ".",
    environment: "jsdom",
    include: ["app/**/*.test.ts", "app/**/*.test.tsx"],
    setupFiles: ["./test/setup.ts"],
    alias: {
      "~/shopify.server": new URL("./test/mocks/shopify.server.ts", import.meta.url).pathname,
      "~/db.server": new URL("./test/mocks/db.server.ts", import.meta.url).pathname,
    },
  },
}));
