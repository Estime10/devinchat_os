import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: "node",
    include: ["__tests__/{unit,integration}/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", ".next", "__tests__/e2e", "coverage"],
  },
  resolve: {
    alias: {
      "@": rootDir,
    },
  },
});
