import { it, expect } from "vitest";
import { MockPrivacyProvider } from "@/privacy/mock/MockPrivacyProvider";
import { RailgunPrivacyProvider } from "@/privacy/railgun/RailgunPrivacyProvider";
it("mock payments are idempotent and balance states stay separate", async () => {
  const p = new MockPrivacyProvider();
  await p.initialize();
  const wallet = await p.createPrivateWallet({
    mnemonic: "mock",
    password: "mock",
  });
  expect(wallet.address.startsWith("mock-0zk-")).toBe(true);
  const prepared = await p.preparePublicToPrivatePayment({
    reference: "invoice-ref",
    recipient: wallet.address,
    chainId: 56,
    tokenAddress: "0x" + "1".repeat(40),
    amountAtomic: "123",
  });
  const a = await p.submitPublicToPrivatePayment({ prepared });
  const b = await p.submitPublicToPrivatePayment({ prepared });
  expect(a.txHash).toBe(b.txHash);
  p.recordIncoming({
    noteId: "note-1",
    txHash: a.txHash,
    tokenAddress: "0x" + "1".repeat(40),
    amountAtomic: "123",
    chainId: 56,
    state: "pending",
  });
  expect((await p.getBalances())[0].state).toBe("pending");
  await expect(
    p.withdraw({
      destination: "0x" + "2".repeat(40),
      tokenAddress: "0x" + "1".repeat(40),
      amountAtomic: "1",
    }),
  ).rejects.toThrow("Insufficient");
});
it("railgun provider fails closed and never fabricates a payment", async () => {
  const p = new RailgunPrivacyProvider();
  await expect(p.initialize()).rejects.toThrow("disabled");
  await expect(p.getBalances()).rejects.toThrow("disabled");
});
