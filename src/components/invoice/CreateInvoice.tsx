"use client";
import { useI18n } from "@/i18n/I18nProvider";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/client";
import { Icon } from "@/components/ui/Icon";
import { useMerchant, useSession } from "@/components/ui/session";
import { InvoiceCard } from "@/components/payment/InvoiceCard";
import { useSlidingIndicator } from "@/components/ui/motion";

const DAYS = ["1", "7", "30", "90"];

// Formats free-form input for the preview only; the API receives the raw string.
function previewAmount(raw: string) {
  const match = raw.trim().match(/^(\d*)(?:\.(\d*))?$/);
  if (!match || (!match[1] && !match[2])) return "0.00";
  const whole = (match[1] || "0")
    .replace(/^0+(?=\d)/, "")
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return whole + "." + (match[2] ?? "").padEnd(2, "0");
}

export function CreateInvoice() {
  const { t, formatDate } = useI18n();
  const { merchant } = useMerchant();
  const real = useSession().account?.provider === "railgun";
  const [amount, setAmount] = useState("");
  const [token, setToken] = useState("USDT");
  const [description, setDescription] = useState("");
  const [customer, setCustomer] = useState("");
  const [days, setDays] = useState("7");
  const { containerRef: dueRef, indicatorRef: dueIndicator } =
    useSlidingIndicator<HTMLDivElement>(days);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [createdAt] = useState(() => Date.now());
  const router = useRouter();
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await api<{ id: string }>("invoices", {
        amount,
        tokenSymbol: token,
        description,
        customerLabel: customer,
        expiresInDays: Number(days),
      });
      router.push("/invoice/" + result.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("创建失败，请重试"));
      setBusy(false);
    }
  }
  const dueDate = formatDate(
    new Date(createdAt + Number(days) * 86_400_000).toISOString(),
  );
  return (
    <main className="container">
      <Link className="back-link" href="/dashboard">
        <Icon name="arrowLeft" size={14} />
        {t("返回账单")}
      </Link>
      <header className="page-header">
        <div>
          <h1>{t("创建发票")}</h1>
          <p className="muted">{t("填好账单，生成一个可以分享的付款链接。")}</p>
        </div>
      </header>
      <div className="builder">
        <form className="card form-card" onSubmit={submit}>
          <div className="field">
            <label htmlFor="amount">{t("金额")}</label>
            <div className="amount-input">
              <input
                id="amount"
                required
                inputMode="decimal"
                autoComplete="off"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
              <select
                aria-label={t("币种")}
                value={token}
                onChange={(e) => setToken(e.target.value)}
              >
                <option>USDT</option>
                <option>USDC</option>
              </select>
            </div>
          </div>
          <div className="field">
            <label htmlFor="description">{t("服务内容")}</label>
            <textarea
              id="description"
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              placeholder={t("例如：品牌视觉设计 · 尾款")}
            />
            <span className="hint">{t("客户会在付款页面看到这段说明。")}</span>
          </div>
          <div className="field">
            <label htmlFor="customer">{t("客户名称（仅你可见）")}</label>
            <input
              id="customer"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              maxLength={80}
              placeholder={t("客户或公司名称，可选")}
            />
          </div>
          <div className="field">
            <span className="field-label" id="due-label">
              {t("付款期限")}
            </span>
            <div
              ref={dueRef}
              className="segmented"
              role="radiogroup"
              aria-labelledby="due-label"
            >
              <span
                ref={dueIndicator}
                className="tab-indicator"
                aria-hidden="true"
              />
              {DAYS.map((d) => (
                <button
                  type="button"
                  key={d}
                  role="radio"
                  aria-checked={days === d}
                  data-active={days === d}
                  className={days === d ? "active" : ""}
                  onClick={() => setDays(d)}
                >
                  {t(d + " 天")}
                </button>
              ))}
            </div>
          </div>
          {error && (
            <p className="field-error" role="alert">
              {t(error)}
            </p>
          )}
          <div className="form-footer">
            <span className="form-footnote">
              {real
                ? t("BNB Chain · RAILGUN 隐私收款")
                : t("BNB Chain · 仅模拟付款")}
            </span>
            <button className="button" aria-busy={busy} disabled={busy}>
              {t("创建付款链接 →")}
            </button>
          </div>
        </form>
        <aside className="builder-preview" aria-label={t("客户将看到")}>
          <div className="preview-label">
            <span>{t("客户将看到")}</span>
            <span className="live-dot">{t("实时预览")}</span>
          </div>
          <InvoiceCard
            merchantName={merchant.displayName}
            description={description || t("服务内容")}
            amount={previewAmount(amount)}
            token={token}
            due={dueDate}
          >
            <div className="button block preview-button" aria-hidden="true">
              {real ? t("支付 →") : t("模拟付款 →")}
            </div>
          </InvoiceCard>
          <p className="form-footnote center">
            {t("客户无需注册即可查看账单。")}
          </p>
        </aside>
      </div>
    </main>
  );
}
