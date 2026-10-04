import { PrismaClient } from "@prisma/client";

/**
 * The UI regression suite runs against the internal mock instance (scripts/mock-app.sh), not the
 * live site. Override with TEST_BASE_URL / TEST_DATABASE_URL to point it elsewhere.
 */
export const TARGET = process.env.TEST_BASE_URL ?? "http://127.0.0.1:3103";

/** Prisma client for the target instance's data (the mock instance uses the default schema). */
export function targetDb() {
  const url =
    process.env.TEST_DATABASE_URL ??
    (process.env.DATABASE_URL ?? "").replace(/\?.*$/, "");
  return new PrismaClient({ datasources: { db: { url } } });
}
