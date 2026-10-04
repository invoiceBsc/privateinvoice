# Installed Wallet SDK 11.2.0 declarations\n\n## services/railgun/core/init.d.ts\n\n```ts\nimport type { AbstractLevelDOWN } from 'abstract-leveldown';

import { POIList, POIListType, POIMerklerootsValidator } from '@railgun-community/engine';
import { MerkletreeScanUpdateEvent, type Chain } from '@railgun-community/shared-models';
import { ArtifactStore } from '../../artifacts/artifact-store';
import { type BatchListUpdateEvent } from '../../poi/wallet-poi-node-interface';
export { type BatchListUpdateEvent } from '../../poi/wallet-poi-node-interface';
export type EngineDebugger = {
log: (msg: string) => void;
error: (error: Error) => void;
verboseScanLogging: boolean;
};
export declare const setOnUTXOMerkletreeScanCallback: (onUTXOMerkletreeScanCallback: (scanData: MerkletreeScanUpdateEvent) => void) => void;
export declare const setOnTXIDMerkletreeScanCallback: (onTXIDMerkletreeScanCallback: (scanData: MerkletreeScanUpdateEvent) => void) => void;
export declare const setBatchListCallback: (onBatchListCallback: (callbackData: BatchListUpdateEvent) => void) => void;
export declare const pausePPOIBatchingForChain: (chain: Chain) => void;
export declare const resumePPOIBatching: (chain: Chain) => void;
/** *

- @param walletSource - Name for your wallet implementation. Encrypted and viewable in private transaction history. Maximum of 16 characters, lowercase.
- @param db - LevelDOWN compatible database for storing encrypted wallets.
- @param shouldDebug - Whether to forward Engine debug logs to Logger.
- @param artifactStore - Persistent store for downloading large artifact files. See Wallet SDK Developer Guide for platform implementations.
- @param useNativeArtifacts - Whether to download native C++ or web-assembly artifacts. TRUE for mobile. FALSE for nodejs and browser.
- @param skipMerkletreeScans - Whether to skip merkletree syncs and private balance scans. Only set to TRUE in shield-only applications that don't load private wallets or balances.
- @param poiNodeURLs - List of POI aggregator node URLs, in order of priority.
- @param customPOILists - POI lists to use for additional wallet protections after default lists.
- @returns
  _/
  export declare const startRailgunEngine: (walletSource: string, db: AbstractLevelDOWN, shouldDebug: boolean, artifactStore: ArtifactStore, useNativeArtifacts: boolean, skipMerkletreeScans: boolean, poiNodeURLs?: string[], customPOILists?: POIList[], verboseScanLogging?: boolean) => Promise<void>;
  export declare const startRailgunEngineForPOINode: (db: AbstractLevelDOWN, shouldDebug: boolean, artifactStore: ArtifactStore, validatePOIMerkleroots: POIMerklerootsValidator) => Promise<void>;
  export declare const stopRailgunEngine: () => Promise<void>;
  export { POIList, POIListType };
  `\n\n## services/railgun/core/prover.d.ts\n\n`ts\nimport { FormattedCircuitInputsRailgun, SnarkJSGroth16, Proof, Prover } from '@railgun-community/engine';
  export declare const getProver: () => Prover;
  export { FormattedCircuitInputsRailgun, Proof, SnarkJSGroth16 };
  `\n\n## services/railgun/core/load-provider.d.ts\n\n`ts\nimport { FallbackProviderJsonConfig, LoadProviderResponse, NetworkName } from '@railgun-community/shared-models';
  /_*
- Note: The first provider listed in your fallback provider config is used as a polling provider
- for new RAILGUN events (balance updates).
  */
  export declare const loadProvider: (fallbackProviderJsonConfig: FallbackProviderJsonConfig, networkName: NetworkName, pollingInterval?: number) => Promise<LoadProviderResponse>;
  export declare const unloadProvider: (networkName: NetworkName) => Promise<void>;
  export declare const pauseAllPollingProviders: (excludeNetworkName?: NetworkName) => void;
  export declare const resumeIsolatedPollingProviderForNetwork: (networkName: NetworkName) => void;
  `\n\n## services/railgun/wallets/wallets.d.ts\n\n`ts\nimport { Authorization } from 'ethers';
  import { RailgunWallet, AbstractWallet, AddressData, TransactionStructV2, TransactionStructV3, RelayAdapt7702, RelayAdapt7702ExecutionDetails } from '@railgun-community/engine';
  import { RailgunWalletInfo, NetworkName, Chain } from '@railgun-community/shared-models';
  export declare const awaitWalletScan: (walletID: string, chain: Chain) => Promise<unknown>;
  export declare const awaitMultipleWalletScans: (walletID: string, chain: Chain, numScans: number) => Promise<void>;
  export declare const walletForID: (id: string) => AbstractWallet;
  export declare const fullWalletForID: (id: string) => RailgunWallet;
  export declare const viewOnlyWalletForID: (id: string) => RailgunWallet;
  export declare const createRailgunWallet: (encryptionKey: string, mnemonic: string, creationBlockNumbers: Optional<MapType<number>>, railgunWalletDerivationIndex?: number, mnemonicPassword?: string) => Promise<RailgunWalletInfo>;
  export declare const createViewOnlyRailgunWallet: (encryptionKey: string, shareableViewingKey: string, creationBlockNumbers: Optional<MapType<number>>) => Promise<RailgunWalletInfo>;
  export declare const loadWalletByID: (encryptionKey: string, railgunWalletID: string, isViewOnlyWallet: boolean, mnemonicPassword?: string) => Promise<RailgunWalletInfo>;
  export declare const unloadWalletByID: (railgunWalletID: string) => void;
  export declare const deleteWalletByID: (railgunWalletID: string) => Promise<void>;
  export declare const getWalletMnemonic: (encryptionKey: string, railgunWalletID: string) => Promise<string>;
  export declare const getRailgunWalletAddressData: (address: string) => AddressData;
  export declare const getRailgunWalletPrivateViewingKey: (railgunWalletID: string) => Uint8Array;
  export declare const signWithWalletViewingKey: (railgunWalletID: string, message: string) => Promise<string>;
  export declare const assertValidRailgunAddress: (address: string) => void;
  export declare const validateRailgunAddress: (address: string) => boolean;
  export declare const assertValidEthAddress: (address: string) => void;
  export declare const validateEthAddress: (address: string) => boolean;
  export declare const getRailgunAddress: (railgunWalletID: string) => Optional<string>;
  export declare const getWalletShareableViewingKey: (railgunWalletID: string) => Promise<Optional<string>>;
  export declare const sign7702Request: (walletID: string, encryptionKey: string, networkName: NetworkName, contractAddress: string, chainId: bigint, transactions: (TransactionStructV2 | TransactionStructV3)[], actionData: RelayAdapt7702.ActionDataStruct, mnemonicPassword?: string) => Promise<{
  authorization: Authorization;
  signature: string;
  executionDetails: RelayAdapt7702ExecutionDetails;
  }>;
  export declare const ratchetEphemeralAddress: (walletID: string, networkName: NetworkName) => Promise<void>;
  export declare const getCurrentEphemeralAddress: (walletID: string, encryptionKey: string, networkName: NetworkName, mnemonicPassword?: string) => Promise<string>;
  export declare const getCurrentEphemeralWallet: (walletID: string, encryptionKey: string, networkName: NetworkName, mnemonicPassword?: string) => Promise<import("ethers").HDNodeWallet>;
  `\n\n## services/railgun/wallets/balances.d.ts\n\n`ts\nimport { Chain } from '@railgun-community/engine';
  export declare const refreshBalances: (chain: Chain, walletIdFilter: Optional<string[]>) => Promise<void>;
  export declare const rescanFullUTXOMerkletreesAndWallets: (chain: Chain, walletIdFilter: Optional<string[]>) => Promise<void>;
  export declare const resetFullTXIDMerkletreesV2: (chain: Chain) => Promise<void>;
  `\n\n## services/railgun/wallets/balance-update.d.ts\n\n`ts\nimport { Chain, AbstractWallet, TokenType, TokenBalances, NFTTokenData, getTokenDataHash, getTokenDataNFT, getTokenDataERC20, POIProofEventStatus } from '@railgun-community/engine';
  import { RailgunBalancesEvent, POIProofProgressEvent, RailgunNFTAmount, RailgunERC20Amount, NetworkName, TXIDVersion, NFTTokenType } from '@railgun-community/shared-models';
  export type BalancesUpdatedCallback = (balancesEvent: RailgunBalancesEvent) => void;
  export declare const setOnBalanceUpdateCallback: (callback?: BalancesUpdatedCallback) => void;
  export type POIProofProgressCallback = (poiProofProgressEvent: POIProofProgressEvent) => void;
  export declare const setOnWalletPOIProofProgressCallback: (callback?: POIProofProgressCallback) => void;
  export declare const getSerializedERC20Balances: (balances: TokenBalances) => RailgunERC20Amount[];
  export declare const getSerializedNFTBalances: (balances: TokenBalances) => RailgunNFTAmount[];
  export declare const onBalancesUpdate: (txidVersion: TXIDVersion, wallet: AbstractWallet, chain: Chain) => Promise<void>;
  export declare const onWalletPOIProofProgress: (status: POIProofEventStatus, txidVersion: TXIDVersion, wallet: AbstractWallet, chain: Chain, progress: number, listKey: string, txid: string, railgunTxid: string, index: number, totalCount: number, errMessage: Optional<string>) => void;
  export declare const balanceForERC20Token: (txidVersion: TXIDVersion, wallet: AbstractWallet, networkName: NetworkName, tokenAddress: string, onlySpendable: boolean) => Promise<bigint>;
  export declare const balanceForNFT: (txidVersion: TXIDVersion, wallet: AbstractWallet, networkName: NetworkName, nftTokenData: NFTTokenData, onlySpendable: boolean) => Promise<bigint>;
  export { getTokenDataHash, getTokenDataNFT, getTokenDataERC20, TokenType, NFTTokenType, NFTTokenData, };
  `\n\n## services/railgun/history/transaction-history.d.ts\n\n`ts\nimport { Chain } from '@railgun-community/engine';
  import { TransactionHistoryItem, TransactionHistoryItemCategory } from '@railgun-community/shared-models';
  export declare const categoryForTransactionHistoryItem: (historyItem: TransactionHistoryItem) => TransactionHistoryItemCategory;
  export declare const getWalletTransactionHistory: (chain: Chain, railgunWalletID: string, startingBlock: Optional<number>) => Promise<TransactionHistoryItem[]>;
  `\n\n## services/transactions/tx-shield.d.ts\n\n`ts\nimport { RailgunPopulateTransactionResponse, RailgunTransactionGasEstimateResponse, NetworkName, RailgunERC20AmountRecipient, RailgunNFTAmountRecipient, TransactionGasDetails, TXIDVersion } from '@railgun-community/shared-models';
  import { ContractTransaction } from 'ethers';
  export declare const getShieldPrivateKeySignatureMessage: () => string;
  export declare const generateShieldTransaction: (txidVersion: TXIDVersion, networkName: NetworkName, shieldPrivateKey: string, erc20AmountRecipients: RailgunERC20AmountRecipient[], nftAmountRecipients: RailgunNFTAmountRecipient[]) => Promise<ContractTransaction>;
  export declare const populateShield: (txidVersion: TXIDVersion, networkName: NetworkName, shieldPrivateKey: string, erc20AmountRecipients: RailgunERC20AmountRecipient[], nftAmountRecipients: RailgunNFTAmountRecipient[], gasDetails?: TransactionGasDetails) => Promise<RailgunPopulateTransactionResponse>;
  export declare const gasEstimateForShield: (txidVersion: TXIDVersion, networkName: NetworkName, shieldPrivateKey: string, erc20AmountRecipients: RailgunERC20AmountRecipient[], nftAmountRecipients: RailgunNFTAmountRecipient[], fromWalletAddress: string) => Promise<RailgunTransactionGasEstimateResponse>;
  `\n\n## services/transactions/tx-proof-transfer.d.ts\n\n`ts\nimport { NetworkName, RailgunERC20AmountRecipient, RailgunNFTAmountRecipient, TXIDVersion } from '@railgun-community/shared-models';
  import { GenerateTransactionsProgressCallback } from './tx-generator';
  export declare const generateTransferProof: (txidVersion: TXIDVersion, networkName: NetworkName, railgunWalletID: string, encryptionKey: string, showSenderAddressToRecipient: boolean, memoText: Optional<string>, erc20AmountRecipients: RailgunERC20AmountRecipient[], nftAmountRecipients: RailgunNFTAmountRecipient[], broadcasterFeeERC20AmountRecipient: Optional<RailgunERC20AmountRecipient>, sendWithPublicWallet: boolean, overallBatchMinGasPrice: Optional<bigint>, progressCallback: GenerateTransactionsProgressCallback, mnemonicPassword?: string) => Promise<void>;
  `\n\n## services/transactions/tx-transfer.d.ts\n\n`ts\nimport { RailgunPopulateTransactionResponse, RailgunTransactionGasEstimateResponse, NetworkName, FeeTokenDetails, RailgunERC20AmountRecipient, RailgunNFTAmountRecipient, TransactionGasDetails, TXIDVersion } from '@railgun-community/shared-models';
  export declare const populateProvedTransfer: (txidVersion: TXIDVersion, networkName: NetworkName, railgunWalletID: string, showSenderAddressToRecipient: boolean, memoText: Optional<string>, erc20AmountRecipients: RailgunERC20AmountRecipient[], nftAmountRecipients: RailgunNFTAmountRecipient[], broadcasterFeeERC20AmountRecipient: Optional<RailgunERC20AmountRecipient>, sendWithPublicWallet: boolean, overallBatchMinGasPrice: Optional<bigint>, gasDetails: TransactionGasDetails) => Promise<RailgunPopulateTransactionResponse>;
  export declare const gasEstimateForUnprovenTransfer: (txidVersion: TXIDVersion, networkName: NetworkName, railgunWalletID: string, encryptionKey: string, memoText: Optional<string>, erc20AmountRecipients: RailgunERC20AmountRecipient[], nftAmountRecipients: RailgunNFTAmountRecipient[], originalGasDetails: TransactionGasDetails, feeTokenDetails: Optional<FeeTokenDetails>, sendWithPublicWallet: boolean, mnemonicPassword?: string) => Promise<RailgunTransactionGasEstimateResponse>;
  `\n\n## services/transactions/tx-proof-unshield.d.ts\n\n`ts\nimport { RailgunERC20Amount, NetworkName, RailgunERC20AmountRecipient, RailgunNFTAmountRecipient, TXIDVersion } from '@railgun-community/shared-models';
  import { GenerateTransactionsProgressCallback } from './tx-generator';
  export declare const generateUnshieldProof: (txidVersion: TXIDVersion, networkName: NetworkName, railgunWalletID: string, encryptionKey: string, erc20AmountRecipients: RailgunERC20AmountRecipient[], nftAmountRecipients: RailgunNFTAmountRecipient[], broadcasterFeeERC20AmountRecipient: Optional<RailgunERC20AmountRecipient>, sendWithPublicWallet: boolean, overallBatchMinGasPrice: Optional<bigint>, progressCallback: GenerateTransactionsProgressCallback, mnemonicPassword?: string) => Promise<void>;
  export declare const generateUnshieldToOriginProof: (originalShieldTxid: string, txidVersion: TXIDVersion, networkName: NetworkName, railgunWalletID: string, encryptionKey: string, erc20AmountRecipients: RailgunERC20AmountRecipient[], nftAmountRecipients: RailgunNFTAmountRecipient[], progressCallback: GenerateTransactionsProgressCallback, mnemonicPassword?: string) => Promise<void>;
  export declare const generateUnshieldBaseTokenProof: (txidVersion: TXIDVersion, networkName: NetworkName, publicWalletAddress: string, railgunWalletID: string, encryptionKey: string, wrappedERC20Amount: RailgunERC20Amount, broadcasterFeeERC20AmountRecipient: Optional<RailgunERC20AmountRecipient>, sendWithPublicWallet: boolean, overallBatchMinGasPrice: Optional<bigint>, progressCallback: GenerateTransactionsProgressCallback, mnemonicPassword?: string) => Promise<void>;
  `\n\n## services/transactions/tx-unshield.d.ts\n\n`ts\nimport { RailgunPopulateTransactionResponse, RailgunTransactionGasEstimateResponse, RailgunERC20Amount, NetworkName, FeeTokenDetails, RailgunERC20AmountRecipient, RailgunNFTAmountRecipient, TransactionGasDetails, TXIDVersion } from '@railgun-community/shared-models';
  export declare const populateProvedUnshield: (txidVersion: TXIDVersion, networkName: NetworkName, railgunWalletID: string, erc20AmountRecipients: RailgunERC20AmountRecipient[], nftAmountRecipients: RailgunNFTAmountRecipient[], broadcasterFeeERC20AmountRecipient: Optional<RailgunERC20AmountRecipient>, sendWithPublicWallet: boolean, overallBatchMinGasPrice: Optional<bigint>, gasDetails: TransactionGasDetails) => Promise<RailgunPopulateTransactionResponse>;
  export declare const populateProvedUnshieldBaseToken: (txidVersion: TXIDVersion, networkName: NetworkName, publicWalletAddress: string, railgunWalletID: string, wrappedERC20Amount: RailgunERC20Amount, broadcasterFeeERC20AmountRecipient: Optional<RailgunERC20AmountRecipient>, sendWithPublicWallet: boolean, overallBatchMinGasPrice: Optional<bigint>, gasDetails: TransactionGasDetails) => Promise<RailgunPopulateTransactionResponse>;
  export declare const gasEstimateForUnprovenUnshield: (txidVersion: TXIDVersion, networkName: NetworkName, railgunWalletID: string, encryptionKey: string, erc20AmountRecipients: RailgunERC20AmountRecipient[], nftAmountRecipients: RailgunNFTAmountRecipient[], originalGasDetails: TransactionGasDetails, feeTokenDetails: Optional<FeeTokenDetails>, sendWithPublicWallet: boolean, mnemonicPassword?: string) => Promise<RailgunTransactionGasEstimateResponse>;
  export declare const gasEstimateForUnprovenUnshieldBaseToken: (txidVersion: TXIDVersion, networkName: NetworkName, publicWalletAddress: string, railgunWalletID: string, encryptionKey: string, wrappedERC20Amount: RailgunERC20Amount, originalGasDetails: TransactionGasDetails, feeTokenDetails: Optional<FeeTokenDetails>, sendWithPublicWallet: boolean, mnemonicPassword?: string) => Promise<RailgunTransactionGasEstimateResponse>;
  export declare const getERC20AndNFTAmountRecipientsForUnshieldToOrigin: (txidVersion: TXIDVersion, networkName: NetworkName, railgunWalletID: string, originalShieldTxid: string) => Promise<{
  erc20AmountRecipients: RailgunERC20AmountRecipient[];
  nftAmountRecipients: RailgunNFTAmountRecipient[];
  }>;
  export declare const populateProvedUnshieldToOrigin: (txidVersion: TXIDVersion, networkName: NetworkName, railgunWalletID: string, erc20AmountRecipients: RailgunERC20AmountRecipient[], nftAmountRecipients: RailgunNFTAmountRecipient[], gasDetails: TransactionGasDetails) => Promise<RailgunPopulateTransactionResponse>;
  export declare const gasEstimateForUnprovenUnshieldToOrigin: (originalShieldTxid: string, txidVersion: TXIDVersion, networkName: NetworkName, railgunWalletID: string, encryptionKey: string, erc20AmountRecipients: RailgunERC20AmountRecipient[], nftAmountRecipients: RailgunNFTAmountRecipient[], mnemonicPassword?: string) => Promise<RailgunTransactionGasEstimateResponse>;
  `\n\n## services/artifacts/artifact-store.d.ts\n\n`ts\n/// <reference types="node" />
  /// <reference types="node" />
  type GetArtifact = (path: string) => Promise<string | Buffer | null>;
  type StoreArtifact = (dir: string, path: string, item: string | Uint8Array) => Promise<void>;
  type ArtifactExists = (path: string) => Promise<boolean>;
  export declare class ArtifactStore {
  get: GetArtifact;
  store: StoreArtifact;
  exists: ArtifactExists;
  constructor(get: GetArtifact, store: StoreArtifact, exists: ArtifactExists);
  }
  export {};

```\n

```
