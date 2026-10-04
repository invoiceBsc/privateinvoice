import { createPublicKey, verify } from "node:crypto";
import { TARGET, targetDb } from "./target";
import { test, expect } from "@playwright/test";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
import { TOKENS } from "../../src/config/tokens";
test("wallet auth, ownership, exact mock payment, reconciliation and receipt", async ({
  request,
  page,
}) => {
  const account = privateKeyToAccount(generatePrivateKey());
  const origin = TARGET;
  const headers = { Origin: origin };
  const nonce = await (
    await request.post("/api/auth/nonce", {
      headers,
      data: { address: account.address },
    })
  ).json();
  const signature = await account.signMessage({ message: nonce.message });
  const verified = await request.post("/api/auth/verify", {
    headers,
    data: { nonce: nonce.nonce, address: account.address, signature },
  });
  expect(verified.status()).toBe(200);
  const replay = await request.post("/api/auth/verify", {
    headers,
    data: { nonce: nonce.nonce, address: account.address, signature },
  });
  expect(replay.status()).toBe(401);
  expect(
    (
      await request.post("/api/merchant", {
        headers,
        data: {
          displayName: "E2E Studio",
          railgunAddress: "mock-0zk-" + crypto.randomUUID(),
        },
      })
    ).status(),
  ).toBe(200);
  const invoice = await (
    await request.post("/api/invoices", {
      headers,
      data: {
        amount: "5000",
        tokenSymbol: "USDT",
        description: "Website development",
        customerLabel: "ACME",
        expiresInDays: 7,
      },
    })
  ).json();
  expect(invoice.amountAtomic).toBe("5000000000000000000000");
  const publicData = await (
    await request.get("/api/public/invoices/" + invoice.publicSlug)
  ).json();
  expect(publicData).not.toHaveProperty("merchantId");
  expect(publicData).not.toHaveProperty("railgunAddress");
  expect(publicData).not.toHaveProperty("customerLabel");
  expect(JSON.stringify(publicData)).not.toContain(
    account.address.toLowerCase(),
  );
  await page.goto("/i/" + invoice.publicSlug);
  await expect(
    page.getByRole("heading", { name: "Website development" }),
  ).toBeVisible();
  await expect(
    page.getByText("5,000.00", { exact: false }).first(),
  ).toBeVisible();
  await expect(
    page.getByText("Mock checkout:", { exact: false }),
  ).toBeVisible();
  const paymentData = {
    payerAddress: account.address,
    chainId: 56,
    tokenAddress: TOKENS.USDT.address,
    amountAtomic: invoice.amountAtomic,
  };
  expect(
    (
      await request.post("/api/invoices/" + invoice.id + "/payment-attempt", {
        headers,
        data: { ...paymentData, chainId: 1 },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.post("/api/invoices/" + invoice.id + "/payment-attempt", {
        headers,
        data: { ...paymentData, amountAtomic: "1" },
      })
    ).status(),
  ).toBe(400);
  const attempt = await (
    await request.post("/api/invoices/" + invoice.id + "/payment-attempt", {
      headers,
      data: paymentData,
    })
  ).json();
  const txHash = "0x" + crypto.randomUUID().replaceAll("-", "").repeat(2);
  const submitted = { capability: attempt.capability, txHash, chainId: 56 };
  expect(
    (
      await request.post("/api/payments/" + attempt.id + "/submitted", {
        headers,
        data: submitted,
      })
    ).status(),
  ).toBe(200);
  expect(
    (
      await request.post("/api/payments/" + attempt.id + "/submitted", {
        headers,
        data: submitted,
      })
    ).status(),
  ).toBe(200);
  const premature = await request.post(
    "/api/payments/" + attempt.id + "/reconcile",
    {
      headers,
      data: {
        noteId: attempt.reference,
        txHash,
        chainId: 56,
        tokenAddress: TOKENS.USDT.address,
        amountAtomic: invoice.amountAtomic,
      },
    },
  );
  expect(premature.status()).toBe(409);
  await request.post("/api/mock/scan", { headers, data: {} });
  expect(
    (await request.get("/api/public/invoices/" + invoice.publicSlug)).status(),
  ).toBe(200);
  const match = {
    noteId: attempt.reference,
    txHash,
    chainId: 56,
    tokenAddress: TOKENS.USDT.address,
    amountAtomic: invoice.amountAtomic,
  };
  expect(
    (
      await request.post("/api/payments/" + attempt.id + "/reconcile", {
        headers,
        data: { ...match, amountAtomic: "1" },
      })
    ).status(),
  ).toBe(409);
  const receipt = await (
    await request.post("/api/payments/" + attempt.id + "/reconcile", {
      headers,
      data: match,
    })
  ).json();
  expect(receipt.id).toBeTruthy();
  const signed = await (
    await request.get("/api/receipts/" + receipt.id)
  ).json();
  expect(
    verify(
      null,
      Buffer.from(signed.payloadHash, "hex"),
      createPublicKey(signed.publicKey),
      Buffer.from(signed.signature, "base64"),
    ),
  ).toBe(true);
  const duplicate = await (
    await request.post("/api/payments/" + attempt.id + "/reconcile", {
      headers,
      data: match,
    })
  ).json();
  expect(duplicate.id).toBe(receipt.id);
  expect(
    (
      await request.patch("/api/invoices/" + invoice.id, {
        headers,
        data: { status: "CANCELLED" },
      })
    ).status(),
  ).toBe(409);
  await page.goto("/receipt/" + receipt.id);
  await expect(
    page.getByText("Payment receipt", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Simulated payment receipt.", { exact: false }),
  ).toBeVisible();
  expect(
    (
      await request.post("/api/mock/withdraw", {
        headers,
        data: {
          tokenSymbol: "USDT",
          amount: "1",
          destination: account.address,
        },
      })
    ).status(),
  ).toBe(409);
  await request.post("/api/mock/spendability", { headers, data: {} });
  expect(
    (
      await request.post("/api/mock/withdraw", {
        headers,
        data: {
          tokenSymbol: "USDT",
          amount: "1000",
          destination: account.address,
        },
      })
    ).status(),
  ).toBe(200);
  const balances = await (await request.get("/api/mock/balances")).json();
  expect(
    balances.find((b: { tokenSymbol: string }) => b.tokenSymbol === "USDT")
      .spendable,
  ).toBe("4000000000000000000000");
  expect(
    (
      await request.post("/api/mock/withdraw", {
        headers,
        data: {
          tokenSymbol: "USDT",
          amount: "5000",
          destination: account.address,
        },
      })
    ).status(),
  ).toBe(409);
  await request.post("/api/auth/logout", { headers, data: {} });
  expect((await request.get("/api/invoices/" + invoice.id)).status()).toBe(401);
  const wrong = privateKeyToAccount(generatePrivateKey());
  const wrongNonce = await (
    await request.post("/api/auth/nonce", {
      headers,
      data: { address: wrong.address },
    })
  ).json();
  expect(
    (
      await request.post("/api/auth/verify", {
        headers,
        data: {
          nonce: wrongNonce.nonce,
          address: wrong.address,
          signature: await account.signMessage({ message: wrongNonce.message }),
        },
      })
    ).status(),
  ).toBe(401);
  expect(
    (
      await request.post("/api/auth/verify", {
        headers,
        data: {
          nonce: wrongNonce.nonce,
          address: wrong.address,
          signature: await wrong.signMessage({ message: wrongNonce.message }),
        },
      })
    ).status(),
  ).toBe(200);
  await request.post("/api/merchant", {
    headers,
    data: {
      displayName: "Other Merchant",
      railgunAddress: "mock-0zk-" + crypto.randomUUID(),
    },
  });
  expect((await request.get("/api/invoices/" + invoice.id)).status()).toBe(404);
  expect(
    (
      await request.post("/api/payments/" + attempt.id + "/reconcile", {
        headers,
        data: match,
      })
    ).status(),
  ).toBe(404);
  const db = targetDb();
  const challenge = await (
    await request.post("/api/auth/nonce", {
      headers,
      data: { address: wrong.address },
    })
  ).json();
  await db.authNonce.update({
    where: { id: challenge.nonce },
    data: { expiresAt: new Date(Date.now() - 1000) },
  });
  expect(
    (
      await request.post("/api/auth/verify", {
        headers,
        data: {
          nonce: challenge.nonce,
          address: wrong.address,
          signature: await wrong.signMessage({ message: challenge.message }),
        },
      })
    ).status(),
  ).toBe(401);
  await db.$disconnect();
});
test("origin enforcement and unauthenticated boundaries", async ({
  request,
  page,
}) => {
  expect(
    (
      await request.post("/api/auth/nonce", {
        headers: { Origin: "https://attacker.invalid" },
        data: { address: "0x" + "1".repeat(40) },
      })
    ).status(),
  ).toBe(403);
  expect((await request.get("/api/invoices")).status()).toBe(401);
  await page.goto("/");
  await expect(
    page.getByRole("link", { name: "Start getting paid" }).first(),
  ).toBeVisible();
  await page.goto("/privacy-model");
  await expect(
    page.getByRole("heading", { name: "Privacy model" }),
  ).toBeVisible();
});
