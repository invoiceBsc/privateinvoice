# Real RAILGUN payments (Mode A, public → private)

Enabled with `PRIVACY_PROVIDER=railgun` and a server-side `BNB_RPC_URL` (falls back to `NEXT_PUBLIC_BNB_RPC_URL`). Mock mode is unchanged.

## Flow

1. **Merchant setup.** The merchant pastes a RAILGUN `0zk` address they control (for example from Railway). The server validates it with `RailgunEngine.decodeAddress` and rejects addresses bound to another chain. We never hold merchant keys.
2. **Payment attempt.** `POST /api/invoices/:id/payment-attempt` builds the Shield on the server (`src/server/railgun/shield.ts`): it reads `shieldFee()` from the proxy, computes the smallest gross amount whose post-fee value equals the invoice exactly (`grossForNet`, matching `RailgunLogic.getFee`), creates a `ShieldNoteERC20` for the merchant's master/viewing public keys with a fresh ephemeral shield private key, and returns calldata for `shield()` on the BNB proxy `0x5901…8a10`. The ephemeral key is zeroed after serialisation and never stored. The attempt stores only public values: gross amount, shield public key, note public key, encrypted bundle and the block it was created at.
3. **Checkout.** The customer's wallet approves exactly the gross amount (never unlimited), sends the prepared transaction and reports the hash. The customer page loads no RAILGUN SDK.
4. **Verification.** `src/server/railgun/verifier.ts` runs inside the Node server (`src/instrumentation.ts`). For each submitted attempt it reads the receipt, finds the Shield commitment by its shield public key and requires the note public key, encrypted bundle, token and post-fee value to equal what was issued. Matching the ciphertext byte-for-byte guarantees the merchant's viewing key can decrypt the note, so their wallet will find it. The invoice is marked PAID and a signed receipt issued once the block is at or below the `finalized` tag (about two blocks on BNB Chain).
5. **Discovery.** If the customer closes the page before reporting the hash, the verifier looks for Shield commitments since the attempt's creation block and matches them by shield public key. By default it asks RAILGUN's official BNB indexer (`rail-squid…/squid-railgun-bsc-v2`, the same source the wallet SDK quick-syncs from, about a minute behind the chain); `RAILGUN_DISCOVERY=logs` reads `eth_getLogs` instead, which the fork tests use.

**RPC requirements.** The server only needs `eth_getTransactionReceipt`, `eth_getTransaction`, the `finalized` block tag, `eth_blockNumber` and one `eth_call` for the shield fee. The free official endpoints (`bsc-dataseed*.bnbchain.org`) handle these but refuse `eth_getLogs` entirely, which is why discovery uses the indexer. A paid RPC is optional: it adds an SLA and rate headroom, not functionality.

Outcomes: a failed, reverted or unrelated transaction returns the invoice to PENDING; a Shield that matches the key but not the issued note goes to REVIEW_REQUIRED; a second valid payment for an already paid invoice is recorded with `DUPLICATE_PAYMENT` for refund review.

Balances, private transfers and withdrawals stay in the merchant's own RAILGUN wallet. Private POI still applies before funds are spendable there.

## Testing against a BNB Chain fork

The fork needs an archive RPC; public `bsc-dataseed` prunes state after a few minutes. The BlastAPI public endpoint works but rate-limits `eth_getLogs`, so use a paid RPC for long runs.

```bash
anvil --fork-url https://bsc-mainnet.public.blastapi.io --chain-id 56 \
  --port 8545 --host 127.0.0.1 --slots-in-an-epoch 1 --silent &
bash scripts/fork-app.sh start      # :3101, PRIVACY_PROVIDER=railgun, fresh `fork` DB schema
FORK_APP_URL=http://127.0.0.1:3101 node --env-file=.env node_modules/@playwright/test/cli.js \
  test tests/e2e/railgun-fork.spec.ts
bash scripts/fork-app.sh stop
```

`--slots-in-an-epoch 1` makes `finalized` trail `latest` by two blocks, like BNB Chain. The spec covers a full checkout (approval, Shield, finality, receipt, merchant dashboard) and silent discovery, and checks with the merchant's viewing key that the note decrypts. `SHOTS=<dir>` saves screenshots. 

## Before real money

Use a paid BNB RPC, run one small mainnet payment into a wallet you control and confirm it appears in Railway, then switch the public instance to `PRIVACY_PROVIDER=railgun`.

## Built-in merchant wallet (vault)

Merchants no longer need a separate RAILGUN app. At onboarding the default "Built-in wallet" option creates a RAILGUN wallet inside the merchant's browser; "Existing RAILGUN address" keeps the paste-a-0zk path for Railway users.

- **Where it runs.** `vault/worker.ts` is a module Web Worker bundled by Vite into `public/vault/` (`npm run build:vault`, then `npm run build` so Next serves the new files). `src/vault/client.ts` loads it through `public/vault/manifest.json`, keeps one worker per tab and exposes state via `useVault()`. The page never touches keys.
- **Keys.** The 12-word phrase is generated in the worker, shown once (blurred until revealed) and must be acknowledged. The wallet is encrypted by the SDK in IndexedDB with a 256-bit key from PBKDF2-SHA256 (600,000 iterations, per-wallet salt) over the merchant's password (10+ characters). Password and phrase are never persisted or sent anywhere. New wallets record the current block, so they only scan forward; imports scan full history and must reproduce the registered 0zk address.
- **Sync.** Unlocking starts one shared sync (`vault.ensureSynced()`): UTXO tree via RAILGUN's BNB quick-sync, then TXID tree. A cold sync took about two minutes in headless Chromium on the 1-CPU VPS; state persists in IndexedDB, so later visits are incremental. Balances follow Private POI buckets: spendable, pending (ShieldPending/ProofSubmitted) and needs attention (blocked/missing POI).
- **Withdrawals.** `withdraw` estimates gas, generates the unshield proof in the worker (proving artifacts download on first use and are cached), and returns a populated transaction that the merchant's connected public wallet sends and pays BNB gas for. The UI shows the 0.25% unshield fee and warns that destination and amount become public. No Broadcaster is used.
- **Devices.** Funds shows unlock, sync progress, balances, withdrawals and incoming payments. On a device without the wallet it offers restore from the phrase; "Remove from this device" deletes local keys after confirmation.
- **Caching.** Hashed worker and asset files are served `immutable`; `manifest.json` stays `max-age=0`. Next compresses the 10 MB worker to about 2.7 MB.

`tests/e2e/vault.spec.ts` (real-mode instance) covers creation with phrase backup, sync to balances, lock with a rejected wrong password, removal, a rejected foreign phrase and restore. Withdrawals need real funds that have cleared Private POI, so they are covered by the mainnet acceptance run rather than the fork.
