"use client";
import { useI18n } from "@/i18n/I18nProvider";
import { useEffect, useState } from "react";
import Link from "next/link";
import { withdrawalInput } from "@/lib/validation";
import { api, amountDisplay } from "@/lib/client";
import { Icon } from "@/components/ui/Icon";
import { useMerchant, useSession } from "@/components/ui/session";
import { Funds } from "@/components/vault/Funds";
interface Balance {
  tokenSymbol: string;
  spendable: string;
  pending: string;
}
const TOKENS = ["USDT", "USDC"];
export default function Withdraw() {
  return useSession().account?.provider === "railgun" ? (
    <Funds />
  ) : (
    <MockWithdraw />
  );
}

function MockWithdraw() {
  const { t } = useI18n();
  const { merchant } = useMerchant();
  const [error, setError] = useState("");
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [token, setToken] = useState("USDT");
  const [amount, setAmount] = useState("");
  const [destination, setDestination] = useState("");
  useEffect(() => {
    api<Balance[]>("mock/balances")
      .then(setBalances)
      .catch((e) => setError(e.message));
  }, []);
  const balance = (symbol: string, state: "spendable" | "pending") =>
    balances.find((b) => b.tokenSymbol === symbol)?.[state] ?? "0";
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setResult("");
    const input = withdrawalInput.safeParse({
      tokenSymbol: token,
      amount,
      destination,
    });
    if (!input.success) {
      setError(t("请输入有效的金额与收款地址。"));
      return;
    }
    setBusy(true);
    try {
      const withdrawal = await api<{ txHash: string }>(
        "mock/withdraw",
        input.data,
      );
      setResult(withdrawal.txHash);
      setAmount("");
      setBalances(await api<Balance[]>("mock/balances"));
    } catch (e) {
      setError(e instanceof Error ? e.message : t("提现失败"));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="container">
      <Link className="back-link" href="/dashboard">
        <Icon name="arrowLeft" size={14} />
        {t("返回账单")}
      </Link>
      <header className="page-header">
        <div>
          <h1>{t("余额与提现")}</h1>
          <p className="muted">{t("已解锁的余额可以提现到任意 EVM 地址。")}</p>
        </div>
      </header>
      <section className="stats two">
        {TOKENS.map((symbol) => (
          <div className="stat" key={symbol}>
            <span className="stat-label">
              {symbol} {t("可用余额")}
            </span>
            <strong className="stat-value">
              {amountDisplay(balance(symbol, "spendable"))}
            </strong>
            <span className="stat-sub">
              {t("待解锁")} {amountDisplay(balance(symbol, "pending"))}
            </span>
          </div>
        ))}
      </section>
      <div className="withdraw-grid">
        <form className="card form-card" onSubmit={submit}>
          <h2 className="card-title">{t("发起提现")}</h2>
          <div className="field">
            <label htmlFor="withdraw-amount">{t("金额")}</label>
            <div className="amount-input">
              <input
                id="withdraw-amount"
                name="amount"
                inputMode="decimal"
                autoComplete="off"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <button
                type="button"
                className="max-button"
                onClick={() =>
                  setAmount(
                    amountDisplay(balance(token, "spendable")).replace(
                      /,/g,
                      "",
                    ),
                  )
                }
              >
                {t("全部")}
              </button>
              <select
                name="tokenSymbol"
                aria-label={t("币种")}
                value={token}
                onChange={(e) => setToken(e.target.value)}
              >
                {TOKENS.map((symbol) => (
                  <option key={symbol}>{symbol}</option>
                ))}
              </select>
            </div>
            <span className="hint">
              {t("可提现")}: {amountDisplay(balance(token, "spendable"))}{" "}
              {token}
            </span>
          </div>
          <div className="field">
            <label htmlFor="destination">{t("收款地址")}</label>
            <input
              id="destination"
              name="destination"
              className="mono-input"
              required
              autoComplete="off"
              spellCheck={false}
              placeholder="0x…"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
            <span className="hint">
              {t("真实提现到公开钱包时，收款地址和金额会在链上公开。")}
            </span>
          </div>
          {error && (
            <p className="field-error" role="alert">
              {t(error)}
            </p>
          )}
          {result && (
            <div className="result-panel success" role="status">
              <Icon name="check" />
              <div>
                <strong>{t("模拟提现已完成：")}</strong>
                <p className="mono">{result}</p>
              </div>
            </div>
          )}
          <div className="form-footer">
            <span className="form-footnote">
              {t("当前仅支持模拟提现，不会发送链上交易。")}
            </span>
            <button className="button" aria-busy={busy} disabled={busy}>
              {t("模拟提现")}
            </button>
          </div>
        </form>
        <aside className="card">
          <h2 className="card-title">{t("收款账户")}</h2>
          <p className="muted small-text">
            {t("客户付款进入这个隐私收款地址，而不是你的常用钱包。")}
          </p>
          <code className="address-block">{merchant.railgunAddress}</code>
          <p className="muted small-text">
            {t(
              "已付款不等于可提现。Private POI 可能使余额处于待处理状态，系统不会绕过相关检查。",
            )}
          </p>
        </aside>
      </div>
    </main>
  );
}
