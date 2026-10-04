import { translate, type Locale } from "@/i18n/messages";
export async function api<T>(
  path: string,
  body?: unknown,
  method?: string,
): Promise<T> {
  const response = await fetch("/api/" + path, {
    method: method ?? (body === undefined ? "GET" : "POST"),
    headers: body === undefined ? {} : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "Request failed");
  return data as T;
}
export function amountDisplay(atomic: string, decimals = 18) {
  const value = BigInt(atomic),
    base = 10n ** BigInt(decimals);
  const whole = (value / base).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  // Keep exact precision but always show at least cents: 1250.5 → 1,250.50.
  const fractional = (value % base)
    .toString()
    .padStart(decimals, "0")
    .replace(/0+$/, "")
    .padEnd(2, "0");
  return whole + "." + fractional;
}
/** Rounds up to `places` decimals for display; `exact` is false when precision was dropped. */
export function amountRoundUp(atomic: string, decimals = 18, places = 2) {
  const unit = 10n ** BigInt(decimals - places);
  const value = BigInt(atomic);
  const rounded = ((value + unit - 1n) / unit) * unit;
  return {
    text: amountDisplay(rounded.toString(), decimals),
    exact: rounded === value,
  };
}
export function sumAtomic(values: string[]) {
  return values.reduce((total, value) => total + BigInt(value), 0n).toString();
}
export interface InvoiceView {
  id: string;
  publicSlug: string;
  invoiceNumber: string;
  amountAtomic: string;
  decimals: number;
  tokenSymbol: "USDT" | "USDC";
  tokenAddress: string;
  description: string;
  customerLabel?: string;
  status: string;
  expiresAt: string;
  createdAt?: string;
  paidAt: string | null;
  merchantName?: string;
  provider?: string;
  receiptId?: string | null;
  receipts?: { id: string }[];
  paymentTxHash?: string | null;
  quote?: { feeBps: number; grossAtomic: string; feeAtomic: string } | null;
  attempts?: { id: string; status: string; txHash: string | null }[];
}

export function statusLabel(status: string, locale: Locale = "en"): string {
  const labels: Record<string, string> = {
    PENDING: "待付款",
    PAYMENT_SUBMITTED: "待对账",
    CONFIRMING: "确认中",
    PAID: "已付款",
    EXPIRED: "已过期",
    CANCELLED: "已取消",
    REVIEW_REQUIRED: "待审核",
  };
  return translate(labels[status] ?? status, locale);
}

// Clipboard API needs HTTPS. Preserve copy interactions on the public HTTP preview.
export async function copyText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      /* Continue with the user-initiated compatibility path. */
    }
  }
  const field = document.createElement("textarea");
  field.value = text;
  field.readOnly = true;
  field.style.position = "fixed";
  field.style.opacity = "0";
  field.style.pointerEvents = "none";
  const focus = document.activeElement;
  document.body.appendChild(field);
  field.select();
  try {
    if (!document.execCommand("copy")) throw new Error("Clipboard unavailable");
  } finally {
    field.remove();
    if (focus instanceof HTMLElement) focus.focus({ preventScroll: true });
  }
}
