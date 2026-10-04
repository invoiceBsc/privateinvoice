import { db } from "@/lib/db";
import { ApiError, requireMerchant } from "@/server/auth/session";
import { isExpired } from "./state";
export async function ownedInvoice(id: string) {
  const merchant = await requireMerchant();
  const invoice = await db.invoice.findFirst({
    where: { id, merchantId: merchant.id },
    include: { attempts: { orderBy: { createdAt: "desc" } }, receipts: true },
  });
  if (!invoice) throw new ApiError(404, "Invoice not found");
  return invoice;
}
export async function expireInvoices() {
  await db.invoice.updateMany({
    where: { status: "PENDING", expiresAt: { lte: new Date() } },
    data: { status: "EXPIRED" },
  });
}
export function requirePayable(invoice: { status: string; expiresAt: Date }) {
  if (invoice.status !== "PENDING" || isExpired(invoice.expiresAt))
    throw new ApiError(409, "Invoice is not payable");
}
export function publicInvoice(invoice: {
  id: string;
  publicSlug: string;
  invoiceNumber: string;
  tokenSymbol: string;
  tokenAddress: string;
  amountAtomic: string;
  decimals: number;
  description: string;
  status: string;
  expiresAt: Date;
  paidAt: Date | null;
  merchant: { displayName: string };
}) {
  return {
    id: invoice.id,
    publicSlug: invoice.publicSlug,
    invoiceNumber: invoice.invoiceNumber,
    tokenSymbol: invoice.tokenSymbol,
    tokenAddress: invoice.tokenAddress,
    amountAtomic: invoice.amountAtomic,
    decimals: invoice.decimals,
    description: invoice.description,
    status: invoice.status,
    expiresAt: invoice.expiresAt,
    paidAt: invoice.paidAt,
    merchantName: invoice.merchant.displayName,
    provider: process.env.PRIVACY_PROVIDER ?? "mock",
  };
}
