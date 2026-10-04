import { db } from "@/lib/db";
import { ApiError } from "@/server/auth/session";
import { issueReceipt } from "./receipts";
import type { z } from "zod";
import type { reconcileInput } from "@/lib/validation";
export async function reconcileMock(
  id: string,
  input: z.infer<typeof reconcileInput>,
  merchantId: string,
) {
  if (process.env.PRIVACY_PROVIDER !== "mock")
    throw new ApiError(503, "Real reconciliation not enabled");
  return db.$transaction(
    async (tx) => {
      const attempt = await tx.paymentAttempt.findFirst({
        where: { id, invoice: { merchantId } },
        include: { invoice: true, receipt: true },
      });
      if (!attempt) throw new ApiError(404, "Payment not found");
      if (attempt.receipt) return attempt.receipt;
      if (
        attempt.txHash !== input.txHash ||
        attempt.tokenAddress.toLowerCase() !== input.tokenAddress ||
        attempt.amountAtomic !== input.amountAtomic ||
        attempt.chainId !== input.chainId ||
        input.noteId !== attempt.providerReference
      )
        throw new ApiError(
          409,
          "Payment requires review: incoming note does not match",
        );
      if (
        attempt.status !== "CHAIN_CONFIRMED" ||
        attempt.invoice.status !== "CONFIRMING"
      )
        throw new ApiError(409, "Payment has not been confirmed");
      const paidAt = new Date();
      const changed = await tx.invoice.updateMany({
        where: { id: attempt.invoiceId, status: "CONFIRMING" },
        data: { status: "PAID", paidAt },
      });
      if (changed.count !== 1)
        throw new ApiError(409, "Invoice already reconciled");
      await tx.paymentAttempt.update({
        where: { id },
        data: { status: "PRIVATE_NOTE_DETECTED", confirmedAt: paidAt },
      });
      return issueReceipt(tx, {
        attemptId: id,
        invoiceId: attempt.invoiceId,
        amountAtomic: attempt.amountAtomic,
        tokenAddress: attempt.tokenAddress,
        txHash: attempt.txHash,
        paidAt,
        provider: "mock",
      });
    },
    { isolationLevel: "Serializable" },
  );
}
