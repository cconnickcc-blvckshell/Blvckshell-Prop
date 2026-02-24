import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    fileParallelism: false,
    setupFiles: ["./src/__tests__/setup-env.ts"],
    testTimeout: 30000,
    hookTimeout: 30000,
    exclude: ["**/node_modules/**", "**/e2e/**", "**/*.spec.ts"],
    server: {
      deps: { inline: ["next-auth"] },
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "src/__tests__/",
        "**/*.config.*",
        "**/types.ts",
        "prisma/",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "next/server": path.resolve(__dirname, "./src/__tests__/stubs/next-server.ts"),
      "next/headers": path.resolve(__dirname, "./src/__tests__/stubs/next-headers.ts"),
      "next/navigation": path.resolve(__dirname, "./src/__tests__/stubs/next-navigation.ts"),
      "next/cache": path.resolve(__dirname, "./src/__tests__/stubs/next-cache.ts"),
    },
  },
});
