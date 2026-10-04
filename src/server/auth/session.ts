import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { sessionHash, randomToken } from "@/lib/crypto";
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function currentUser() {
  const token = (await cookies()).get("invoice_session")?.value;
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { id: sessionHash(token) },
    include: { user: { include: { merchant: true } } },
  });
  return session && session.expiresAt > new Date() ? session.user : null;
}
export async function requireUser() {
  const user = await currentUser();
  if (!user) throw new ApiError(401, "Please sign in");
  return user;
}
export async function requireMerchant() {
  const user = await requireUser();
  if (!user.merchant)
    throw new ApiError(409, "Set up your merchant account first");
  return user.merchant;
}
export async function createSession(userId: string) {
  const token = randomToken();
  await db.session.create({
    data: {
      id: sessionHash(token),
      userId,
      expiresAt: new Date(Date.now() + 86400000),
    },
  });
  (await cookies()).set("invoice_session", token, {
    httpOnly: true,
    secure: process.env.APP_ORIGIN?.startsWith("https://") ?? false,
    sameSite: "lax",
    path: "/",
    maxAge: 86400,
  });
}
export async function guardRequest(req: Request) {
  if (req.method !== "GET") {
    const origin = req.headers.get("origin");
    const expected = process.env.APP_ORIGIN;
    if (!expected || origin !== expected)
      throw new ApiError(403, "Request origin denied");
    if (!req.headers.get("content-type")?.startsWith("application/json"))
      throw new ApiError(415, "JSON required");
  }
  // No untrusted X-Forwarded-For: conservatively rate limit the application until a trusted proxy is configured.
  const bucket = Math.floor(Date.now() / 60000);
  const key = "api:" + bucket;
  const row = await db.rateLimit.upsert({
    where: { id: key },
    create: { id: key, resetAt: new Date((bucket + 1) * 60000) },
    update: { count: { increment: 1 } },
  });
  if (row.count > 600)
    throw new ApiError(429, "Too many requests. Please wait a minute.");
  if (row.count === 1)
    await db.rateLimit.deleteMany({ where: { resetAt: { lt: new Date() } } });
}
