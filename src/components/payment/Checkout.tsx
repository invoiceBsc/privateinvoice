"use client";
import { useI18n } from "@/i18n/I18nProvider";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { WalletButton } from "@/components/wallet/WalletButton";
import { api, amountDisplay, type InvoiceView } from "@/lib/client";
import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { InvoiceCard } from "@/components/payment/InvoiceCard";
import { RailgunPay } from "@/components/payment/RailgunPay";
import { privacyProvider } from "@/privacy/provider";
export function Checkout({ slug }: { slug: string }) {
  const { t, formatDate } = useI18n();
  const [invoice, setInvoice] = useState<InvoiceView | null>(null);
  const [error, setError] = useState("");
  const [stage, setStage] = useState("");
  const [txHash, setTxHash] = useState("");
  const [busy, setBusy] = useState(false);
  const { address, chainId } = useAccount();
  const load = useCallback(async () => {
    try {
      setInvoice(await api<InvoiceView>("public/invoices/" + slug));
    } catch (e) {
      setError(e instanceof Error ? e.message : t("账单暂不可用"));
    }
  }, [slug, t]);
  const inFlight =
    invoice?.status === "PAYMENT_SUBMITTED" || invoice?.status === "CONFIRMING";
  useEffect(() => {
    const initial = setTimeout(() => void load(), 0);
    const timer = setInterval(() => void load(), inFlight ? 2500 : 8000);
    return () => {
      clearTimeout(initial);
      clearInterval(timer);
    };
  }, [load, inFlight]);
  async function pay() {
    if (!invoice || !address) return;
    setBusy(true);
    setError("");
    try {
      if (chainId !== 56) throw new Error(t("请先切换到 BNB Chain"));
      if (invoice.provider !== "mock") throw new Error(t("真实付款尚未启用"));
      setStage(t("准备模拟付款…"));
      let payment: {
        id: string;
        reference: string;
        capability: string;
        provider: string;
      };
      const storageKey = "invoice-attempt:" + invoice.id;
      const saved = sessionStorage.getItem(storageKey);
      if (saved) payment = JSON.parse(saved);
      else {
        payment = await api("invoices/" + invoice.id + "/payment-attempt", {
          payerAddress: address,
          chainId: 56,
          tokenAddress: invoice.tokenAddress,
          amountAtomic: invoice.amountAtomic,
        });
        sessionStorage.setItem(storageKey, JSON.stringify(payment));
      }
      const prepared = await privacyProvider.preparePublicToPrivatePayment({
        recipient: "mock-recipient",
        chainId: 56,
        tokenAddress: invoice.tokenAddress,
        amountAtomic: invoice.amountAtomic,
        reference: payment.reference,
      });
      setStage(t("提交模拟付款…"));
      const txKey = storageKey + ":tx";
      let hash = sessionStorage.getItem(txKey);
      if (!hash) {
        hash = (
          await privacyProvider.submitPublicToPrivatePayment({ prepared })
        ).txHash;
        sessionStorage.setItem(txKey, hash);
      }
      await api("payments/" + payment.id + "/submitted", {
        capability: payment.capability,
        txHash: hash,
        chainId: 56,
      });
      setTxHash(hash);
      setStage(t("付款已提交，等待商家对账"));
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("付款失败"));
      setStage("");
    } finally {
      setBusy(false);
    }
  }
  if (!invoice)
    return (
      <main className="checkout">
        {error ? (
          <div className="card checkout-missing">
            <h1>{t("账单暂不可用")}</h1>
            <p className="muted">{t(error)}</p>
          </div>
        ) : (
          <div className="checkout-skeleton" aria-busy="true">
            <span className="sr-only">{t("正在加载付款账单…")}</span>
            <div className="skeleton" />
          </div>
        )}
      </main>
    );
  const payable = invoice.status === "PENDING";
  const submitted =
    invoice.status === "PAYMENT_SUBMITTED" || invoice.status === "CONFIRMING";
  const amount = amountDisplay(invoice.amountAtomic, invoice.decimals);
  const real = invoice.provider === "railgun";
  const chainTx = real ? invoice.paymentTxHash : null;
  return (
    <main className="checkout">
      <InvoiceCard
        merchantName={invoice.merchantName ?? ""}
        description={invoice.description}
        amount={amount}
        token={invoice.tokenSymbol}
        invoiceNumber={invoice.invoiceNumber}
        due={formatDate(invoice.expiresAt)}
        badge={<StatusBadge status={invoice.status} />}
        rows={[
          // Real checkout itemises fees in its own breakdown.
          ...(real
            ? []
            : [
                [t("应用手续费"), "0.00 " + invoice.tokenSymbol] as [
                  string,
                  string,
                ],
              ]),
          [t("商家常用钱包"), t("不在此展示")],
        ]}
      >
        {payable && real && (
          <RailgunPay invoice={invoice} onSubmitted={() => void load()} />
        )}
        {payable && !real && (
          <>
            <div className="mock-note">
              <Icon name="info" size={14} />
              {t("这是模拟付款，不会授权代币或转移真实资金。")}
            </div>
            <ol className="pay-steps">
              <li className={address && chainId === 56 ? "done" : "current"}>
                <span className="step-index">
                  {address && chainId === 56 ? (
                    <Icon name="check" size={12} />
                  ) : (
                    1
                  )}
                </span>
                <div className="step-body">
                  <strong>{t("连接钱包")}</strong>
                  <WalletButton />
                </div>
              </li>
              <li className={address && chainId === 56 ? "current" : ""}>
                <span className="step-index">2</span>
                <div className="step-body">
                  <strong>{t("确认付款")}</strong>
                  <button
                    className="button block large"
                    aria-busy={busy}
                    disabled={!address || chainId !== 56 || busy}
                    onClick={pay}
                  >
                    {t("模拟付款 ·") + " " + amount + " " + invoice.tokenSymbol}
                  </button>
                </div>
              </li>
            </ol>
          </>
        )}
        {submitted && (
          <div className="result-panel info enter-up">
            <Icon name="info" />
            <div>
              <strong>{t("付款已提交")}</strong>
              <p>
                {real
                  ? t("正在等待 BNB Chain 最终确认，通常几秒钟。")
                  : t("付款已提交，商家对账后将生成收据。")}
              </p>
            </div>
          </div>
        )}
        {invoice.status === "PAID" && (
          <div className="result-panel success enter-up draw-check">
            <Icon name="check" />
            <div>
              <strong>{t("付款已确认")}</strong>
              <p>
                {real
                  ? t("款项已进入商家的隐私收款地址。")
                  : t("余额待解锁，付款状态与可提现余额分别记录。")}
              </p>
            </div>
          </div>
        )}
        {invoice.status === "REVIEW_REQUIRED" && (
          <div className="result-panel neutral">
            <Icon name="info" />
            <div>
              <strong>{t("付款需要商家核对")}</strong>
              <p>{t("链上收到的付款与账单不完全一致，商家会联系你。")}</p>
            </div>
          </div>
        )}
        {chainTx && (
          <a
            className="tx-line link"
            href={"https://bscscan.com/tx/" + chainTx}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="muted">{t("链上交易")}</span>
            <span className="mono">
              {chainTx.slice(0, 10)}…{chainTx.slice(-8)} ↗
            </span>
          </a>
        )}
        {(invoice.status === "EXPIRED" || invoice.status === "CANCELLED") && (
          <div className="result-panel neutral">
            <Icon name="info" />
            <div>
              <strong>{t("这张账单已关闭，客户无法再付款。")}</strong>
            </div>
          </div>
        )}
        {stage && busy && (
          <p className="muted small-text" role="status">
            {t(stage)}
          </p>
        )}
        {txHash && (
          <p className="tx-line">
            <span className="muted">{t("模拟交易：")}</span>
            <span className="mono">{txHash}</span>
          </p>
        )}
        {invoice.receiptId && (
          <Link
            className="button secondary block"
            href={"/receipt/" + invoice.receiptId}
          >
            {t("查看付款收据 ↗")}
          </Link>
        )}
        {error && (
          <p className="field-error" role="alert">
            {t(error)}
          </p>
        )}
      </InvoiceCard>
      <p className="checkout-foot">
        <Icon name="lock" size={14} />
        <span>
          {t("真实公开钱包付款的付款人、金额和交易记录可能仍公开。")}{" "}
          <Link href="/docs/privacy">{t("查看隐私说明 →")}</Link>
        </span>
      </p>
    </main>
  );
}
