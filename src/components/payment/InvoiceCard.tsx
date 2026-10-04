"use client";
import { useI18n } from "@/i18n/I18nProvider";

// The customer-facing invoice surface, shared by checkout, the builder preview and the landing page.
export function InvoiceCard({
  merchantName,
  description,
  amount,
  token,
  invoiceNumber,
  due,
  badge,
  rows = [],
  children,
}: {
  merchantName: string;
  description: string;
  amount: string;
  token: string;
  invoiceNumber?: string;
  due?: string;
  badge?: React.ReactNode;
  rows?: [string, React.ReactNode][];
  children?: React.ReactNode;
}) {
  const { t } = useI18n();
  const [whole, fraction] = amount.split(".");
  return (
    <article className="invoice-card">
      <header className="invoice-card-head">
        <span className="avatar large">
          {merchantName.trim().charAt(0).toUpperCase() || "?"}
        </span>
        <div>
          <strong>{merchantName}</strong>
          <small>{t("向你发起付款请求")}</small>
        </div>
        {badge}
      </header>
      <div className="invoice-card-amount">
        <span className="amount-figure">
          {whole}
          {fraction !== undefined && <span>.{fraction}</span>}
        </span>
        <span className="amount-token">{token}</span>
      </div>
      <h2 className="invoice-card-title">{description}</h2>
      <dl className="detail-list">
        {invoiceNumber && (
          <div>
            <dt>{t("账单编号")}</dt>
            <dd className="mono">{invoiceNumber}</dd>
          </div>
        )}
        {due && (
          <div>
            <dt>{t("付款截止")}</dt>
            <dd>{due}</dd>
          </div>
        )}
        <div>
          <dt>{t("付款网络")}</dt>
          <dd>BNB Chain · Binance-Peg {token}</dd>
        </div>
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      {children && <div className="invoice-card-actions">{children}</div>}
    </article>
  );
}
