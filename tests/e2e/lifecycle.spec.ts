import { test, expect } from "@playwright/test";
import { TARGET, targetDb } from "./target";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
test("invoice cancellation, expiry and public slug boundaries", async ({
  request,
}) => {
  const origin = TARGET,
    headers = { Origin: origin };
  const account = privateKeyToAccount(generatePrivateKey());
  const challenge = await (
    await request.post("/api/auth/nonce", {
      headers,
      data: { address: account.address },
    })
  ).json();
  await request.post("/api/auth/verify", {
    headers,
    data: {
      nonce: challenge.nonce,
      address: account.address,
      signature: await account.signMessage({ message: challenge.message }),
    },
  });
  await request.post("/api/merchant", {
    headers,
    data: {
      displayName: "Lifecycle Studio",
      railgunAddress: "mock-0zk-" + crypto.randomUUID(),
    },
  });
  const input = {
    amount: "20.000000000000000001",
    tokenSymbol: "USDC",
    description: "Precision test",
  };
  const invoice = await (
    await request.post("/api/invoices", { headers, data: input })
  ).json();
  expect(invoice.amountAtomic).toBe("20000000000000000001");
  expect(
    (
      await request.patch("/api/invoices/" + invoice.id, {
        headers,
        data: { status: "PAID" },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.patch("/api/invoices/" + invoice.id, {
        headers,
        data: { status: "CANCELLED" },
      })
    ).status(),
  ).toBe(200);
  expect(
    (
      await request.patch("/api/invoices/" + invoice.id, {
        headers,
        data: { status: "CANCELLED" },
      })
    ).status(),
  ).toBe(409);
  const expiring = await (
    await request.post("/api/invoices", { headers, data: input })
  ).json();
  const db = targetDb();
  await db.invoice.update({
    where: { id: expiring.id },
    data: { expiresAt: new Date(Date.now() - 1000) },
  });
  const publicData = await (
    await request.get("/api/public/invoices/" + expiring.publicSlug)
  ).json();
  expect(publicData.status).toBe("EXPIRED");
  expect(
    (await request.get("/api/public/invoices/" + "a".repeat(32))).status(),
  ).toBe(404);
  expect(
    (await request.get("/api/public/invoices/sequential-1")).status(),
  ).toBe(400);
  await db.$disconnect();
});
