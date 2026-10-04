"use client";
import { useI18n } from "@/i18n/I18nProvider";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api, copyText, amountDisplay, type InvoiceView } from "@/lib/client";
import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";

const ORDER = ["PENDING", "PAYMENT_SUBMITTED", "PAID"];

export function InvoiceDetail({ id }: { id: string }) {
  const { t, formatDate } = useI18n();
  const [invoice, setInvoice] = useState<InvoiceView | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    api<InvoiceView>("invoices/" + id)
      .then(setInvoice)
      .catch((e) => setError(e.message));
  }, [id]);
  const back = (
    <Link className="back-link" href="/dashboard">
      <Icon name="arrowLeft" size={14} />
      {t("返回账单")}
    </Link>
  );
  if (!invoice)
    return (
      <main className="container">
        {back}
        {error ? (
          <p className="error-banner" role="alert">
            {t(error)}
          </p>
        ) : (
          <div className="detail-skeleton" aria-busy="true">
            <span className="sr-only">{t("正在加载账单…")}</span>
            <div className="skeleton" />
          </div>
        )}
      </main>
    );
  const link =
    typeof window === "undefined"
      ? ""
      : location.origin + "/i/" + invoice.publicSlug;
  const reached = ORDER.indexOf(
    invoice.status === "CONFIRMING" ? "PAYMENT_SUBMITTED" : invoice.status,
  );
  const closed = invoice.status === "CANCELLED" || invoice.status === "EXPIRED";
  const receiptId = invoice.receipts?.[0]?.id;
  const steps = [
    {
      label: t("账单已创建"),
      detail: invoice.createdAt ? formatDate(invoice.createdAt, true) : "",
      done: true,
    },
    {
      label: t("客户已付款"),
      detail: reached >= 1 ? t("等待商家对账") : t("等待客户付款"),
      done: reached >= 1,
    },
    {
      label: t("对账完成并生成收据"),
      detail:
        invoice.status === "PAID" && invoice.paidAt
          ? formatDate(invoice.paidAt, true)
          : "",
      done: invoice.status === "PAID",
    },
  ];
  async function copy() {
    try {
      await copyText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(t("请从上方输入框手动复制链接。"));
    }
  }
  return (
    <main className="container">
      {back}
      <header className="page-header">
        <div>
          <div className="title-row">
            <h1>{invoice.description}</h1>
            <StatusBadge status={invoice.status} />
          </div>
          <p className="muted mono">{invoice.invoiceNumber}</p>
        </div>
        <div className="page-actions">
          {receiptId && (
            <Link className="button secondary" href={"/receipt/" + receiptId}>
              {t("查看收据")}
            </Link>
          )}
          <Link className="button secondary" href={"/i/" + invoice.publicSlug}>
            {t("打开付款页面 ↗")}
          </Link>
        </div>
      </header>
      <div className="detail-grid">
        <section className="card">
          <div className="detail-amount">
            <span className="stat-label">{t("金额")}</span>
            <strong>
              {amountDisplay(invoice.amountAtomic, invoice.decimals)}
              <small>{invoice.tokenSymbol}</small>
            </strong>
          </div>
          <dl className="detail-list">
            <div>
              <dt>{t("客户")}</dt>
              <dd>{invoice.customerLabel || "—"}</dd>
            </div>
            <div>
              <dt>{t("付款网络")}</dt>
              <dd>BNB Chain · Binance-Peg {invoice.tokenSymbol}</dd>
            </div>
            {invoice.createdAt && (
              <div>
                <dt>{t("创建时间")}</dt>
                <dd>{formatDate(invoice.createdAt, true)}</dd>
              </div>
            )}
            <div>
              <dt>{t("付款截止")}</dt>
              <dd>{formatDate(invoice.expiresAt)}</dd>
            </div>
            {invoice.paidAt && (
              <div>
                <dt>{t("付款时间")}</dt>
                <dd>{formatDate(invoice.paidAt, true)}</dd>
              </div>
            )}
          </dl>
        </section>
        <div className="detail-side">
          <section className="card">
            <h2 className="card-title">{t("付款链接")}</h2>
            <p className="muted small-text">
              {t("把链接发给客户，对方无需注册即可付款。")}
            </p>
            <div className="link-field">
              <Icon name="link" size={14} />
              <input
                readOnly
                aria-label={t("付款链接")}
                value={link}
                onFocus={(e) => e.target.select()}
              />
            </div>
            <button
              className={"button block" + (copied ? " copied" : "")}
              onClick={copy}
              disabled={closed}
            >
              <span
                className="copy-swap"
                key={String(copied)}
                aria-hidden="true"
              >
                <Icon name={copied ? "check" : "copy"} />
              </span>
              {copied ? t("已复制 ✓") : t("复制付款链接")}
            </button>
          </section>
          <section className="card">
            <h2 className="card-title">{t("进度")}</h2>
            {closed ? (
              <p className="muted small-text">
                {t("这张账单已关闭，客户无法再付款。")}
              </p>
            ) : (
              <ol className="timeline">
                {steps.map((step, index) => (
                  <li
                    key={step.label}
                    className={
                      step.done
                        ? "done"
                        : steps[index - 1]?.done
                          ? "current"
                          : ""
                    }
                  >
                    <span className="timeline-dot" aria-hidden="true">
                      {step.done && <Icon name="check" size={12} />}
                    </span>
                    <div>
                      <strong>{step.label}</strong>
                      {step.detail && <small>{step.detail}</small>}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </div>
      {error && invoice && (
        <p className="error-banner" role="alert">
          {t(error)}
        </p>
      )}
    </main>
  );
}
