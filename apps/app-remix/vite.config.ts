import { reactRouter } from "@react-router/dev/vite";
import { defineConfig, type UserConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

// ---- DEBUG START ----
console.log("------------------------------------------------------");
console.log("🧭 Starting Vite with Shopify App Dev Environment");
console.log("------------------------------------------------------");
console.log("process.env.SHOPIFY_APP_URL:", process.env.SHOPIFY_APP_URL);
console.log("process.env.HOST:", process.env.HOST);
console.log("process.env.PORT:", process.env.PORT);
console.log("process.env.FRONTEND_PORT:", process.env.FRONTEND_PORT);
console.log("------------------------------------------------------");
// ---- DEBUG END ----

// Workaround for deprecated HOST variable (from Shopify CLI)
if (
  process.env.HOST &&
  (!process.env.SHOPIFY_APP_URL ||
    process.env.SHOPIFY_APP_URL === process.env.HOST)
) {
  process.env.SHOPIFY_APP_URL = process.env.HOST;
  delete process.env.HOST;
}

const host = new URL(process.env.SHOPIFY_APP_URL || "http://localhost")
  .hostname;

// ---- DEBUG ----
console.log("✅ Derived host:", host);

// HMR Configuration
let hmrConfig;
if (host === "localhost") {
  hmrConfig = {
    protocol: "ws",
    host: "localhost",
    port: 64999,
    clientPort: 64999,
  };
} else {
  hmrConfig = {
    protocol: "wss",
    host: host,
    port: parseInt(process.env.FRONTEND_PORT!) || 8002,
    clientPort: 443,
  };
}

// ---- DEBUG ----
console.log("✅ HMR Config:", hmrConfig);

export default defineConfig({
  css: {
    modules: {
      generateScopedName: "[local]__[hash:base64:5]",
    },
  },
  server: {
    allowedHosts: [host],
    cors: {
      preflightContinue: true,
    },
    port: Number(process.env.PORT || 3000),
    hmr: hmrConfig,
    fs: {
      allow: ["app", "node_modules"],
    },
  },
  plugins: [reactRouter(), tsconfigPaths()],
  build: {
    assetsInlineLimit: 0,
  },
  optimizeDeps: {
    include: ["@shopify/app-bridge-react", "@shopify/polaris"],
  },
}) satisfies UserConfig;

// ---- DEBUG ----
console.log("✅ Vite config fully loaded!");
console.log("------------------------------------------------------\n");
