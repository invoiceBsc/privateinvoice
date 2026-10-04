import type { DocPage } from "./types";

export const en: DocPage[] = [
  {
    slug: "getting-started",
    group: "Basics",
    title: "Getting started",
    summary: "Set up receiving and send your first invoice in five minutes.",
    icon: "arrowRight",
    blocks: [
      {
        type: "p",
        text: "Private Invoice lets you get paid in USDT or USDC straight into your own RAILGUN private wallet, so customers never see your everyday business wallet, balance or where funds go next. There's nothing to download: all you need is a browser wallet such as MetaMask, Rabby or OKX.",
      },
      { type: "h2", id: "before", text: "Before you start" },
      {
        type: "list",
        items: [
          "A browser wallet that supports BNB Chain, used to sign in. It doesn't need a balance.",
          "Pen and paper to write down your private wallet's 12-word recovery phrase.",
          "The computer you normally use. The private wallet lives in this browser; on another device you restore it with the phrase.",
        ],
      },
      { type: "h2", id: "steps", text: "Setup" },
      {
        type: "steps",
        items: [
          {
            title: "Connect your wallet and sign in",
            text: "Click Connect wallet in the top-right, choose your wallet and sign a login message. Signing never approves tokens or sends a transaction.",
          },
          {
            title: "Name your business",
            text: 'This name appears on your customers\' payment page, for example "North Design Studio".',
          },
          {
            title: "Create your private wallet",
            text: "Choose a wallet password of at least 10 characters. The site generates your private wallet in this browser and shows 12 recovery words. Make sure no one is watching, then reveal and write them down.",
          },
          {
            title: "Confirm the backup",
            text: 'Tick "I\'ve written the recovery phrase down somewhere safe" and click Create workspace. Your receiving address (starting with 0zk) is ready.',
          },
        ],
      },
      {
        type: "callout",
        tone: "warning",
        title: "The recovery phrase is the only way back to your funds",
        text: "After clearing browser data, switching computers or reinstalling, only the phrase restores your wallet. We can't recover it and never see it. Don't screenshot it or send it to anyone.",
      },
      { type: "h2", id: "first-invoice", text: "Send your first invoice" },
      {
        type: "steps",
        items: [
          {
            title: "Create the invoice",
            text: "In the workspace click Create invoice and enter the amount, token (USDT or USDC), description and due date. The customer name is visible only to you.",
          },
          {
            title: "Copy the payment link",
            text: "On the invoice page click Copy payment link and send it however you like: email, chat or anything else.",
          },
          {
            title: "Get paid",
            text: "Once the customer pays, the payment is confirmed automatically within seconds and a receipt is issued. Your workspace refreshes on its own; there's nothing to reconcile.",
          },
        ],
      },
      {
        type: "p",
        text: "Received funds appear on the Funds page. New funds first pass RAILGUN's compliance check; see [Withdrawals and compliance](/docs/withdrawals).",
      },
    ],
  },
  {
    slug: "paying",
    group: "Basics",
    title: "How customers pay",
    summary: "Send this to a customer paying for the first time.",
    icon: "wallet",
    blocks: [
      {
        type: "p",
        text: "Paying needs no account and no new app. Anyone with USDT or USDC on BNB Chain in a browser wallet can pay in about a minute.",
      },
      { type: "h2", id: "need", text: "What the customer needs" },
      {
        type: "list",
        items: [
          "USDT or USDC on BNB Chain, slightly more than the invoice amount (it includes the 0.25% privacy fee).",
          "A little BNB for network fees. A payment usually costs a few cents.",
          "Any browser wallet that supports BNB Chain: MetaMask, Rabby, OKX Wallet, Binance Wallet and so on.",
        ],
      },
      { type: "h2", id: "flow", text: "Steps" },
      {
        type: "steps",
        items: [
          {
            title: "Open the payment link",
            text: "The page shows the business name, description, invoice amount and the total to pay including the fee.",
          },
          {
            title: "Connect a wallet",
            text: "Click Connect wallet and choose a wallet. If it isn't on BNB Chain, the page asks to switch.",
          },
          {
            title: "Approve and pay",
            text: "After clicking Pay, the wallet asks twice: first to approve this exact amount (never an unlimited allowance), then to confirm the payment.",
          },
          {
            title: "Wait for confirmation",
            text: "A few seconds after the transaction lands, the page shows Payment confirmed, with links to the receipt and the on-chain transaction.",
          },
        ],
      },
      {
        type: "callout",
        tone: "info",
        title: "Closing the page is fine",
        text: "If the page is closed right after paying, the payment is still found from on-chain records and marked as paid, usually within about a minute.",
      },
      { type: "h2", id: "amount", text: "Why the total is slightly higher" },
      {
        type: "p",
        text: "Payments enter the RAILGUN privacy protocol, which charges a 0.25% deposit fee. So that the merchant receives exactly the invoice amount, the payer covers it. A 1,000 USDT invoice costs the customer about 1,002.51 USDT. The page shows both the rounded figure and the exact amount.",
      },
      { type: "h2", id: "problems", text: "Troubleshooting" },
      {
        type: "faq",
        items: [
          {
            q: "The wallet says there isn't enough BNB for the network fee?",
            a: "The wallet needs a little BNB for gas. About 0.001 BNB covers several payments.",
          },
          {
            q: "Insufficient balance?",
            a: "The total includes the 0.25% fee. Make sure the wallet holds at least the Total to pay shown on the page.",
          },
          {
            q: "I approved before. Do I need to approve again?",
            a: "Approvals cover a single amount. If an earlier approval is large enough, the page skips straight to the payment.",
          },
        ],
      },
    ],
  },
  {
    slug: "private-wallet",
    group: "Private wallet",
    title: "Built-in private wallet",
    summary: "How the wallet is created, stored, unlocked and restored.",
    icon: "lock",
    blocks: [
      {
        type: "p",
        text: "Every merchant has a RAILGUN private wallet where customer payments arrive. It runs entirely in your browser: keys are generated, encrypted and stored on your computer, and our server never touches them.",
      },
      { type: "h2", id: "how", text: "Where the wallet lives" },
      {
        type: "list",
        items: [
          "The wallet runs in a background thread of the browser, isolated from the page.",
          "Its data is encrypted with your password and stored in this browser's local storage (IndexedDB).",
          "The encryption key is derived from your password with PBKDF2-SHA256 (600,000 iterations and a random per-wallet salt).",
          "The recovery phrase and password never leave your browser and are never sent to our server.",
        ],
      },
      { type: "h2", id: "unlock", text: "Unlocking and locking" },
      {
        type: "p",
        text: "In each new browser tab, the Funds page asks for your wallet password. The wallet stays unlocked only in that tab; closing it or clicking Lock requires the password again. Receiving payments never needs unlocking, only viewing the balance and withdrawing.",
      },
      { type: "h2", id: "sync", text: "Syncing" },
      {
        type: "p",
        text: "After unlocking, the wallet syncs private records from the chain. The first sync on a computer downloads the full record and can take a minute or two; later syncs only fetch what's new and usually take seconds.",
      },
      { type: "h2", id: "devices", text: "New computer or cleared browser" },
      {
        type: "steps",
        items: [
          {
            title: "Sign in",
            text: "Sign in with the same browser wallet and open Funds.",
          },
          {
            title: "Enter the recovery phrase",
            text: "The page offers to restore your private wallet on this device. Enter the 12 words and choose a wallet password for this device.",
          },
          {
            title: "Automatic check",
            text: "The phrase must reproduce your account's receiving address; otherwise it's rejected, so you can't restore the wrong wallet.",
          },
        ],
      },
      {
        type: "callout",
        tone: "info",
        title: "Already using Railway?",
        text: "If you already have a RAILGUN wallet such as Railway, choose Existing RAILGUN address at sign-up and paste your 0zk address. You manage balance and withdrawals in your own wallet; we handle invoicing and payment confirmation. You can also import the same recovery phrase into Railway to view your funds.",
      },
      { type: "h2", id: "remove", text: "Removing the wallet from a device" },
      {
        type: "p",
        text: "At the bottom of Funds you can remove the private wallet from this device. This deletes local data only; funds on-chain are untouched and you can restore with the phrase at any time. Do this after using a shared computer.",
      },
    ],
  },
  {
    slug: "payment-confirmation",
    group: "Payments",
    title: "Payment confirmation",
    summary: "How payments are confirmed and what each status means.",
    icon: "check",
    blocks: [
      {
        type: "p",
        text: "There's nothing to reconcile by hand. The server prepares each invoice's payment transaction in advance; once it lands, the server checks it on-chain and marks the invoice paid only if everything matches.",
      },
      { type: "h2", id: "checks", text: "What is checked" },
      {
        type: "list",
        items: [
          "The transaction succeeded and contains a Shield event from the RAILGUN contract.",
          "The funds go to your private wallet: the note key derives from your address and the encrypted data matches what was issued, so your wallet can decrypt and find it.",
          "The token is correct (Binance-Peg USDT or USDC).",
          "The amount received after the fee equals the invoice amount exactly, to the smallest unit.",
          "The block is finalized on BNB Chain (about two seconds behind the tip), so a chain reorganisation can't undo it.",
        ],
      },
      { type: "h2", id: "statuses", text: "Invoice statuses" },
      {
        type: "table",
        head: ["Status", "Meaning"],
        rows: [
          [
            "Awaiting payment",
            "The invoice exists and is waiting for the customer.",
          ],
          [
            "To reconcile / Confirming",
            "The customer submitted a payment; it's waiting for finality, usually seconds.",
          ],
          ["Paid", "All checks passed and a receipt was issued."],
          [
            "Needs review",
            "Funds arrived on-chain but don't fully match the invoice (for example the amount). You decide what to do.",
          ],
          [
            "Expired",
            "The due date passed without payment; it can no longer be paid.",
          ],
          ["Cancelled", "You cancelled the invoice."],
        ],
      },
      { type: "h2", id: "receipts", text: "Receipts" },
      {
        type: "p",
        text: "Every paid invoice has a receipt with the amount, payment time and on-chain transaction hash, signed with Ed25519. Customers can download the signed JSON for records or verification. Receipt links are public: anyone with the link sees the amount and description.",
      },
      { type: "h2", id: "duplicate", text: "Duplicate payments" },
      {
        type: "p",
        text: "If an invoice is paid twice (say two people pay at once), the first payment marks it paid. The second still reaches your private wallet and is recorded as a duplicate so you can refund it.",
      },
    ],
  },
  {
    slug: "withdrawals",
    group: "Payments",
    title: "Withdrawals and compliance",
    summary: "Why new funds wait, and how to withdraw.",
    icon: "download",
    blocks: [
      {
        type: "p",
        text: "Received funds sit in your private wallet. You can withdraw them to any public address at any time, such as an exchange deposit address or another wallet of yours.",
      },
      { type: "h2", id: "poi", text: "Why funds show as pending" },
      {
        type: "p",
        text: "RAILGUN requires every deposit into the privacy pool to pass a Private POI (Proof of Innocence) check confirming it doesn't come from known stolen or sanctioned addresses. Until then, funds show as pending and can't be moved. The protocol sets the waiting time; every RAILGUN wallet works this way, and we never skip or bypass it.",
      },
      {
        type: "callout",
        tone: "info",
        title: "Paid and spendable are different",
        text: "An invoice turns Paid seconds after payment, which means the funds really are in your private wallet. Pending only affects when you can move them out.",
      },
      { type: "h2", id: "how", text: "Withdrawing" },
      {
        type: "steps",
        items: [
          {
            title: "Unlock the wallet",
            text: "Open Funds, enter your wallet password and wait for the sync.",
          },
          {
            title: "Enter amount and address",
            text: "Enter an amount (or click All) and a destination. Leave it empty to withdraw to the connected wallet.",
          },
          {
            title: "Generate the proof",
            text: "Click Withdraw. Your browser generates a zero-knowledge proof locally; the first time it downloads the proving files, which can take a minute or two.",
          },
          {
            title: "Confirm in your wallet",
            text: "Your connected wallet then asks to confirm the transaction and pays the BNB network fee.",
          },
        ],
      },
      { type: "h2", id: "privacy", text: "What a withdrawal reveals" },
      {
        type: "p",
        text: "A withdrawal makes the destination and amount public on-chain, and the sending wallet is visible too. For better privacy, withdraw to a fresh dedicated address and avoid amounts and timing that mirror a specific invoice.",
      },
    ],
  },
  {
    slug: "fees",
    group: "Payments",
    title: "Fees",
    summary: "Who pays what, and how much.",
    icon: "invoice",
    blocks: [
      {
        type: "p",
        text: "Private Invoice charges nothing. All fees come from the RAILGUN protocol and BNB Chain, and they're shown before any payment or withdrawal.",
      },
      {
        type: "table",
        head: ["Fee", "Paid by", "Amount"],
        rows: [
          ["Application fee", "—", "0"],
          [
            "RAILGUN deposit fee",
            "Customer, when paying",
            "0.25%, included in Total to pay",
          ],
          [
            "RAILGUN withdrawal fee",
            "Merchant, when withdrawing",
            "0.25% of the amount withdrawn",
          ],
          [
            "Network fee (payment)",
            "Customer",
            "Approval + payment, usually a few cents of BNB",
          ],
          [
            "Network fee (withdrawal)",
            "Merchant",
            "One transaction, paid in BNB by the connected wallet",
          ],
        ],
      },
      { type: "h2", id: "example", text: "Example" },
      {
        type: "p",
        text: "For a 1,000 USDT invoice the customer pays about 1,002.51 USDT and your private wallet receives exactly 1,000 USDT. Withdrawing all of it delivers about 997.50 USDT.",
      },
      {
        type: "callout",
        tone: "info",
        text: "RAILGUN governance sets the fee rate, currently 0.25%. The checkout reads it live from the chain.",
      },
    ],
  },
  {
    slug: "privacy",
    group: "Security & privacy",
    title: "Privacy model",
    summary: "What is public and what isn't.",
    icon: "shield",
    blocks: [
      {
        type: "p",
        text: "Private Invoice protects your everyday business wallet: getting paid doesn't reveal your public wallet, private balance or where funds go next. It isn't an anonymity tool. Here is what each party can see.",
      },
      {
        type: "table",
        head: ["Information", "Public on-chain", "Our server"],
        rows: [
          ["Customer's paying address", "Yes", "Yes"],
          ["Token, amount, time", "Yes", "Yes"],
          ["That the payment entered RAILGUN", "Yes", "Yes"],
          ["Your everyday business wallet", "No", "Yes (you sign in with it)"],
          ["Your private balance", "No", "No"],
          ["Where you send funds next", "No", "No"],
          ["Invoice contents and customer name", "No", "Yes"],
          ["Recovery phrase, wallet password", "No", "No"],
        ],
      },
      { type: "h2", id: "payer", text: "What the payer can learn" },
      {
        type: "p",
        text: "The payment uses your private receiving address, so technically the payer can learn that 0zk address. It doesn't let them see your balance, other payments or where funds go, nor link it to your public wallet.",
      },
      { type: "h2", id: "server", text: "What our server knows" },
      {
        type: "p",
        text: "The server stores your business name, sign-in wallet, private receiving address, invoices and payment transaction hashes to issue invoices and confirm payments. It has neither your viewing key nor your spending key, so it can't see your private balance or history.",
      },
      { type: "h2", id: "receipts", text: "Receipts and withdrawals" },
      {
        type: "list",
        items: [
          "Receipt links are public: anyone with the link sees the amount and description.",
          "A receipt's transaction hash reveals the payer's address in a block explorer.",
          "Withdrawing to a public address reveals the destination and amount.",
        ],
      },
    ],
  },
  {
    slug: "security",
    group: "Security & privacy",
    title: "Security tips",
    summary: "Keep your wallet and funds safe.",
    icon: "lock",
    blocks: [
      { type: "h2", id: "phrase", text: "Recovery phrase" },
      {
        type: "list",
        items: [
          "Write it on paper and keep it safe. Never screenshot, photograph or store it in chats or cloud notes.",
          "Anyone asking for your phrase, including people claiming to be support, is a scammer. We will never ask for your phrase or password.",
          "Consider keeping two copies in different places.",
        ],
      },
      { type: "h2", id: "password", text: "Wallet password" },
      {
        type: "list",
        items: [
          "At least 10 characters, not reused from another site.",
          "It only protects the wallet on this device. If you forget it, remove the wallet and restore from the phrase with a new password.",
        ],
      },
      { type: "h2", id: "phishing", text: "Phishing" },
      {
        type: "list",
        items: [
          "Check that the address is privateinvoice.space and the browser shows the padlock.",
          "The sign-in message your wallet shows includes the site address; check it before signing.",
          "Payments only ever request an approval for the exact amount. Reject any unlimited approval.",
        ],
      },
      { type: "h2", id: "device", text: "Devices" },
      {
        type: "list",
        items: [
          "Manage funds on your own computer and click Lock when you're done.",
          "After using a shared computer, remove the private wallet from that device.",
        ],
      },
    ],
  },
  {
    slug: "networks",
    group: "Reference",
    title: "Networks and tokens",
    summary: "Supported chain, tokens and contract addresses.",
    icon: "link",
    blocks: [
      {
        type: "p",
        text: "Two stablecoins on BNB Chain (chain ID 56) are supported, both with 18 decimals.",
      },
      {
        type: "table",
        head: ["Token", "Contract"],
        rows: [
          ["Binance-Peg USDT", "`0x55d398326f99059fF775485246999027B3197955`"],
          ["Binance-Peg USDC", "`0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d`"],
        ],
      },
      {
        type: "callout",
        tone: "warning",
        text: "USDC on BNB Chain is the Binance-Peg version, not USDC issued natively by Circle.",
      },
      { type: "h2", id: "railgun", text: "RAILGUN contract" },
      {
        type: "table",
        head: ["Name", "Address"],
        rows: [
          [
            "RAILGUN proxy (V2)",
            "`0x590162bf4b50f6576a459b75309ee21d92178a10`",
          ],
        ],
      },
      {
        type: "p",
        text: "This proxy is what your wallet is asked to approve when paying. Check the address in the wallet's confirmation screen.",
      },
    ],
  },
  {
    slug: "faq",
    group: "Reference",
    title: "FAQ",
    summary: "Common questions about payments, the wallet and privacy.",
    icon: "info",
    blocks: [
      {
        type: "faq",
        items: [
          {
            q: "Do I need Railway or another app?",
            a: "No. The private wallet is built into the site, so receiving, checking your balance and withdrawing all happen in the browser. Merchants already using Railway can paste their own 0zk address instead.",
          },
          {
            q: "Can you move my money?",
            a: "No. Wallet keys exist only in your browser; the server has no key that can move funds. That also means we can't recover your wallet if you lose the phrase.",
          },
          {
            q: "How fast are payments confirmed?",
            a: "Usually within seconds of the transaction landing. If the customer closes the page, the payment is still found from on-chain records within about a minute.",
          },
          {
            q: "Why can't I withdraw funds that already arrived?",
            a: "RAILGUN requires new deposits to pass the Private POI compliance check first; until then they show as pending. See [Withdrawals and compliance](/docs/withdrawals).",
          },
          {
            q: "What if a customer pays the wrong amount?",
            a: "A mismatched payment isn't marked paid automatically. The invoice goes to Needs review and the funds stay in your private wallet, so you can sort it out with the customer.",
          },
          {
            q: "Which tokens and networks are supported?",
            a: "USDT and USDC on BNB Chain. See [Networks and tokens](/docs/networks).",
          },
          {
            q: "Can I use more than one computer?",
            a: "Yes. Sign in on the new computer and restore the private wallet with your phrase; it's checked against your receiving address.",
          },
          {
            q: "Is this an anonymity tool?",
            a: "No. It protects your business wallet and where your funds go; the customer's payment itself is still visible on-chain. See [Privacy model](/docs/privacy).",
          },
        ],
      },
    ],
  },
];
