import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

// The showcase site (GitHub Pages). It imports the kit from ../src through
// the @kit alias, so it always shows the pieces as they are on this commit.
const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as { version: string };

export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  // Pages serves the site under /wp-kit/; a relative base works there and locally.
  base: "./",
  plugins: [vue()],
  define: { __KIT_VERSION__: JSON.stringify(pkg.version) },
  resolve: {
    alias: { "@kit": fileURLToPath(new URL("../src", import.meta.url)) },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
