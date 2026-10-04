import type { InvoiceStatus } from "@prisma/client";
const transitions: Record<InvoiceStatus, readonly InvoiceStatus[]> = {
  DRAFT: ["PENDING", "CANCELLED"],
  PENDING: ["PAYMENT_SUBMITTED", "EXPIRED", "CANCELLED"],
  PAYMENT_SUBMITTED: ["CONFIRMING", "PENDING", "REVIEW_REQUIRED", "FAILED"],
  CONFIRMING: ["PAID", "PENDING", "REVIEW_REQUIRED", "FAILED"],
  PAID: [],
  EXPIRED: [],
  CANCELLED: [],
  FAILED: [],
  // A Shield arrived but did not match what was issued; a person resolves it.
  REVIEW_REQUIRED: ["PAID", "CANCELLED"],
};
export function canTransition(from: InvoiceStatus, to: InvoiceStatus) {
  return transitions[from].includes(to);
}
export function requireTransition(from: InvoiceStatus, to: InvoiceStatus) {
  if (!canTransition(from, to)) throw new Error("Illegal invoice transition");
}
export function isExpired(expiresAt: Date, now = new Date()) {
  return expiresAt.getTime() <= now.getTime();
}
