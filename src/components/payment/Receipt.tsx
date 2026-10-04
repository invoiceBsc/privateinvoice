"use client";
import { useI18n } from "@/i18n/I18nProvider";
import { useEffect, useState } from "react";
import { api, amountDisplay } from "@/lib/client";
import { Icon } from "@/components/ui/Icon";
interface ReceiptData {
  id: string;
  receiptNumber: string;
  issuedAt: string;
  payload: {
    amountAtomic: string;
    paymentTxHash: string;
    paidAt: string;
    status: string;
    provider: string;
  };
  payloadHash: string;
  signature: string;
  publicKey: string;
  signatureAlgorithm: string;
  invoice: {
    invoiceNumber: string;
    description: string;
    tokenSymbol: string;
    decimals: number;
  };
}
export function Receipt({ id }: { id: string }) {
  const { t, formatDate } = useI18n();
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    api<ReceiptData>("receipts/" + id)
      .then(setReceipt)
      .catch((e) => setError(e.message));
  }, [id]);
  if (!receipt)
    return (
      <main className="checkout">
        {error ? (
          <div className="card checkout-missing">
            <h1>{t("找不到收据")}</h1>
            <p className="muted">{t(error)}</p>
          </div>
        ) : (
          <div className="checkout-skeleton" aria-busy="true">
            <span className="sr-only">{t("正在加载收据…")}</span>
            <div className="skeleton" />
          </div>
        )}
      </main>
    );
  const real = receipt.payload.provider === "railgun";
  function download() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(receipt, null, 2)], {
        type: "application/json",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = receipt!.receiptNumber + ".json";
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <main className="receipt-page">
      <div className="receipt-toolbar">
        <button
          className="button secondary small"
          onClick={() => window.print()}
        >
          <Icon name="print" />
          {t("打印收据")}
        </button>
        <button className="button secondary small" onClick={download}>
          <Icon name="download" />
          {t("下载签名收据")}
        </button>
      </div>
      <article className="receipt">
        <header className="receipt-head">
          <div>
            <span className="eyebrow">{t("付款收据")}</span>
            <span className="mono muted">{receipt.receiptNumber}</span>
          </div>
          <span className="badge success">{t("已付款")}</span>
        </header>
        <div className="receipt-amount">
          {amountDisplay(
            receipt.payload.amountAtomic,
            receipt.invoice.decimals,
          )}
          <small>{receipt.invoice.tokenSymbol}</small>
        </div>
        <p className="receipt-desc">{receipt.invoice.description}</p>
        {/* Real receipts point at a verifiable BNB Chain transaction. */}
        <dl className="detail-list">
          {[
            [t("账单编号"), receipt.invoice.invoiceNumber],
            [t("付款时间"), formatDate(receipt.payload.paidAt, true)],
            [t("付款网络"), "BNB Chain"],
            ...(real ? [] : [[t("余额状态"), t("待解锁")]]),
          ].map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
        {real ? (
          <p className="muted small-text">
            {t(
              "款项已在 BNB Chain 上确认并进入商家的隐私收款地址。分享收据将公开账单金额和内容。",
            )}
          </p>
        ) : (
          <div className="mock-note">
            <Icon name="info" size={14} />
            {t(
              "这是一份模拟付款收据，不代表真实链上到账。分享收据将公开账单金额和内容。",
            )}
          </div>
        )}
        <section className="verify">
          <h2>{t("验证信息")}</h2>
          <div className="verify-row">
            <span>{real ? t("链上交易") : t("模拟交易")}</span>
            {real ? (
              <a
                className="verify-link"
                href={"https://bscscan.com/tx/" + receipt.payload.paymentTxHash}
                target="_blank"
                rel="noopener noreferrer"
              >
                <code>{receipt.payload.paymentTxHash}</code>
              </a>
            ) : (
              <code>{receipt.payload.paymentTxHash}</code>
            )}
          </div>
          <div className="verify-row">
            <span>{t("收据校验摘要")}</span>
            <code>{receipt.payloadHash}</code>
          </div>
          <p className="muted small-text">
            {t("收据已通过 Ed25519 签名，下载文件中包含验证公钥。")}
          </p>
        </section>
      </article>
    </main>
  );
}
