# Architecture

Next.js App Router hosts the product and a typed API dispatcher. React components depend on `PrivacyProvider`, not direct SDK calls. The SDK boundary is under `src/privacy/railgun`; expensive work belongs in the isolated browser worker. Real provider methods fail closed until the research gate passes.

PostgreSQL + Prisma store merchant and invoice business data, opaque expiring auth challenges, hashed session tokens, public-to-private payment attempts and signed receipts. Exact amounts are decimal atomic strings. Merchants own invoices through the authenticated user relationship. Public URLs and receipts use random bearer identifiers, not sequential database IDs.

Authentication signs a server-stored message binding origin, normalized address, chain 56, random nonce and a five-minute expiry. Signature verification precedes atomic nonce consumption. Sessions use HttpOnly SameSite=Lax cookies and TLS-secure cookies on HTTPS. Session hashes are keyed with a server secret. Mutating endpoints enforce JSON and an exact origin. Zod strict objects reject additional secret-bearing fields.

Mock lifecycle: PENDING → PAYMENT_SUBMITTED → CONFIRMING → PAID. Submission is capability protected; server transactions claim invoice state, preventing competing payments from settling twice. Merchant scan explicitly simulates chain confirmation. Merchant reconciliation checks the mock reference, hash, token and exact amount. Receipt issuance is atomic and idempotent. PAID invoices cannot be cancelled. PostgreSQL unique constraints enforce transaction and receipt deduplication.

Real lifecycle requires separate server verification of a canonical BNB receipt and local recipient wallet evidence. A Shield log alone is insufficient. The researched helper confirms chain 56, proxy destination, sender, receipt success, twelve confirmations and block-hash canonicality. Decrypted history must match originating transaction hash, token and net amount. Ambiguity remains review-required; it is never resolved by selecting the first invoice with the same amount.

Receipt keys are independent of merchant spending credentials. No service wallet holds merchant funds. Mock withdrawals use a serializable database ledger and preserve pending/spendable distinctions.

VPS processes and database chroot live inside Invoice. No existing proxy, system service, port or application is changed. Browser research is a separate build and cannot broadcast.
