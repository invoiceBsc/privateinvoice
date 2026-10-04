import { TARGET } from "./tests/e2e/target";
import { defineConfig } from "@playwright/test";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
const fonts = resolve("data/fonts/fonts.conf");
export default defineConfig({
  testDir: "tests/e2e",
  workers: 1,
  use: {
    baseURL: TARGET,
    headless: true,
    launchOptions: existsSync(fonts)
      ? { env: { ...process.env, FONTCONFIG_FILE: fonts } }
      : {},
  },
  reporter: "list",
});
