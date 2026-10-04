import { it, expect } from "vitest";
import type { PublicClient } from "viem";
import { createPublicKey, verify } from "node:crypto";
import { validateChainEvidence } from "@/server/payments/chain-evidence";
import { signReceipt, canonical, hash } from "@/lib/crypto";
const txHash = ("0x" + "a".repeat(64)) as `0x${string}`,
  proxy = "0x" + "1".repeat(40),
  payer = "0x" + "2".repeat(40);
function client(overrides: Record<string, unknown> = {}) {
  return {
    getChainId: async () => 56,
    getTransactionReceipt: async () => ({
      status: "success",
      blockNumber: 100n,
      blockHash: txHash,
    }),
    getTransaction: async () => ({ chainId: 56, to: proxy, from: payer }),
    getBlockNumber: async () => 111n,
    getBlock: async () => ({ hash: txHash }),
    ...overrides,
  } as unknown as PublicClient;
}
it("requires successful canonical transactions with twelve confirmations", async () => {
  const input = { txHash, proxyAddress: proxy, payerAddress: payer };
  await expect(validateChainEvidence(client(), input)).resolves.toEqual({
    blockNumber: "100",
    blockHash: txHash,
  });
  await expect(
    validateChainEvidence(client({ getChainId: async () => 1 }), input),
  ).rejects.toThrow("Wrong chain");
  await expect(
    validateChainEvidence(client({ getBlockNumber: async () => 110n }), input),
  ).rejects.toThrow("pending");
  await expect(
    validateChainEvidence(
      client({ getBlock: async () => ({ hash: "0x" + "b".repeat(64) }) }),
      input,
    ),
  ).rejects.toThrow("reorganized");
  await expect(
    validateChainEvidence(
      client({ getTransactionReceipt: async () => ({ status: "reverted" }) }),
      input,
    ),
  ).rejects.toThrow("reverted");
  await expect(
    validateChainEvidence(
      client({
        getTransaction: async () => ({ chainId: 56, to: payer, from: proxy }),
      }),
      input,
    ),
  ).rejects.toThrow("context");
});
it("receipts are independently verifiable and tamper evident", () => {
  process.env.RECEIPT_SIGNING_KEY = "1".repeat(64);
  const payload = { version: 1, amountAtomic: "5000", status: "PAID" };
  const signed = signReceipt(payload);
  expect(
    verify(
      null,
      Buffer.from(signed.payloadHash, "hex"),
      createPublicKey(signed.publicKey),
      Buffer.from(signed.signature, "base64"),
    ),
  ).toBe(true);
  expect(
    verify(
      null,
      Buffer.from(hash(canonical({ ...payload, amountAtomic: "5001" })), "hex"),
      createPublicKey(signed.publicKey),
      Buffer.from(signed.signature, "base64"),
    ),
  ).toBe(false);
});
