"use client";
import { useI18n } from "@/i18n/I18nProvider";
import { statusLabel } from "@/lib/client";
import { useChangePulse } from "@/components/ui/motion";

const tone: Record<string, string> = {
  PENDING: "warning",
  PAYMENT_SUBMITTED: "info",
  CONFIRMING: "info",
  REVIEW_REQUIRED: "info",
  PAID: "success",
  EXPIRED: "neutral",
  CANCELLED: "neutral",
};

export function StatusBadge({ status }: { status: string }) {
  const { locale } = useI18n();
  // Pops once when the same invoice changes state; never on first render.
  const ref = useChangePulse<HTMLSpanElement>(status);
  return (
    <span ref={ref} className={"badge " + (tone[status] ?? "neutral")}>
      {statusLabel(status, locale)}
    </span>
  );
}
