import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import path from "node:path";
export default defineConfig({
  root: path.resolve(__dirname),
  base: "/railgun-spike/",
  plugins: [nodePolyfills({ protocolImports: true })],
  worker: {
    format: "iife",
    plugins: () => [nodePolyfills({ protocolImports: true })],
  },
  build: {
    outDir: path.resolve(__dirname, "../public/railgun-spike"),
    emptyOutDir: true,
    minify: false,
  },
  define: { "process.env.NODE_ENV": '"production"' },
});
