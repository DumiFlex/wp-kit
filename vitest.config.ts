import { fileURLToPath } from "node:url";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [vue()],
  resolve: { alias: { "@kit": fileURLToPath(new URL("./src", import.meta.url)) } },
  define: { __KIT_VERSION__: JSON.stringify("0.0.0-test") },
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.test.ts", "site/src/**/*.test.ts", "scripts/**/*.test.mjs"],
    setupFiles: ["./test-setup.ts"],
  },
});
