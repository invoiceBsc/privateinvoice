import { signReceipt } from "@/lib/crypto";
import type { Prisma } from "@prisma/client";

/** Signs and stores the receipt for a settled payment. Callers run inside the settling transaction. */
export async function issueReceipt(
  tx: Prisma.TransactionClient,
  input: {
    attemptId: string;
    invoiceId: string;
    amountAtomic: string;
    tokenAddress: string;
    txHash: string | null;
    paidAt: Date;
    provider: "mock" | "railgun";
    extra?: Record<string, unknown>;
  },
) {
  const payload = {
    version: 1,
    invoiceId: input.invoiceId,
    amountAtomic: input.amountAtomic,
    tokenAddress: input.tokenAddress,
    chainId: 56,
    paymentTxHash: input.txHash,
    paidAt: input.paidAt.toISOString(),
    status: "PAID",
    provider: input.provider,
    ...input.extra,
  };
  const signed = signReceipt(payload);
  return tx.receipt.create({
    data: {
      invoiceId: input.invoiceId,
      paymentAttemptId: input.attemptId,
      receiptNumber: "RCPT-" + crypto.randomUUID().slice(0, 8).toUpperCase(),
      payload: payload as Prisma.InputJsonValue,
      ...signed,
    },
  });
}
