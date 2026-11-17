import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node", // pure game logic; DOM-dependent files opt in with `// @vitest-environment jsdom`
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    testTimeout: 60000, // long 730-day town simulations exceed 20 s when run in parallel
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    // Testebene 3 (long simulations) runs only via vitest.sim.config.ts / npm run test:sim*
    exclude: ["**/node_modules/**", "src/game/simulation/**"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
