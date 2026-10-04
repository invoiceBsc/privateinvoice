# Threat model and release gates

## Assets and boundaries

Merchant spend credentials: browser worker + encrypted SDK IndexedDB. Backend: merchant account, invoices, payer addresses, public tx hashes, signatures and receipts. A compromised origin, malicious extension or XSS can access an unlocked browser wallet; local storage is not a protection against an active compromised origin.

## Implemented protections

- Strict Zod API objects, token allowlist, chain 56 validation, atomic amount strings.
- One-time expiring signature challenges; origin/address binding; atomic replay prevention.
- HttpOnly SameSite=Lax sessions, keyed token lookup; Secure when served through configured HTTPS.
- Exact Origin enforcement on writes, same-origin JSON requests, frame denial and response sanitization.
- Merchant ownership checks; capability-protected payer submissions.
- State updates, serializable settlement, globally unique hashes and one receipt per invoice/attempt.
- No sensitive wallet logging; raw server errors are not returned.
- Ed25519 signed receipts with canonical hashes and original verification key stored.
- Mock-only actions unavailable when real provider selected; real endpoints fail closed.

## Required before real release

Browser SDK/prover/storage validation, artifact integrity and availability, POI endpoint availability, exact fee gross-up and net note accounting, exact-amount token approval including zero-first fallback, independent receipt and note validation, durable note/nullifier replay protection, wallet-backup/import acceptance, transaction replacement tracking, reorg recovery, scan completeness and ambiguity UI, secure error reporting and cleanup of unlock material.

TLS, nonce-based CSP, trusted-proxy rate limits, backup/restore, dependencies and browser compatibility must be reviewed. Unresolved critical/high transitive advisories are a real blocker for a production-quality declaration. Never solve this by claiming the mock tests prove real privacy integration.

## Testing limits

Unit tests exercise chain evidence with mocked RPC responses and pure matching using SDK models. E2E tests exercise genuine EVM signatures and PostgreSQL transactions but synthetic blockchain payments. No money is spent; no testnet or fork deployment is claimed as validated. The real-provider contract tests currently check refusal to act, not successful real transfers.
