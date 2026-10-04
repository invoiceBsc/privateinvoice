import {
  populateShield,
  gasEstimateForShield,
} from "@railgun-community/wallet";
import {
  NetworkName,
  TXIDVersion,
  type RailgunERC20AmountRecipient,
  type TransactionGasDetails,
} from "@railgun-community/shared-models";
/** Research-only helpers; no signing or broadcasting. Call in a configured browser Worker. */
export function constructBnbShield(
  shieldPrivateKey: string,
  recipients: RailgunERC20AmountRecipient[],
  gasDetails?: TransactionGasDetails,
) {
  return populateShield(
    TXIDVersion.V2_PoseidonMerkle,
    NetworkName.BNBChain,
    shieldPrivateKey,
    recipients,
    [],
    gasDetails,
  );
}
export function estimateBnbShield(
  shieldPrivateKey: string,
  recipients: RailgunERC20AmountRecipient[],
  payerAddress: string,
) {
  return gasEstimateForShield(
    TXIDVersion.V2_PoseidonMerkle,
    NetworkName.BNBChain,
    shieldPrivateKey,
    recipients,
    [],
    payerAddress,
  );
}
