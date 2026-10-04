import type { TransactionHistoryItem } from "@railgun-community/shared-models";
export interface ExpectedShield {
  chainId: 56;
  txHash: string;
  tokenAddress: string;
  netAmountAtomic: string;
}
export type MatchResult =
  | { status: "matched"; txHash: string; amountAtomic: string }
  | { status: "unmatched" | "amount-mismatch" | "ambiguous" };
const normalizedHash = (hash: string) =>
  "0x" + hash.toLowerCase().replace(/^0x/, "").padStart(64, "0");
/** Only a merchant-local decrypted history is evidence of receipt. Backend verification remains required. */
export function matchIncomingShield(
  history: readonly TransactionHistoryItem[],
  expected: ExpectedShield,
): MatchResult {
  const matching = history.filter(
    (h) => normalizedHash(h.txid) === normalizedHash(expected.txHash),
  );
  if (matching.length > 1) return { status: "ambiguous" };
  if (!matching.length) return { status: "unmatched" };
  const amounts = matching[0].receiveERC20Amounts.filter(
    (a) => a.tokenAddress.toLowerCase() === expected.tokenAddress.toLowerCase(),
  );
  if (!amounts.length) return { status: "unmatched" };
  if (amounts.length > 1) return { status: "ambiguous" };
  const amount = BigInt(amounts[0].amount);
  if (amount !== BigInt(expected.netAmountAtomic))
    return { status: "amount-mismatch" };
  return {
    status: "matched",
    txHash: normalizedHash(matching[0].txid),
    amountAtomic: amount.toString(),
  };
}
