import { RailgunWalletBalanceBucket } from "@railgun-community/shared-models";
import type { BalanceState } from "../types";
/** Spent notes are excluded, never counted as a balance. */
export function mapBalanceBucket(
  bucket: RailgunWalletBalanceBucket,
): BalanceState | null {
  switch (bucket) {
    case RailgunWalletBalanceBucket.Spendable:
      return "spendable";
    case RailgunWalletBalanceBucket.ShieldPending:
    case RailgunWalletBalanceBucket.ProofSubmitted:
      return "pending";
    case RailgunWalletBalanceBucket.ShieldBlocked:
    case RailgunWalletBalanceBucket.MissingInternalPOI:
    case RailgunWalletBalanceBucket.MissingExternalPOI:
      return "blocked";
    case RailgunWalletBalanceBucket.Spent:
      return null;
  }
}
