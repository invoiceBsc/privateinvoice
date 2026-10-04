import type { Prisma } from "@prisma/client";
import { TOKENS } from "@/config/tokens";
export async function mockBalances(
  tx: Prisma.TransactionClient,
  merchantId: string,
) {
  const payments = await tx.paymentAttempt.findMany({
    where: {
      invoice: { merchantId, status: "PAID" },
      status: "PRIVATE_NOTE_DETECTED",
    },
    select: { tokenAddress: true, amountAtomic: true, balanceState: true },
  });
  const withdrawals = await tx.mockWithdrawal.findMany({
    where: { merchantId },
    select: { tokenAddress: true, amountAtomic: true },
  });
  return Object.values(TOKENS).map((t) => {
    const amounts = { spendable: 0n, pending: 0n, blocked: 0n };
    for (const p of payments.filter(
      (p) => p.tokenAddress === t.address.toLowerCase(),
    )) {
      if (p.balanceState === "spendable")
        amounts.spendable += BigInt(p.amountAtomic);
      else if (p.balanceState === "blocked")
        amounts.blocked += BigInt(p.amountAtomic);
      else amounts.pending += BigInt(p.amountAtomic);
    }
    for (const w of withdrawals.filter(
      (w) => w.tokenAddress === t.address.toLowerCase(),
    ))
      amounts.spendable -= BigInt(w.amountAtomic);
    return {
      tokenSymbol: t.symbol,
      tokenAddress: t.address.toLowerCase(),
      spendable: amounts.spendable.toString(),
      pending: amounts.pending.toString(),
      blocked: amounts.blocked.toString(),
    };
  });
}
