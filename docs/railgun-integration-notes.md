# RAILGUN integration research

Research date: 2026-10-03 UTC. **This is a research report, not a successful real-payment acceptance report.** Read the validation matrix at the end.

## 1. Installed stable packages

- `@railgun-community/wallet`: **11.2.0**, registry `latest`.
- `@railgun-community/shared-models`: **8.2.1**, registry `latest`.
- Exact direct versions and transitive resolutions are recorded in `package.json` and `package-lock.json`.
- Official Wallet repository inspected at commit `5c9d04c844879b8377d91775052e88c836b48730`. Its main package.json reports **10.9.0**, behind registry latest. Installed published source is authoritative for this build. Old examples using wallet 10.4.0/shared-models 7.6.1 were not copied as version pins.
- Registry package versions were queried through npm from the VPS; research dependency audit is stored in `research/audit.json`.

Sources: [official Wallet repository](https://github.com/Railgun-Community/wallet), [npm Wallet package](https://www.npmjs.com/package/@railgun-community/wallet), [npm shared models](https://www.npmjs.com/package/@railgun-community/shared-models).

## 2. BNB network and deployment

Installed `NetworkName.BNBChain` is **`BNB_Chain`**. `NETWORK_CONFIG[NetworkName.BNBChain].chain` is `{ type: ChainType.EVM (0), id: 56 }`.

- V2 proxy: `0x590162bf4b50f6576a459b75309ee21d92178a10`
- Deployment block: `17633701`
- Relay Adapt: `0xF82d00fC51F730F42A00F85E74895a2849ffF2Dd`
- `supportsV3` is **false**, and BNB V3 deployment addresses are empty. Use `TXIDVersion.V2_PoseidonMerkle`; do not infer V3 from current SDK version.
- BNB-specific testnet is not present in the installed config. Ethereum Sepolia is present, but its existence does not validate BNB tokens or prove an active, suitable test deployment. No BNB testnet deployment is assumed.

Authoritative file: `node_modules/@railgun-community/shared-models/dist/models/network-config.js`; read-check snapshot: `research/bnb-read-check.json`.

## 3. USDT contract

**Binance-Peg USDT**, chain 56:

`0x55d398326f99059fF775485246999027B3197955`

Read-only mainnet RPC returned symbol `USDT`, decimals **18**, and nonempty bytecode. This is not Ethereum USDT precision. Primary provider reference: [Binance token metadata documentation](https://www.binance.com/sl/skills/detail/binance-web3/query-token-info).

## 4. USDC contract

**Binance-Peg USDC**, chain 56:

`0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d`

Read-only mainnet RPC returned symbol `USDC`, decimals **18**, and nonempty bytecode. This is a Binance-Peg asset, **not Circle-native USDC on BNB**. [Binance agentic wallet token reference](https://www.binance.com/en-JP/skills/detail/binance-web3/binance-agentic-wallet) lists this contract; [Circle supported chains](https://www.circle.com/multi-chain-usdc) does not identify BNB as native USDC. Token names in the UI are qualified accordingly.

Both contracts are configured centrally in `src/config/tokens.ts`. Bytecode/metadata reads confirm chain contracts, not complete privacy compatibility or issuer guarantees.

## 5. Exact Shield APIs

Installed Wallet SDK exposes:

```ts
gasEstimateForShield(
  txidVersion: TXIDVersion,
  networkName: NetworkName,
  shieldPrivateKey: string,
  erc20AmountRecipients: RailgunERC20AmountRecipient[],
  nftAmountRecipients: RailgunNFTAmountRecipient[],
  fromWalletAddress: string,
): Promise<RailgunTransactionGasEstimateResponse>

populateShield(
  txidVersion: TXIDVersion,
  networkName: NetworkName,
  shieldPrivateKey: string,
  erc20AmountRecipients: RailgunERC20AmountRecipient[],
  nftAmountRecipients: RailgunNFTAmountRecipient[],
  gasDetails?: TransactionGasDetails,
): Promise<RailgunPopulateTransactionResponse>
```

ERC20 recipient has `tokenAddress`, `amount: bigint`, and `recipientAddress`. Use network BNBChain and V2. Installed return has `transaction` and `preTransactionPOIsPerTxidLeafPerList`; examples that destructure a `nullifiers` field do not describe the current installed response. `serializeERC20Transfer`, `getGasDetailsForTransaction` and `getShieldSignature` shown in documentation are example application helpers, not assumed SDK exports.

SDK source `tx-shield.js` constructs encrypted Shield notes and uses the existing deployed contract. Shield does **not** require a spending Groth16 proof. Normal Mode A uses the customer's public wallet and requires no Broadcaster or preexisting RAILGUN balance.

Read allowance against configured proxy, approve exact **gross** input, handle zero-reset behavior defensively, estimate gas after approval, construct Shield, validate chain and send via public wallet. None of those real approval/broadcast steps are enabled in checkout yet.

Sources: installed `dist/services/transactions/tx-shield.{d.ts,js}`; [official Shield guide](https://docs.railgun.org/developer-guide/wallet/transactions/shielding/shield-erc-20-tokens).

**Fee note:** read-only `shieldFee()` returned **25 basis points at the recorded snapshot**. This is a measurement, not a hard-coded UI fee. `loadProvider` returns `feesSerialized`, including `shieldFeeV2`. Shield event/history net values and per-note fee must be checked against the contract integer rounding before implementing gross-up. Passing 5,000 tokens as gross input must not automatically satisfy an invoice expecting 5,000 net tokens.

## 6. Wallet creation, loading and storage

Confirmed SDK signatures:

```ts
createRailgunWallet(encryptionKey, mnemonic, creationBlockNumbers,
  railgunWalletDerivationIndex?, mnemonicPassword?)
loadWalletByID(encryptionKey, railgunWalletID, isViewOnlyWallet,
  mnemonicPassword?)
createViewOnlyRailgunWallet(encryptionKey, shareableViewingKey,
  creationBlockNumbers)
getWalletShareableViewingKey(railgunWalletID)
```

Engine uses an AbstractLevelDOWN-compatible database. `level-js` provides IndexedDB-based browser storage. Wallet returns `{ id, railgunAddress }`. Persist encrypted SDK wallet records with that storage, plus nonsensitive wallet ID/KDF salt. Generate the mnemonic in the browser. Require recovery backup acknowledgement before creation; import never traverses an API. Derive encryptionKey from user password locally with a salt; do not derive mnemonic from EVM sign-in. Never persist plaintext password, mnemonic or unlocked key.

`startRailgunEngine(walletSource, db, shouldDebug, artifactStore, useNativeArtifacts, skipMerkletreeScans, poiNodeURLs?, customPOILists?, verboseScanLogging?)` is the actual installed initializer. Use lowercase walletSource ≤16 characters, browser artifacts false, debug false, scans false for merchant balance use. The doc's `initializeEngine` is a wrapper example, not an SDK method.

The browser spike keeps credentials in its worker and uses PBKDF2-SHA256, 600,000 iterations, per-wallet random salt and a 256-bit derived key. This design still needs browser recovery/corruption and memory-lifecycle acceptance testing. No cloud/view-only watcher is implemented; opt-in would explicitly disclose the history visibility tradeoff.

Source: installed `wallets.d.ts`, `core/init.d.ts`; [engine guide](https://docs.railgun.org/developer-guide/wallet/getting-started/5.-start-the-railgun-privacy-engine).

## 7. Groth16 and artifacts

`getProver().setSnarkJSGroth16(groth16)` is the supported API. SDK's `SnarkJSGroth16` and external `@types/snarkjs` parameter types differ, so the isolated spike uses the documented compatibility cast via `unknown`, not `any`.

`ArtifactStore(get, store, exists)` supplies persistent artifact storage. The installed artifact utility selects WASM/ZKEY/verification-key files and POI resources using content-addressed SDK paths at `https://ipfs-lb.com`. Verified installed CIDs include:

- main: `QmUsmnK4PFc7zDp2cmC4wBZxYLjNyRgWfs5GNcJJ2uLcpU`
- POI: `QmZ2MyM6TKxffkv6stuo2hFwmUfs3q4xgMYN164Sje8new`

Do not invent artifact URL environment variables or silently fetch unverified alternate circuits. Browser artifact caching is separate IndexedDB. Full spending proof/artifact availability remains unvalidated. Workers isolate expensive derivation/scans from React rendering.

Sources: installed `services/artifacts/{artifact-store.d.ts,artifact-util.js}`, `core/prover.d.ts`; official docs export cached at `research/official-docs.txt`.

## 8. Balances and scanning

Confirmed:

```ts
loadProvider(fallbackProviderJsonConfig, networkName, pollingInterval?)
refreshBalances(chain, walletIdFilter)
rescanFullUTXOMerkletreesAndWallets(chain, walletIdFilter)
setOnBalanceUpdateCallback(callback?)
setOnUTXOMerkletreeScanCallback(callback)
setOnTXIDMerkletreeScanCallback(callback)
awaitWalletScan(walletID, chain)
getWalletTransactionHistory(chain, railgunWalletID, startingBlock)
```

Balance callback includes version, chain, wallet ID, `balanceBucket`, ERC20 and NFT arrays. Never aggregate all buckets into spendable. Local scan completeness must precede negative/no-payment claims. RPC failure, unavailable history and scan progress are not evidence of underpayment.

## 9. Private POI

SDK enum: `Spendable`, `ShieldBlocked`, `ShieldPending`, `ProofSubmitted`, `MissingInternalPOI`, `MissingExternalPOI`, `Spent`.

UI mapping: Spendable → spendable; ShieldPending/ProofSubmitted → pending; ShieldBlocked/MissingInternalPOI/MissingExternalPOI → requires attention; Spent → excluded. Unit tests cover every current bucket. A locally recognized, chain-confirmed Shield note can settle the invoice while pending; that does not authorize spending.

The spike preserves POI and uses the public node URL shown in current official docs (`https://ppoi.fdi.network`). Availability is a runtime integration gate, not an assumed guarantee. No hard-coded waiting duration is displayed. No sanctions/POI/broadcaster restriction is bypassed. Installed `populateProvedUnshieldToOrigin` and related official recovery methods exist, but no untested recovery button is shipped.

## 10. Can an incoming Shield be associated with the public originating tx?

**Yes at the installed source/type level; an actual funded recipient scan has not yet verified it in this application.** This distinction is critical.

Evidence chain:

1. Engine `V2-events.js`, `formatShieldCommitments(transactionHash, ...)`, writes each Shield commitment `txid` directly from the EVM event's `transactionHash`.
2. Engine recipient note scan carries commitment transaction context into the receive history.
3. Wallet `history/transaction-history.js`, `serializeTransactionHistory`, formats `historyEntry.txid` into the public `0x` hash.
4. Shared models `TransactionHistoryItem` exposes `txid`, blockNumber, receiveERC20Amounts; incoming token items have net amount, shieldFee, POI state and sender metadata.
5. `getWalletTransactionHistory(chain, walletID, startingBlock)` is exported and returns these items.

Therefore deterministic matching can use **BNB chain + originating public tx hash + token + exact expected net amount**, rather than token/amount alone. Same-amount invoices with distinct transactions do not inherently collide. Multiple same-token receive entries under one transaction can still be ambiguous; this MVP helper returns review-required instead of picking one.

Public tx verification cannot decrypt and prove the recipient alone. Authenticated merchant-local evidence remains required. For local mode the backend trusts the authenticated merchant's receipt observation within a defined threat model; it must also independently verify canonical chain context and prevent tx/note reuse.

**Additional privacy detail:** installed `ShieldNote.getShieldPrivateKeySignatureMessage` documents that the Shield private key can recover the recipient 0zk address. The sender therefore must not be promised cryptographic secrecy of that address merely because checkout hides it visually. The protected address is the merchant’s normal business 0x address.

## 11. Application matching logic still required

Yes. Validate chain receipt, proxy, sender, successful status, confirmation depth and canonical block; match local history txid/token/**net** amount; enforce invoice and note uniqueness; reject wrong-token/amount and concurrent duplicate settlements; handle replaced tx hashes, rescans and reorgs; show review-required on ambiguity; generate receipts only after reconciliation. POI spendability is independent.

`matchIncomingShield` and `validateChainEvidence` are implemented and unit-tested. They are not wired into a real endpoint yet. They deliberately do not assert that chain receipt alone means PAID. Unique fractional invoice amounts are not used.

## 12. Blockers and evidence matrix

| Check                                        | Evidence                             | Status                                                  |
| -------------------------------------------- | ------------------------------------ | ------------------------------------------------------- |
| Stable SDK versions, network enum/deployment | Installed source + registry          | Confirmed                                               |
| Token contract existence/symbol/18 decimals  | Read-only BNB RPC                    | Confirmed                                               |
| Actual Shield fee at snapshot                | Read-only BNB RPC                    | Confirmed (25 bps)                                      |
| Mode A Shield SDK signatures                 | Installed types/source               | Confirmed                                               |
| Original txid association                    | Engine + Wallet source chain         | Confirmed in source; funded scan pending                |
| Invoice/auth/mock/receipt/withdrawal         | PostgreSQL + unit + Playwright tests | Tested                                                  |
| Browser engine/create/load                   | Chromium + real SDK worker           | Passed engine, creation and encrypted reload            |
| Unsigned Shield for both tokens              | Chromium + actual populateShield     | Passed construction; broadcast and funded scans pending |
| Cold BNB balance scan                        | Chromium + SDK refresh/scan event    | Did not complete within the bounded check               |
| Token-specific Private POI outcome           | Runtime list/POI state               | Not certified                                           |
| Broadcaster support for either token         | Quotes/availability at runtime       | Not certified; Phase 2 omitted                          |
| Browser proof generation and artifacts       | API/source researched                | Proof acceptance pending                                |
| Exact gross-to-net rounding                  | Getter/history researched            | Contract acceptance pending                             |
| Replacement/reorg full UX                    | Chain helper tests only              | Full flow pending                                       |
| Production dependency hygiene                | npm audit                            | Unresolved critical/high advisories                     |

The isolated browser SDK build exceeded the VPS default ~1 GB Node heap on the first attempt. Its build is retried with a project-local heap option and lower priority; do not change other app runtimes. A successful bundle is not equivalent to successful browser engine/proof operation.

Broadcasters: current official browser package is `@railgun-community/waku-broadcaster-client-web` (registry latest observed 10.0.1), Node package `@railgun-community/waku-broadcaster-client-node` (10.0.1). The unsuffixed package referenced by older documentation is not currently published under that name. No Broadcaster package is installed because Mode B is deferred. Current private transfer API chain is `generateTransferProof` → `populateProvedTransfer`; unshield is `generateUnshieldProof` → `populateProvedUnshield`. See signature appendix captured directly from installed declarations.

No meaningful funds or custom contracts were used. No suitable BNB testnet or fork acceptance run is claimed. The safest supported current release is mock checkout with real-provider operations disabled until all integration gates pass.

The installed fallback-provider implementation requires total configured weights of at least two. This research page uses one RPC with weight two; this is not evidence of independent provider redundancy. Browser engine initialization, encrypted wallet creation/reload, BNB provider loading and unsigned Shield construction for both tokens passed. Cold balance scanning did not complete within the bounded smoke check. The main browser thread terminates a scan worker after 60 seconds and requires a page reload; it never treats the timeout as an empty or completed scan.
