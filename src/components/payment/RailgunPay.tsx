"use client";
import { useI18n } from "@/i18n/I18nProvider";
import { useState } from "react";
import { erc20Abi, publicActions, type Hex } from "viem";
import { useAccount, useWalletClient } from "wagmi";
import {
  api,
  amountDisplay,
  amountRoundUp,
  type InvoiceView,
} from "@/lib/client";
import { Icon } from "@/components/ui/Icon";
import { WalletButton } from "@/components/wallet/WalletButton";

interface Attempt {
  id: string;
  capability: string;
  tokenAddress: Hex;
  netAtomic: string;
  grossAtomic: string;
  feeAtomic: string;
  spender: Hex;
  transaction: { to: Hex; data: Hex };
  payer: string;
  txHash?: Hex;
}
type Phase = "idle" | "preparing" | "approving" | "sending" | "submitting";

// One attempt per invoice and payer survives reloads, so an approval is never wasted.
const storageKey = (invoiceId: string) => "railgun-attempt:" + invoiceId;
function savedAttempt(invoiceId: string, payer: string): Attempt | null {
  try {
    const value = JSON.parse(
      sessionStorage.getItem(storageKey(invoiceId)) ?? "null",
    );
    return value?.payer === payer.toLowerCase() ? value : null;
  } catch {
    return null;
  }
}
const save = (invoiceId: string, attempt: Attempt) => {
  try {
    sessionStorage.setItem(storageKey(invoiceId), JSON.stringify(attempt));
  } catch {
    /* Private mode: the flow still works within this page. */
  }
};

function walletError(error: unknown, t: (s: string) => string) {
  const message = error instanceof Error ? error.message : String(error);
  if (/user (rejected|denied)|rejected the request|4001/i.test(message))
    return t("你在钱包中取消了这一步。");
  if (/insufficient funds|gas/i.test(message))
    return t("BNB 不足以支付网络手续费。");
  return message.length > 160 ? t("钱包请求失败") : message;
}

export function RailgunPay({
  invoice,
  onSubmitted,
}: {
  invoice: InvoiceView;
  onSubmitted: () => void;
}) {
  const { t } = useI18n();
  const { address, chainId } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState("");
  const [approved, setApproved] = useState(false);
  const ready = !!address && chainId === 56 && !!walletClient;
  const gross = invoice.quote?.grossAtomic;
  const symbol = invoice.tokenSymbol;
  // Customers see cents; the wallet pays the exact atomic amount.
  const approx = (atomic: string) => {
    const { text, exact } = amountRoundUp(atomic, invoice.decimals);
    return (exact ? "" : "≈ ") + text;
  };

  async function pay() {
    if (!address || !walletClient) return;
    setError("");
    try {
      const client = walletClient.extend(publicActions);
      setPhase("preparing");
      let attempt = savedAttempt(invoice.id, address);
      if (!attempt) {
        const created = await api<Omit<Attempt, "payer">>(
          "invoices/" + invoice.id + "/payment-attempt",
          { payerAddress: address, chainId: 56 },
        );
        attempt = { ...created, payer: address.toLowerCase() };
        save(invoice.id, attempt);
      }
      const amount = BigInt(attempt.grossAtomic);
      const balance = await client.readContract({
        address: attempt.tokenAddress,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [address],
      });
      if (balance < amount)
        throw new Error(
          t("余额不足：需要") +
            " " +
            amountDisplay(attempt.grossAtomic, invoice.decimals) +
            " " +
            symbol,
        );
      const allowance = await client.readContract({
        address: attempt.tokenAddress,
        abi: erc20Abi,
        functionName: "allowance",
        args: [address, attempt.spender],
      });
      if (allowance < amount) {
        setPhase("approving");
        // Approve exactly this payment, never an unlimited allowance.
        const approval = await client.writeContract({
          address: attempt.tokenAddress,
          abi: erc20Abi,
          functionName: "approve",
          args: [attempt.spender, amount],
          account: address,
          chain: client.chain,
        });
        await client.waitForTransactionReceipt({ hash: approval });
      }
      setApproved(true);
      let hash = attempt.txHash;
      if (!hash) {
        setPhase("sending");
        hash = await client.sendTransaction({
          to: attempt.transaction.to,
          data: attempt.transaction.data,
          account: address,
          chain: client.chain,
        });
        attempt.txHash = hash;
        save(invoice.id, attempt);
      }
      setPhase("submitting");
      await api("payments/" + attempt.id + "/submitted", {
        capability: attempt.capability,
        txHash: hash,
        chainId: 56,
      });
      onSubmitted();
    } catch (e) {
      console.error("[railgun-pay]", e);
      setError(walletError(e, t));
    } finally {
      setPhase("idle");
    }
  }

  const busy = phase !== "idle";
  const label: Record<Phase, string> = {
    idle: t("支付") + " " + (gross ? approx(gross) : "") + " " + symbol,
    preparing: t("准备付款…"),
    approving: t("请在钱包中授权…"),
    sending: t("请在钱包中确认付款…"),
    submitting: t("提交付款…"),
  };
  return (
    <>
      {invoice.quote && (
        <dl className="detail-list fee-breakdown">
          <div>
            <dt>{t("账单金额")}</dt>
            <dd>
              {amountDisplay(invoice.amountAtomic, invoice.decimals)} {symbol}
            </dd>
          </div>
          <div>
            <dt>
              {t("RAILGUN 隐私手续费")} (
              {(invoice.quote.feeBps / 100).toFixed(2)}%)
            </dt>
            <dd>
              {approx(invoice.quote.feeAtomic)} {symbol}
            </dd>
          </div>
          <div className="total">
            <dt>{t("合计支付")}</dt>
            <dd>
              {approx(invoice.quote.grossAtomic)} {symbol}
            </dd>
          </div>
          {!amountRoundUp(invoice.quote.grossAtomic, invoice.decimals)
            .exact && (
            <p className="exact-amount">
              {t("精确金额")}{" "}
              <span className="mono">
                {amountDisplay(invoice.quote.grossAtomic, invoice.decimals)}
              </span>
            </p>
          )}
        </dl>
      )}
      <ol className="pay-steps">
        <li className={ready ? "done" : "current"}>
          <span className="step-index">
            {ready ? <Icon name="check" size={12} /> : 1}
          </span>
          <div className="step-body">
            <strong>{t("连接钱包")}</strong>
            <WalletButton />
          </div>
        </li>
        <li className={approved ? "done" : ready ? "current" : ""}>
          <span className="step-index">
            {approved ? <Icon name="check" size={12} /> : 2}
          </span>
          <div className="step-body">
            <strong>{t("授权并付款")}</strong>
            <p className="step-hint">
              {t("钱包会先请求授权本次金额，再确认付款，共两次确认。")}
            </p>
            <button
              className="button block large spin-icon"
              aria-busy={busy}
              disabled={!ready || busy || !gross}
              onClick={pay}
            >
              {label[phase]}
            </button>
          </div>
        </li>
      </ol>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </>
  );
}
