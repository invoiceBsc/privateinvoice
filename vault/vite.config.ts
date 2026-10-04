// Bundles the in-browser RAILGUN vault worker into public/vault (served same-origin).
// Build: NODE_OPTIONS=--max-old-space-size=3072 npx vite build --config vault/vite.config.ts
import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import path from "node:path";

export default defineConfig({
  root: __dirname,
  base: "/vault/",
  plugins: [nodePolyfills({ protocolImports: true })],
  build: {
    outDir: path.resolve(__dirname, "../public/vault"),
    emptyOutDir: true,
    manifest: "manifest.json",
    target: "es2022",
    rollupOptions: {
      input: { worker: path.resolve(__dirname, "worker.ts") },
      output: {
        format: "es",
        entryFileNames: "vault-worker-[hash].js",
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
        inlineDynamicImports: true,
      },
    },
  },
  define: { "process.env.NODE_ENV": '"production"' },
});
