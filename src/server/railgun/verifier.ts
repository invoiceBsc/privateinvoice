import type { Abi, AbiEvent, Hex } from "viem";
import { ABIRailgunSmartWallet } from "@railgun-community/engine";
import { db } from "@/lib/db";
import { issueReceipt } from "@/server/payments/receipts";
import {
  RAILGUN_PROXY,
  chainClient,
  matchShield,
  shieldCommitments,
} from "./shield";

const SHIELD_EVENT = (ABIRailgunSmartWallet as unknown as Abi).find(
  (item) => item.type === "event" && item.name === "Shield",
) as AbiEvent;
const DROP_AFTER_MS = 30 * 60_000;
const DISCOVERY_WINDOW_MS = 24 * 60 * 60_000;
const LOG_RANGE = 2_000n;

type Attempt = NonNullable<Awaited<ReturnType<typeof loadAttempt>>>;
const loadAttempt = (id: string) =>
  db.paymentAttempt.findUnique({ where: { id }, include: { invoice: true } });

async function fail(attempt: Attempt, code: string, message: string) {
  await db.$transaction(async (tx) => {
    await tx.paymentAttempt.update({
      where: { id: attempt.id },
      data: { status: "FAILED", failureCode: code, failureMessage: message },
    });
    // Nothing reached the merchant: let the customer try again.
    await tx.invoice.updateMany({
      where: {
        id: attempt.invoiceId,
        status: { in: ["PAYMENT_SUBMITTED", "CONFIRMING"] },
      },
      data: { status: "PENDING" },
    });
  });
}

/** Moves one submitted attempt forward based on its transaction receipt. */
export async function settleAttempt(id: string) {
  const attempt = await loadAttempt(id);
  if (!attempt?.txHash || attempt.provider !== "railgun") return;
  if (!["SUBMITTED", "CHAIN_CONFIRMED"].includes(attempt.status)) return;
  const client = chainClient();
  const hash = attempt.txHash as Hex;
  const receipt = await client
    .getTransactionReceipt({ hash })
    .catch(() => null);
  if (!receipt) {
    const known = await client.getTransaction({ hash }).catch(() => null);
    if (!known && Date.now() - attempt.createdAt.getTime() > DROP_AFTER_MS)
      await fail(attempt, "DROPPED", "Transaction was not found on BNB Chain");
    return;
  }
  if (receipt.status !== "success")
    return fail(attempt, "REVERTED", "Transaction reverted on BNB Chain");

  const match = matchShield(
    receipt.logs,
    {
      shieldPublicKey: attempt.shieldPublicKey ?? "",
      notePublicKey: attempt.notePublicKey ?? "",
      encryptedBundle: (attempt.encryptedBundle as string[] | null) ?? [],
      tokenAddress: attempt.tokenAddress,
      netAtomic: attempt.amountAtomic,
    },
    receipt.from,
  );
  if (match.kind === "absent")
    return fail(
      attempt,
      "NOT_THIS_PAYMENT",
      "Transaction does not contain this payment's RAILGUN Shield",
    );
  if (match.kind === "mismatch") {
    // Funds entered RAILGUN but not as issued: a person must look at it.
    await db.$transaction(async (tx) => {
      await tx.paymentAttempt.update({
        where: { id: attempt.id },
        data: {
          status: "FAILED",
          failureCode: match.code,
          failureMessage: match.detail,
          blockNumber: match.blockNumber,
          payerAddress: receipt.from,
        },
      });
      await tx.invoice.updateMany({
        where: { id: attempt.invoiceId, status: { not: "PAID" } },
        data: { status: "REVIEW_REQUIRED" },
      });
    });
    return;
  }

  const finalized = await client.getBlock({ blockTag: "finalized" });
  if (BigInt(match.blockNumber) > finalized.number) {
    await db.$transaction([
      db.paymentAttempt.update({
        where: { id: attempt.id },
        data: {
          status: "CHAIN_CONFIRMED",
          blockNumber: match.blockNumber,
          payerAddress: receipt.from,
        },
      }),
      db.invoice.updateMany({
        where: {
          id: attempt.invoiceId,
          status: { in: ["PENDING", "PAYMENT_SUBMITTED", "EXPIRED"] },
        },
        data: { status: "CONFIRMING" },
      }),
    ]);
    return;
  }

  await db.$transaction(
    async (tx) => {
      const paidAt = new Date();
      const claimed = await tx.invoice.updateMany({
        where: { id: attempt.invoiceId, status: { not: "PAID" } },
        data: { status: "PAID", paidAt },
      });
      await tx.paymentAttempt.update({
        where: { id: attempt.id },
        data: {
          status: "PRIVATE_NOTE_DETECTED",
          confirmedAt: paidAt,
          blockNumber: match.blockNumber,
          payerAddress: receipt.from,
          balanceState: "pending",
          // A second valid payment for an already-paid invoice is kept for refund review.
          ...(claimed.count === 1
            ? {}
            : {
                failureCode: "DUPLICATE_PAYMENT",
                failureMessage: "Invoice was already paid by another payment",
              }),
        },
      });
      if (claimed.count === 1)
        await issueReceipt(tx, {
          attemptId: attempt.id,
          invoiceId: attempt.invoiceId,
          amountAtomic: attempt.amountAtomic,
          tokenAddress: attempt.tokenAddress,
          txHash: hash,
          paidAt,
          provider: "railgun",
          extra: {
            blockNumber: match.blockNumber,
            grossAtomic: attempt.grossAtomic,
          },
        });
    },
    { isolationLevel: "Serializable" },
  );
}

let cursor: bigint | null = null;
const SQUID_URL =
  process.env.RAILGUN_SQUID_URL ??
  "https://rail-squid.squids.live/squid-railgun-bsc-v2/graphql";

interface FoundShield {
  shieldKey: string;
  transactionHash: Hex;
  blockNumber: bigint;
}

/**
 * Shield commitments from `from` onwards, oldest first. RAILGUN's official BNB indexer (the same
 * one the wallet SDK quick-syncs from) works with free RPCs, which refuse eth_getLogs;
 * RAILGUN_DISCOVERY=logs reads chain logs instead (needed on a local fork).
 */
async function shieldsSince(
  from: bigint,
  head: bigint,
): Promise<{ found: FoundShield[]; next: bigint }> {
  if (process.env.RAILGUN_DISCOVERY === "logs") {
    const to = from + LOG_RANGE - 1n < head ? from + LOG_RANGE - 1n : head;
    const logs = await chainClient().getLogs({
      address: RAILGUN_PROXY,
      event: SHIELD_EVENT,
      fromBlock: from,
      toBlock: to,
    });
    const found = shieldCommitments(logs as never).flatMap((event) =>
      event.args.shieldCiphertext.map((c) => ({
        shieldKey: c.shieldKey.toLowerCase(),
        transactionHash: event.transactionHash,
        blockNumber: BigInt(event.blockNumber),
      })),
    );
    return { found, next: to + 1n };
  }
  const response = await fetch(SQUID_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      query: `query($from: BigInt!) { shieldCommitments(where: { blockNumber_gte: $from }, orderBy: blockNumber_ASC, limit: 500) { shieldKey transactionHash blockNumber } }`,
      variables: { from: from.toString() },
    }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error("RAILGUN indexer HTTP " + response.status);
  const body = (await response.json()) as {
    data?: {
      shieldCommitments: {
        shieldKey: string;
        transactionHash: Hex;
        blockNumber: string;
      }[];
    };
    errors?: unknown;
  };
  if (!body.data) throw new Error("RAILGUN indexer query failed");
  const found = body.data.shieldCommitments.map((c) => ({
    shieldKey: c.shieldKey.toLowerCase(),
    transactionHash: c.transactionHash,
    blockNumber: BigInt(c.blockNumber),
  }));
  // A full page may end mid-block; resume at that block so nothing is skipped.
  const next =
    found.length === 500 ? found[found.length - 1].blockNumber : head + 1n;
  return { found, next: next > from ? next : from + 1n };
}

/** Finds Shields whose transaction hash never reached us (the payer closed the page). */
export async function discoverAttempts() {
  const open = await db.paymentAttempt.findMany({
    where: {
      provider: "railgun",
      status: "CREATED",
      txHash: null,
      shieldPublicKey: { not: null },
      createdAt: { gt: new Date(Date.now() - DISCOVERY_WINDOW_MS) },
    },
    select: { id: true, shieldPublicKey: true, createdBlock: true },
  });
  if (!open.length) {
    cursor = null;
    return;
  }
  const head = await chainClient().getBlockNumber();
  const earliest = BigInt(
    Math.min(...open.map((a) => a.createdBlock ?? Number(head))),
  );
  let from = cursor !== null && cursor > earliest ? cursor : earliest;
  const byKey = new Map(open.map((a) => [a.shieldPublicKey!, a.id]));
  while (from <= head) {
    const { found, next } = await shieldsSince(from, head);
    for (const shield of found) {
      const id = byKey.get(shield.shieldKey);
      if (!id) continue;
      const claimed = await db.paymentAttempt.updateMany({
        where: { id, txHash: null },
        data: { txHash: shield.transactionHash, status: "SUBMITTED" },
      });
      if (claimed.count) await settleAttempt(id);
    }
    from = next;
    cursor = from;
  }
}

let running = false;
async function tick() {
  if (running) return;
  running = true;
  try {
    const pending = await db.paymentAttempt.findMany({
      where: {
        provider: "railgun",
        status: { in: ["SUBMITTED", "CHAIN_CONFIRMED"] },
      },
      select: { id: true },
      take: 50,
    });
    for (const { id } of pending) await settleAttempt(id).catch(logError);
    await discoverAttempts().catch(logError);
  } finally {
    running = false;
  }
}
function logError(error: unknown) {
  console.error(
    "[railgun-verifier]",
    error instanceof Error ? error.message : error,
  );
}

const started = Symbol.for("private-invoice.verifier");
export function startVerifier(intervalMs = 4000) {
  const scope = globalThis as unknown as Record<symbol, boolean>;
  if (scope[started]) return;
  scope[started] = true;
  setInterval(() => void tick(), intervalMs).unref();
  void tick();
}
