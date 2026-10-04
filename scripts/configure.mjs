import fs from "node:fs";
import crypto from "node:crypto";
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
pkg.private = true;
pkg.name = "private-invoice";
pkg.scripts = {
  dev: "next dev --hostname 127.0.0.1 --port 3100",
  start: "next start --hostname 0.0.0.0 --port 3100",
  build: "next build --webpack",
  lint: "eslint .",
  typecheck: "tsc --noEmit",
  test: "vitest run",
  "test:e2e": "playwright test",
  "db:generate": "prisma generate",
  "db:migrate": "prisma migrate deploy",
  format: "prettier --write src prisma docs tests",
};
fs.writeFileSync("package.json", JSON.stringify(pkg, null, 2) + "\n");
if (!fs.existsSync(".env")) {
  const password = crypto.randomBytes(24).toString("hex");
  const secret = crypto.randomBytes(32).toString("hex");
  const signing = crypto.randomBytes(32).toString("hex");
  fs.writeFileSync(
    ".env",
    `DATABASE_URL=postgresql://invoice:${password}@127.0.0.1:55432/invoice\nNEXT_PUBLIC_BNB_CHAIN_ID=56\nNEXT_PUBLIC_BNB_RPC_URL=https://bsc-dataseed.bnbchain.org\nSESSION_SECRET=${secret}\nRECEIPT_SIGNING_KEY=${signing}\nPRIVACY_PROVIDER=mock\nNEXT_PUBLIC_PRIVACY_PROVIDER=mock\nAPP_ORIGIN=http://localhost:3100\nNEXT_TELEMETRY_DISABLED=1\n`,
    { mode: 0o600 },
  );
  fs.mkdirSync("data", { recursive: true });
  fs.writeFileSync("data/db-password", password, { mode: 0o600 });
}
