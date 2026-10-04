import { it, expect } from "vitest";
import {
  RailgunWalletBalanceBucket as Bucket,
  TransactionHistoryItemCategory as Category,
  TXIDVersion,
  type TransactionHistoryItem,
} from "@railgun-community/shared-models";
import { mapBalanceBucket } from "@/privacy/railgun/balances";
import { matchIncomingShield } from "@/privacy/railgun/reconciliation";
const txHash = "0x" + "a".repeat(64),
  token = "0x" + "1".repeat(40);
const expected = {
  chainId: 56 as const,
  txHash,
  tokenAddress: token,
  netAmountAtomic: "5000",
};
const item: TransactionHistoryItem = {
  txid: txHash,
  txidVersion: TXIDVersion.V2_PoseidonMerkle,
  version: 1,
  timestamp: undefined,
  blockNumber: 1,
  category: Category.ShieldERC20s,
  receiveERC20Amounts: [
    {
      tokenAddress: token,
      amount: 5000n,
      senderAddress: undefined,
      memoText: undefined,
      shieldFee: "12",
      hasValidPOIForActiveLists: false,
      balanceBucket: Bucket.ShieldPending,
    },
  ],
  transferERC20Amounts: [],
  changeERC20Amounts: [],
  unshieldERC20Amounts: [],
  receiveNFTAmounts: [],
  transferNFTAmounts: [],
  unshieldNFTAmounts: [],
};
it("matches by originating tx, token and net amount despite pending POI", () =>
  expect(matchIncomingShield([item], expected).status).toBe("matched"));
it("requires review on wrong amount, token, unknown tx and ambiguous notes", () => {
  expect(
    matchIncomingShield([item], { ...expected, netAmountAtomic: "5001" })
      .status,
  ).toBe("amount-mismatch");
  expect(
    matchIncomingShield([item], {
      ...expected,
      tokenAddress: "0x" + "2".repeat(40),
    }).status,
  ).toBe("unmatched");
  expect(
    matchIncomingShield([item], { ...expected, txHash: "0x" + "b".repeat(64) })
      .status,
  ).toBe("unmatched");
  expect(matchIncomingShield([item, item], expected).status).toBe("ambiguous");
  expect(
    matchIncomingShield(
      [
        {
          ...item,
          receiveERC20Amounts: [
            ...item.receiveERC20Amounts,
            ...item.receiveERC20Amounts,
          ],
        },
      ],
      expected,
    ).status,
  ).toBe("ambiguous");
});
it("maps all SDK buckets explicitly", () => {
  expect(mapBalanceBucket(Bucket.Spendable)).toBe("spendable");
  expect(mapBalanceBucket(Bucket.ShieldPending)).toBe("pending");
  expect(mapBalanceBucket(Bucket.ProofSubmitted)).toBe("pending");
  for (const bucket of [
    Bucket.ShieldBlocked,
    Bucket.MissingInternalPOI,
    Bucket.MissingExternalPOI,
  ])
    expect(mapBalanceBucket(bucket)).toBe("blocked");
  expect(mapBalanceBucket(Bucket.Spent)).toBeNull();
});
