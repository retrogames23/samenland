import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

// Testebene 3: engine + Model-C long-run simulations (excluded from `npm test`).
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    testTimeout: 14400000,
    include: ["src/game/simulation/**/*.test.ts"],
  },
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
});
