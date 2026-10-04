# Private Invoice

Crypto invoices paid straight into the merchant's own RAILGUN private balance on BNB Chain.

**Live:** https://privateinvoice.space

Getting paid in USDT or USDC normally hands every client a view of your wallet: your balance, your other clients and where the money goes next. Private Invoice settles each invoice with a RAILGUN Shield transaction addressed to the merchant's `0zk` address, so the client pays from an ordinary wallet (MetaMask, Rabby, …) and the funds land in a balance only the merchant can see.

## How it works

1. **Merchant setup.** The merchant signs in with an EVM wallet and either creates a built-in RAILGUN wallet in the browser (keys are encrypted locally and never leave the device) or pastes an existing `0zk` address.
2. **Invoice.** The merchant creates a USDT/USDC invoice and shares the payment link.
3. **Checkout.** The server builds the Shield calldata for the merchant's address with a one-time key that is discarded immediately. The client approves exactly the gross amount and sends the transaction from their own wallet. RAILGUN's 0.25% shield fee is grossed up so the merchant receives the invoiced amount exactly.
4. **Verification.** A verifier in the Node server matches the on-chain Shield event against what was issued (shield key, note public key, ciphertext, token, amount), waits for the `finalized` block and marks the invoice paid with an Ed25519-signed receipt. Payments the client never reports are discovered through RAILGUN's BNB indexer.
5. **Withdrawal.** The built-in wallet syncs, decrypts notes and generates the zero-knowledge unshield proof in the browser (Groth16 via snarkjs), then the merchant sends it from their own wallet.

The platform never holds funds or spending keys. See [docs/railgun-payments.md](docs/railgun-payments.md), [docs/privacy-model.md](docs/privacy-model.md) and [docs/threat-model.md](docs/threat-model.md). The site also has a full documentation center at `/docs`.

### Privacy limits

- Withdrawing to a public address reveals that address and the amount on-chain.
- The client's paying wallet and the invoice link are visible to each other.
- RAILGUN charges 0.25% to shield and 0.25% to unshield. Private POI must clear before shielded funds are spendable.

## Stack

- Next.js 16, React 19, TypeScript, Tailwind CSS v4
- Prisma + PostgreSQL
- wagmi / viem for wallet connections (EIP-6963 wallet discovery)
- `@railgun-community/engine` and `wallet` SDKs; the merchant wallet runs in a Web Worker bundled with Vite (`vault/`)
- Vitest and Playwright

## Getting started

Requirements: Node.js 22, PostgreSQL (or the bundled embedded database script on Linux).

```bash
npm ci
node scripts/configure.mjs        # writes .env with random secrets (never commit it)
python3 scripts/setup-db.py       # optional: project-local embedded PostgreSQL
npm run db:generate
npm run db:migrate
npm run build:vault               # builds the in-browser RAILGUN wallet into public/vault
npm run build
bash scripts/start.sh
```

With an existing PostgreSQL server, set `DATABASE_URL` in `.env` and skip `setup-db.py`. Build the vault before `npm run build`, because Next.js only serves public files present at build time.

### Configuration

See [.env.example](.env.example).

| Variable | Purpose |
| --- | --- |
| `PRIVACY_PROVIDER` | `railgun` for real payments, `mock` for a simulated local workflow |
| `BNB_RPC_URL` | Server-side BNB Chain RPC (falls back to `NEXT_PUBLIC_BNB_RPC_URL`) |
| `APP_ORIGIN` | Exact browser origin, used for signed login and CSRF checks |
| `SESSION_SECRET` | Session token protection |
| `RECEIPT_SIGNING_KEY` | 32-byte hex Ed25519 seed for receipt signatures (server only) |
| `RAILGUN_DISCOVERY` | `logs` to discover unreported payments via `eth_getLogs` (forks); defaults to the RAILGUN indexer |

The free `bsc-dataseed` endpoints are enough: the server needs receipts, transactions, the `finalized` tag and one `eth_call`. A paid RPC adds an SLA, not functionality.

## Testing

```bash
npm run lint
npm run typecheck
npm run test          # unit tests
npm run test:e2e      # Playwright UI suite against a mock-mode instance (scripts/mock-app.sh)
```

Real payment flow against a BNB Chain fork (needs [Foundry](https://getfoundry.sh)'s `anvil` and an archive RPC):

```bash
anvil --fork-url https://bsc-mainnet.public.blastapi.io --chain-id 56 \
  --port 8545 --host 127.0.0.1 --slots-in-an-epoch 1 --silent &
bash scripts/fork-app.sh start
FORK_APP_URL=http://127.0.0.1:3101 npx playwright test tests/e2e/railgun-fork.spec.ts tests/e2e/vault.spec.ts
bash scripts/fork-app.sh stop
```

The fork suite runs a full checkout (approval, Shield, finality, receipt), silent payment discovery, and checks with the merchant's viewing key that the note decrypts.

## Receipts

Receipt payloads are canonicalized (recursive key sort), hashed with SHA-256 and signed with Ed25519. Each stored receipt carries its signing public key, so key rotation never invalidates old receipts. See `/docs/verify-receipts` on the site.

## Project layout

```
src/app/            Next.js routes (landing, workspace, checkout, receipts, docs)
src/components/     UI, wallet picker, checkout, vault forms
src/server/         API router, invoices, payments, RAILGUN shield builder and verifier
src/vault/          Browser client for the wallet worker
vault/              Web Worker running the RAILGUN engine (Vite build)
src/content/docs/   Documentation center content (English and Chinese)
prisma/             Schema and migrations
tests/              Unit and Playwright tests
```

## Languages

English and Simplified Chinese, switchable from the site header. See [docs/internationalization.md](docs/internationalization.md).

## Disclaimer

Private Invoice is an independent project built on the RAILGUN protocol. It is not affiliated with or endorsed by RAILGUN. Use at your own risk.
