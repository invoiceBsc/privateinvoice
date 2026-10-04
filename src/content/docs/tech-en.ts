import type { DocPage } from "./types";

const G = "Under the hood";

export const enTech: DocPage[] = [
  {
    slug: "railgun",
    group: G,
    title: "What is RAILGUN",
    summary: "The on-chain privacy protocol Private Invoice is built on.",
    icon: "shield",
    blocks: [
      {
        type: "p",
        text: "RAILGUN is a privacy protocol for EVM chains made of smart contracts and zero-knowledge proof circuits. It lets people hold and move ERC-20 tokens on a public chain without revealing balances, counterparties or amounts. RAILGUN is deployed on Ethereum, BNB Chain, Polygon and Arbitrum; Private Invoice uses the BNB Chain deployment.",
      },
      {
        type: "callout",
        tone: "info",
        title: "Non-custodial and permissionless",
        text: "No operator can freeze or take RAILGUN funds. The contracts hold them, and only someone with the right keys and a valid zero-knowledge proof can spend them. Private Invoice is an application on top of RAILGUN and likewise cannot move anyone's funds.",
      },
      { type: "h2", id: "model", text: "The core model: encrypted notes" },
      {
        type: "p",
        text: "RAILGUN doesn't keep account balances. Like Bitcoin it uses UTXOs: every private holding is a **note** with an owner, a token and an amount. Only a hash commitment of the note goes on-chain; the note itself is encrypted to the recipient's viewing key and published alongside, so only the recipient can open it.",
      },
      {
        type: "list",
        items: [
          "**Commitment**: the note's Poseidon hash, inserted as a leaf in an on-chain Merkle tree. To everyone else it looks random.",
          "**Merkle tree**: commitments form a depth-16 Poseidon Merkle tree with up to 65,536 leaves; when one fills up a new tree begins.",
          "**Nullifier**: spending a note publishes its nullifier, preventing double spends. A nullifier can't be linked back to its commitment.",
        ],
      },
      { type: "h2", id: "ops", text: "Three operations" },
      {
        type: "table",
        head: ["Operation", "What it does", "Visible on-chain"],
        rows: [
          [
            "Shield (deposit)",
            "Moves tokens from a public wallet into the pool as a note owned by the recipient",
            "Payer address, token, amount",
          ],
          [
            "Transfer (private)",
            "Moves value inside the pool, spending old notes and creating new ones",
            "Only nullifiers and new commitments",
          ],
          [
            "Unshield (withdraw)",
            "Takes private funds back out to a public address",
            "Destination, token, amount",
          ],
        ],
      },
      {
        type: "p",
        text: "A Private Invoice payment is a Shield: the customer deposits from their public wallet straight into a note owned by the merchant. A merchant withdrawal is an Unshield.",
      },
      { type: "h2", id: "zk", text: "Zero-knowledge proofs" },
      {
        type: "p",
        text: "To spend notes (a private transfer or a withdrawal), the owner generates a Groth16 zk-SNARK locally proving three things to the contract: the notes exist in the Merkle tree, the prover holds the keys to spend them, and inputs equal outputs. The contract checks the proof without learning which notes were spent or who owns them. Shielding needs no proof.",
      },
      { type: "h2", id: "poi", text: "Private Proofs of Innocence" },
      {
        type: "p",
        text: "To keep stolen funds out of the pool, RAILGUN adds Private POI: before deposited funds can be spent, they must be proven not to come from listed malicious addresses, without revealing who the user is. See [Private POI](/docs/private-poi).",
      },
      { type: "h2", id: "fees", text: "Protocol fees and governance" },
      {
        type: "p",
        text: "RAILGUN charges a percentage on Shield and Unshield (currently 0.25% on BNB Chain), set by RAILGUN DAO governance. Private Invoice reads the live rate from the contract at checkout rather than hard-coding it.",
      },
    ],
  },
  {
    slug: "keys-and-addresses",
    group: G,
    title: "Private addresses and keys",
    summary: "What a 0zk address contains and how notes are locked to you.",
    icon: "lock",
    blocks: [
      {
        type: "p",
        text: "Your private wallet derives a set of keys from its 12-word recovery phrase and encodes them as an address starting with `0zk1`. Understanding these keys explains why our server can't see your balance.",
      },
      { type: "h2", id: "keys", text: "Keys" },
      {
        type: "table",
        head: ["Key", "Purpose", "Held by"],
        rows: [
          [
            "Spending key",
            "Signs inside the zero-knowledge circuit to authorise spending",
            "Only you",
          ],
          [
            "Nullifying key",
            "Computes note nullifiers to prevent double spends",
            "Only you",
          ],
          [
            "Viewing key",
            "Decrypts incoming notes via ECDH; scans balance and history",
            "Only you",
          ],
          [
            "Master public key",
            "Derived from the spending public key and nullifying key; locks notes to their owner",
            "Public (in the address)",
          ],
          [
            "Viewing public key",
            "Lets payers encrypt notes only you can open",
            "Public (in the address)",
          ],
        ],
      },
      {
        type: "p",
        text: "A 0zk address is the bech32 encoding of the master public key and viewing public key, so it's safe to share: knowing it lets someone pay you, not see your balance or spend your funds.",
      },
      { type: "h2", id: "note-key", text: "How a note is locked to you" },
      {
        type: "p",
        text: "Each note carries a 16-byte `random`. Its note public key (npk) is computed from your master public key and that random:",
      },
      {
        type: "code",
        lang: "text",
        text: "npk        = Poseidon(masterPublicKey, random)\ncommitment = Poseidon(npk, tokenHash, value)",
      },
      {
        type: "p",
        text: "Only `commitment` appears on-chain. Without `random`, nobody can relate it to your master public key.",
      },
      { type: "h2", id: "encryption", text: "Encryption and scanning" },
      {
        type: "steps",
        items: [
          {
            title: "The payer creates a one-time key",
            text: "Building a Shield generates a one-time shield private key; its public key (shieldKey) goes into the transaction.",
          },
          {
            title: "ECDH agrees a shared key",
            text: "An elliptic-curve key exchange between the one-time key and your viewing public key, hashed with SHA-256, gives a symmetric key.",
          },
          {
            title: "AES-GCM encrypts random",
            text: "The symmetric key encrypts the note's random, published on-chain as encryptedBundle.",
          },
          {
            title: "Your wallet scans and decrypts",
            text: "Your wallet runs the same exchange with your viewing private key and the on-chain shieldKey, gets the same symmetric key, decrypts random and checks the npk matches your master public key, proving the note is yours.",
          },
        ],
      },
      {
        type: "callout",
        tone: "success",
        title: "Why our server can't see your balance",
        text: "Scanning and decryption need the viewing private key, which exists only in the private wallet in your browser. The server knows your 0zk address and can't open any note sent to you.",
      },
    ],
  },
  {
    slug: "shield-anatomy",
    group: G,
    title: "Anatomy of a payment",
    summary:
      "From clicking Pay to funds in the merchant's private wallet, step by step.",
    icon: "scan",
    blocks: [
      {
        type: "p",
        text: "The customer's browser never loads the RAILGUN engine. The server prepares the payment transaction; the customer's wallet only signs and sends it. Here is the full lifecycle of a payment.",
      },
      { type: "h2", id: "flow", text: "The flow" },
      {
        type: "flow",
        items: [
          {
            title: "1. Server builds the Shield",
            text: "Reads the live fee, computes the gross amount, builds the note and ciphertext for the merchant's 0zk address with a one-time key, and encodes the shield() call.",
          },
          {
            title: "2. Approve the exact amount",
            text: "The customer's wallet calls USDT approve(RAILGUN proxy, gross amount), approving only what this payment needs.",
          },
          {
            title: "3. Send the Shield",
            text: "The wallet sends the prepared transaction to the RAILGUN proxy, which pulls the tokens, takes the protocol fee and inserts the commitment.",
          },
          {
            title: "4. Verify on-chain",
            text: "The server reads the receipt, decodes the Shield event and compares note key, ciphertext, token and amount received.",
          },
          {
            title: "5. Finality",
            text: "Once the block is finalized on BNB Chain, the invoice is marked paid and a receipt is signed.",
          },
          {
            title: "6. Merchant wallet sees it",
            text: "When the merchant's in-browser wallet syncs, it decrypts the note with the viewing key and the balance appears as pending.",
          },
        ],
      },
      { type: "h2", id: "request", text: "The Shield request" },
      {
        type: "p",
        text: "The RAILGUN proxy's `shield()` takes a list of ShieldRequests, each with a note preimage and ciphertext:",
      },
      {
        type: "code",
        lang: "solidity",
        text: "struct ShieldRequest {\n  CommitmentPreimage preimage;   // npk, token, value\n  ShieldCiphertext ciphertext;   // encryptedBundle[3], shieldKey\n}",
      },
      {
        type: "list",
        items: [
          "`preimage.npk`: note public key from the merchant's master public key and a random.",
          "`preimage.token`: token type (ERC-20) and contract address.",
          "`preimage.value`: the gross amount deposited; the contract deducts the fee.",
          "`ciphertext.encryptedBundle`: the AES-GCM-encrypted random plus the encrypted recipient viewing key.",
          "`ciphertext.shieldKey`: the one-time shield public key the merchant's wallet uses for ECDH.",
        ],
      },
      { type: "h2", id: "fee-math", text: "Computing the gross amount" },
      {
        type: "p",
        text: "Shield fees are fee-inclusive: received = gross − ⌊gross × bps / 10000⌋. So the merchant receives exactly the invoice amount N, the server finds the smallest gross G such that:",
      },
      {
        type: "code",
        lang: "text",
        text: "G − floor(G × bps / 10000) = N\n\nExample: N = 1,000 USDT, bps = 25\n         G = 1,002.506265664160401002 USDT",
      },
      {
        type: "p",
        text: "This matches the RAILGUN contract's own `getFee()` exactly; our tests check it against the contract function.",
      },
      { type: "h2", id: "ephemeral", text: "The one-time key is never stored" },
      {
        type: "p",
        text: "After building the request the server zeroes the one-time shield private key. The database keeps only public values: shieldKey, note public key, ciphertext and the creation block. They're enough to recognise the payment on-chain and useless for decrypting anything.",
      },
    ],
  },
  {
    slug: "verification",
    group: G,
    title: "On-chain verification",
    summary: "How the server confirms payments without holding any keys.",
    icon: "check",
    blocks: [
      {
        type: "p",
        text: "Confirming a payment doesn't need the merchant online or their viewing key. The server reads public chain data and compares it exactly with the public values saved when the payment was issued.",
      },
      { type: "h2", id: "checks", text: "Rules" },
      {
        type: "table",
        head: ["Check", "Source", "On failure"],
        rows: [
          [
            "Transaction succeeded",
            "Receipt status",
            "Back to awaiting payment",
          ],
          [
            "Event emitted by the RAILGUN proxy",
            "Log address",
            "Event ignored",
          ],
          [
            "shieldKey belongs to this payment",
            "Shield event shieldCiphertext",
            "Not this payment",
          ],
          [
            "Note public key matches",
            "Shield event commitments",
            "Needs review",
          ],
          [
            "encryptedBundle matches byte for byte",
            "Shield event shieldCiphertext",
            "Needs review",
          ],
          [
            "Token type and address match",
            "Shield event commitments",
            "Needs review",
          ],
          [
            "Amount after fee equals the invoice",
            "Shield event commitments.value",
            "Needs review",
          ],
          [
            "Block is finalized",
            'eth_getBlockByNumber("finalized")',
            "Keep waiting",
          ],
        ],
      },
      {
        type: "callout",
        tone: "info",
        title: "Why compare the ciphertext",
        text: "A matching note key only shows the funds are locked to the merchant. Only a matching ciphertext guarantees the merchant's wallet can decrypt the random and actually find and spend the funds. Comparing it byte for byte stops anyone from faking a paid invoice with a deposit the merchant could never use.",
      },
      { type: "h2", id: "finality", text: "Finality" },
      {
        type: "p",
        text: "BNB Chain has fast finality: blocks are usually finalized about two seconds later and can't be reorganised after that. The server waits until the payment's block is at or before the finalized block before marking the invoice paid.",
      },
      {
        type: "h2",
        id: "discovery",
        text: "When the customer doesn't report the transaction",
      },
      {
        type: "p",
        text: "If the customer closes the page after paying, the server never gets the transaction hash. The verifier queries RAILGUN's official BNB indexer (the same source the wallet SDK quick-syncs from) by block range, finds the Shield with the matching shieldKey and runs the same checks. The indexer usually trails the chain by about a minute.",
      },
      { type: "h2", id: "loop", text: "The verifier" },
      {
        type: "list",
        items: [
          "Runs alongside the app and processes submitted, unconfirmed payments every few seconds.",
          "Needs only basic RPC: transaction receipts, transactions, the finalized block and one contract call. Free public endpoints work.",
          "A second valid payment for the same invoice is recorded as a duplicate; no second receipt is issued.",
        ],
      },
    ],
  },
  {
    slug: "zk-withdrawals",
    group: G,
    title: "Zero-knowledge withdrawals",
    summary: "What happens in your browser when you withdraw.",
    icon: "download",
    blocks: [
      {
        type: "p",
        text: "A withdrawal (Unshield) spends private notes, so it requires a zero-knowledge proof. The whole process runs in a background thread of the merchant's browser; keys never leave the device.",
      },
      { type: "h2", id: "steps", text: "Steps" },
      {
        type: "steps",
        items: [
          {
            title: "Sync the Merkle tree",
            text: "The wallet quick-syncs every commitment from RAILGUN's indexer and rebuilds the Poseidon Merkle tree locally for membership proofs.",
          },
          {
            title: "Select notes",
            text: "Spendable notes (past POI) covering the amount are chosen as inputs.",
          },
          {
            title: "Fetch proving files",
            text: "The first withdrawal downloads the circuit's WASM and zkey files, fetched by content address and cached in the browser.",
          },
          {
            title: "Generate a Groth16 proof",
            text: "snarkjs proves locally that the inputs are in the tree, you may spend them and amounts balance, and publishes the nullifiers.",
          },
          {
            title: "Attach POI proofs",
            text: "Proofs required by Private POI are generated too, showing the funds have cleared compliance.",
          },
          {
            title: "Send from a public wallet",
            text: "The merchant's connected public wallet signs and sends the transaction and pays the BNB network fee.",
          },
        ],
      },
      { type: "h2", id: "public", text: "What a withdrawal reveals" },
      {
        type: "p",
        text: "After verifying the proof, the contract sends the tokens (minus the 0.25% protocol fee) to the public destination. Visible on-chain: destination, token, amount and the sending wallet. Not visible: which notes were spent or which payments they came from.",
      },
      {
        type: "callout",
        tone: "warning",
        title: "About the sending wallet",
        text: "Withdrawals are currently sent by the merchant's own public wallet, which links that wallet to a RAILGUN withdrawal. If that matters to you, use a dedicated wallet to send withdrawals. RAILGUN Broadcasters (relayers) avoid this; we plan to support them later.",
      },
      { type: "h2", id: "performance", text: "Performance" },
      {
        type: "p",
        text: "The first Merkle-tree sync downloads about 50,000 commitments, roughly a minute on a typical laptop; later syncs take seconds. Proofs are generated in a background thread so the page stays responsive; time depends on the device and the number of input notes.",
      },
    ],
  },
  {
    slug: "private-poi",
    group: G,
    title: "Private POI",
    summary:
      "How the compliance check works and why new funds show as pending.",
    icon: "shield",
    blocks: [
      {
        type: "p",
        text: "Private Proofs of Innocence (POI) is RAILGUN's mechanism for keeping illicit funds out of the privacy pool. It proves funds don't come from flagged addresses without revealing the user's identity or balance.",
      },
      { type: "h2", id: "how", text: "How it works" },
      {
        type: "list",
        items: [
          "POI nodes maintain public address lists, for example addresses tied to known hacks or sanctioned entities.",
          "Newly deposited funds start in a waiting period while nodes check the source against those lists.",
          "Once cleared, the wallet can generate a POI proof for the funds and attach it when spending them.",
          "Everything uses zero-knowledge proofs: POI nodes never learn which 0zk address the funds belong to.",
        ],
      },
      { type: "h2", id: "buckets", text: "Balance states" },
      {
        type: "table",
        head: ["SDK state", "Shown as", "Meaning"],
        rows: [
          ["Spendable", "Available", "Cleared; can be withdrawn"],
          ["ShieldPending", "Pending", "Just deposited, in the waiting period"],
          [
            "ProofSubmitted",
            "Pending",
            "Proof submitted, awaiting node confirmation",
          ],
          [
            "ShieldBlocked",
            "Needs attention",
            "Source flagged by a list; can't be spent normally",
          ],
          [
            "MissingInternalPOI / MissingExternalPOI",
            "Needs attention",
            "A required proof is missing and must be regenerated",
          ],
        ],
      },
      { type: "h2", id: "payments", text: "Effect on payments" },
      {
        type: "p",
        text: "POI only affects when funds can be spent, not payment confirmation: the invoice is marked paid once the transaction is final. If a payment comes from a flagged address, the funds show as Needs attention; Private Invoice will not and cannot bypass the check.",
      },
    ],
  },
  {
    slug: "architecture",
    group: G,
    title: "Architecture",
    summary:
      "What each component does, how data flows and where trust boundaries sit.",
    icon: "link",
    blocks: [
      { type: "h2", id: "components", text: "Components" },
      {
        type: "table",
        head: ["Component", "Runs in", "Responsibility"],
        rows: [
          [
            "Web app (Next.js)",
            "Server",
            "Sign-in, invoices, checkout, receipts and workspace UI",
          ],
          [
            "Shield builder",
            "Server",
            "Reads the fee, computes the gross amount, builds the note and shield() calldata",
          ],
          [
            "Verifier",
            "Server (always on)",
            "Reads receipts, matches Shield events, waits for finality, signs receipts",
          ],
          [
            "PostgreSQL",
            "Server",
            "Merchants, invoices, payment records (public values only) and signed receipts",
          ],
          [
            "Private wallet (RAILGUN Wallet SDK)",
            "Web Worker in the merchant's browser",
            "Key derivation, encrypted storage, sync, balances, proof generation",
          ],
          [
            "Customer wallet",
            "Customer's browser",
            "Approves and sends the payment; never loads the RAILGUN engine",
          ],
        ],
      },
      { type: "h2", id: "trust", text: "Trust boundaries" },
      {
        type: "list",
        items: [
          "**The server can**: see invoices, payment transactions and the merchant's sign-in and 0zk addresses; sign receipts.",
          "**The server cannot**: decrypt notes, see balances, move funds or fake an on-chain payment.",
          "**The merchant's browser holds**: every key derived from the phrase (encrypted), the local Merkle tree and balances.",
          "**Public on-chain**: payer addresses, tokens, amounts, Shield events and withdrawals.",
        ],
      },
      { type: "h2", id: "auth", text: "Sign-in and sessions" },
      {
        type: "p",
        text: "Sign-in uses a wallet signature: the server issues a message binding the site origin, wallet address, chain ID, a random nonce and a five-minute expiry, verifies the signature and then atomically consumes the nonce to prevent replay. Session tokens are stored only as keyed hashes; cookies are HttpOnly, SameSite=Lax and Secure over HTTPS. Every write checks the request origin.",
      },
      { type: "h2", id: "vault", text: "The browser wallet" },
      {
        type: "p",
        text: "The private wallet is a separately bundled Web Worker running the official RAILGUN Wallet SDK. Wallet data lives in IndexedDB via level-js, encrypted by the SDK with a key derived from your password using PBKDF2-SHA256 (600,000 iterations). The worker and page exchange only commands and results; the recovery phrase is shown once, at creation.",
      },
    ],
  },
  {
    slug: "verify-receipts",
    group: G,
    title: "Verifying receipts",
    summary: "The receipt signature format and how to check it yourself.",
    icon: "invoice",
    blocks: [
      {
        type: "p",
        text: "Every receipt carries an Ed25519 signature. The downloadable JSON includes the payload, its hash, the signature and the public key used, so anyone can verify it offline.",
      },
      { type: "h2", id: "format", text: "How it's signed" },
      {
        type: "steps",
        items: [
          {
            title: "Canonicalise the payload",
            text: "Keys are sorted lexicographically and recursively, producing a deterministic JSON string.",
          },
          {
            title: "Hash",
            text: "SHA-256 of the canonical string gives a 32-byte payload hash.",
          },
          {
            title: "Sign",
            text: "The server signs those 32 bytes with its Ed25519 key; the signature is stored in base64.",
          },
        ],
      },
      {
        type: "p",
        text: "The payload holds the invoice ID, amount (smallest units), token address, chain ID, on-chain transaction hash, payment time and status. Real-payment receipts also include the block number and gross amount.",
      },
      { type: "h2", id: "node", text: "Verify with Node.js" },
      {
        type: "code",
        lang: "javascript",
        text: 'import { createHash, createPublicKey, verify } from "node:crypto";\nimport { readFileSync } from "node:fs";\n\nconst r = JSON.parse(readFileSync("RCPT-XXXXXXXX.json", "utf8"));\nconst canonical = (v) =>\n  v === null || typeof v !== "object" ? JSON.stringify(v)\n  : Array.isArray(v) ? "[" + v.map(canonical).join(",") + "]"\n  : "{" + Object.keys(v).sort().map((k) => JSON.stringify(k) + ":" + canonical(v[k])).join(",") + "}";\n\nconst hash = createHash("sha256").update(canonical(r.payload)).digest("hex");\nconsole.log("hash matches:", hash === r.payloadHash);\nconsole.log("signature valid:", verify(null, Buffer.from(hash, "hex"),\n  createPublicKey(r.publicKey), Buffer.from(r.signature, "base64")));',
      },
      { type: "h2", id: "chain", text: "Cross-check the chain" },
      {
        type: "p",
        text: "The signature proves Private Invoice issued the receipt and it hasn't been altered. To confirm the funds moved, look up the payload's `paymentTxHash` on BscScan and check it called the RAILGUN proxy and succeeded.",
      },
      {
        type: "callout",
        tone: "info",
        text: "Receipts keep the public key they were signed with, so they stay verifiable after a key rotation. Whether that key belongs to this service should be confirmed through a trusted channel.",
      },
    ],
  },
];
