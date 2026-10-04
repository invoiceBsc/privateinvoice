import { PrismaClient } from "@prisma/client";
const globalDb = globalThis as unknown as { invoiceDb?: PrismaClient };
export const db = globalDb.invoiceDb ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalDb.invoiceDb = db;
