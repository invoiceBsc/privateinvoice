import fs from "node:fs";
import crypto from "node:crypto";
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const password = crypto.randomBytes(24).toString("hex");
try {
  await db.$executeRawUnsafe(
    "ALTER ROLE invoice WITH PASSWORD '" + password + "'",
  );
  const env = fs.readFileSync(".env", "utf8");
  const url = new URL(process.env.DATABASE_URL);
  url.password = password;
  fs.writeFileSync(
    ".env",
    env.replace(/^DATABASE_URL=.*$/m, "DATABASE_URL=" + url.toString()),
    { mode: 0o600 },
  );
  fs.writeFileSync("data/db-password", password, { mode: 0o600 });
  console.log("Invoice database password rotated.");
} finally {
  await db.$disconnect();
}
