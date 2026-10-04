import { describe, it, expect } from "vitest";
import { canTransition, isExpired } from "@/server/invoices/state";
import { invoiceInput, attemptInput, withdrawalInput } from "@/lib/validation";
import { canonical, hash } from "@/lib/crypto";
import { amountDisplay } from "@/lib/client";
import { TOKENS } from "@/config/tokens";
describe("invoice state machine", () => {
  it("protects paid invoices", () => {
    for (const state of [
      "DRAFT",
      "PENDING",
      "PAYMENT_SUBMITTED",
      "CONFIRMING",
      "EXPIRED",
      "CANCELLED",
      "FAILED",
      "PAID",
    ] as const)
      expect(canTransition("PAID", state)).toBe(false);
  });
  it("requires confirmation before paid", () => {
    expect(canTransition("PENDING", "PAID")).toBe(false);
    expect(canTransition("PAYMENT_SUBMITTED", "PAID")).toBe(false);
    expect(canTransition("CONFIRMING", "PAID")).toBe(true);
  });
  it("handles expiry boundaries", () => {
    const now = new Date("2026-10-03");
    expect(isExpired(now, now)).toBe(true);
    expect(isExpired(new Date(now.getTime() + 1), now)).toBe(false);
  });
});
describe("boundary validation", () => {
  it("rejects zero, negative and floating-point amounts", () => {
    for (const amount of ["0", "0.00", "-1", "1e9", "1.0000000000000000001"])
      expect(
        invoiceInput.safeParse({
          amount,
          tokenSymbol: "USDT",
          description: "Work",
        }).success,
      ).toBe(false);
    expect(
      invoiceInput.safeParse({
        amount: "5000",
        tokenSymbol: "USDT",
        description: "Work",
      }).success,
    ).toBe(true);
  });
  it("rejects wrong chain and extra credential fields", () => {
    const input = {
      chainId: 56,
      payerAddress: "0x" + "1".repeat(40),
      tokenAddress: TOKENS.USDT.address,
      amountAtomic: "1",
    };
    expect(attemptInput.safeParse({ ...input, chainId: 1 }).success).toBe(
      false,
    );
    expect(
      attemptInput.safeParse({ ...input, mnemonic: "secret" }).success,
    ).toBe(false);
  });
  it("validates withdrawal destination", () => {
    expect(
      withdrawalInput.safeParse({
        tokenSymbol: "USDC",
        amount: "1",
        destination: "broken",
      }).success,
    ).toBe(false);
  });
});
describe("integer amounts and receipt canonicalization", () => {
  it("never rounds large balances", () =>
    expect(amountDisplay("900719925474099312345678901234567890")).toBe(
      "900,719,925,474,099,312.34567890123456789",
    ));
  it("orders keys deterministically", () =>
    expect(hash(canonical({ z: 1, a: { b: 2, a: 1 } }))).toBe(
      hash(canonical({ a: { a: 1, b: 2 }, z: 1 })),
    ));
});
