"use client";
import { useI18n } from "@/i18n/I18nProvider";
import Link from "next/link";
import { useEffect, useState } from "react";
import { isAddress, parseUnits, publicActions, type Hex } from "viem";
import { useAccount, useWalletClient } from "wagmi";
import { TOKENS } from "@/config/tokens";
import { amountDisplay, copyText } from "@/lib/client";
import { Icon } from "@/components/ui/Icon";
import { AnimatedAmount } from "@/components/ui/motion";
import { useMerchant } from "@/components/ui/session";
import { WalletButton } from "@/components/wallet/WalletButton";
import { vault, useVault, VaultError, type IncomingItem } from "@/vault/client";
import {
  ImportVault,
  UnlockVault,
  vaultErrorText,
} from "@/components/vault/VaultForms";

const TOKEN_LIST = Object.values(TOKENS);
const symbolOf = (address: string) =>
  TOKEN_LIST.find((t) => t.address.toLowerCase() === address.toLowerCase())
    ?.symbol ?? "?";
const UNSHIELD_FEE_BPS = 25n;

function SyncProgress() {
  const { t } = useI18n();
  const v = useVault();
  const label: Record<string, string> = {
    loading: "正在加载隐私钱包…",
    engine: "正在启动隐私引擎…",
    provider: "正在连接 BNB Chain…",
    scan: "正在同步隐私记录…",
  };
  if (!label[v.stage]) return null;
  const pct = Math.round(Math.max(v.utxo, 0) * 100);
  return (
    <section className="card sync-card" aria-live="polite">
      <div className="progress-row">
        <strong>{t(label[v.stage])}</strong>
        {v.stage === "scan" && <span>{pct}%</span>}
      </div>
      <div className="progress" aria-hidden="true">
        <i
          style={{ width: (v.stage === "scan" ? Math.max(pct, 3) : 2) + "%" }}
        />
      </div>
      <p className="muted small-text">
        {t(
          "第一次同步需要下载全部隐私记录，可能要一两分钟；之后打开只需几秒。",
        )}
      </p>
    </section>
  );
}

function Balances() {
  const { t } = useI18n();
  const { balances } = useVault();
  return (
    <section className="stats two" aria-label={t("隐私余额")}>
      {TOKEN_LIST.map((token) => {
        const b = balances?.find(
          (x) => x.tokenAddress === token.address.toLowerCase(),
        );
        return (
          <div className="stat balance-cell" key={token.symbol}>
            <span className="stat-label">
              {token.symbol} {t("可用余额")}
            </span>
            <strong className="stat-value">
              <AnimatedAmount
                value={amountDisplay(b?.spendable ?? "0", token.decimals)}
              />
            </strong>
            <span className="stat-sub">
              <span>
                {t("待解锁")} {amountDisplay(b?.pending ?? "0", token.decimals)}
              </span>
              {b && b.attention !== "0" && (
                <span className="attention">
                  {t("需关注")} {amountDisplay(b.attention, token.decimals)}
                </span>
              )}
            </span>
          </div>
        );
      })}
    </section>
  );
}

function Withdraw() {
  const { t } = useI18n();
  const { balances, stage, proof } = useVault();
  const { address, chainId } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [symbol, setSymbol] = useState<keyof typeof TOKENS>("USDT");
  const [amount, setAmount] = useState("");
  const [destination, setDestination] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const token = TOKENS[symbol];
  const spendable = BigInt(
    balances?.find((b) => b.tokenAddress === token.address.toLowerCase())
      ?.spendable ?? "0",
  );
  const to = destination || address || "";
  let atomic = 0n;
  try {
    atomic = amount ? parseUnits(amount, token.decimals) : 0n;
  } catch {
    atomic = -1n;
  }
  const fee = (atomic * UNSHIELD_FEE_BPS) / 10000n;
  const valid =
    atomic > 0n &&
    atomic <= spendable &&
    isAddress(to) &&
    !!walletClient &&
    chainId === 56;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!walletClient || !address) return;
    setError("");
    setDone("");
    try {
      const client = walletClient.extend(publicActions);
      setBusy("prove");
      const gasPrice = await client.getGasPrice();
      const tx = await vault.withdraw({
        tokenAddress: token.address,
        amount: atomic.toString(),
        destination: to,
        gasPrice: gasPrice.toString(),
      });
      setBusy("send");
      const hash = await client.sendTransaction({
        account: address,
        chain: client.chain,
        to: tx.to as Hex,
        data: tx.data as Hex,
        gas: tx.gasLimit ? BigInt(tx.gasLimit) : undefined,
        gasPrice,
      });
      setBusy("confirm");
      await client.waitForTransactionReceipt({ hash });
      setDone(hash);
      setAmount("");
      void vault.sync().catch(() => {});
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      setError(
        /user (rejected|denied)|4001/i.test(message)
          ? t("你在钱包中取消了这一步。")
          : vaultErrorText(err, t),
      );
      console.error("[vault-withdraw]", err);
    } finally {
      setBusy("");
    }
  }
  const label: Record<string, string> = {
    prove:
      stage === "prove"
        ? t("正在生成零知识证明…") +
          " " +
          Math.min(100, Math.round(proof)) +
          "%"
        : t("正在准备提现…"),
    send: t("请在钱包中确认…"),
    confirm: t("等待链上确认…"),
  };
  return (
    <form className="card form-card" onSubmit={submit}>
      <h2 className="card-title">{t("提现到公开地址")}</h2>
      <div className="field">
        <label htmlFor="withdraw-amount">{t("金额")}</label>
        <div className="amount-input">
          <input
            id="withdraw-amount"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <button
            type="button"
            className="max-button"
            onClick={() =>
              setAmount(
                amountDisplay(spendable.toString(), token.decimals).replace(
                  /,/g,
                  "",
                ),
              )
            }
          >
            {t("全部")}
          </button>
          <select
            aria-label={t("币种")}
            value={symbol}
            onChange={(e) => setSymbol(e.target.value as keyof typeof TOKENS)}
          >
            {TOKEN_LIST.map((x) => (
              <option key={x.symbol}>{x.symbol}</option>
            ))}
          </select>
        </div>
        <span className="hint">
          {t("可提现")}: {amountDisplay(spendable.toString(), token.decimals)}{" "}
          {symbol}
          {atomic > 0n &&
            " · " +
              t("RAILGUN 手续费") +
              " " +
              amountDisplay(fee.toString(), token.decimals) +
              " · " +
              t("到账") +
              " " +
              amountDisplay((atomic - fee).toString(), token.decimals)}
        </span>
      </div>
      <div className="field">
        <label htmlFor="destination">{t("收款地址")}</label>
        <input
          id="destination"
          className="mono-input"
          autoComplete="off"
          spellCheck={false}
          placeholder={address ?? "0x…"}
          value={destination}
          onChange={(e) => setDestination(e.target.value.trim())}
        />
        <span className="hint">
          {t(
            "留空则提现到当前连接的钱包。提现会在链上公开收款地址和金额；网络费由当前连接的钱包支付。",
          )}
        </span>
      </div>
      {(!address || chainId !== 56) && <WalletButton />}
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
      {done && (
        <div className="result-panel success enter-up draw-check" role="status">
          <Icon name="check" />
          <div>
            <strong>{t("提现已完成")}</strong>
            <a
              className="mono"
              href={"https://bscscan.com/tx/" + done}
              target="_blank"
              rel="noopener noreferrer"
            >
              {done.slice(0, 12)}…{done.slice(-8)} ↗
            </a>
          </div>
        </div>
      )}
      <div className="form-footer">
        <span className="form-footnote">
          {t("证明在你的浏览器中生成，首次需要下载证明文件。")}
        </span>
        <button
          className="button spin-icon"
          aria-busy={!!busy}
          disabled={!valid || !!busy}
        >
          {busy ? label[busy] : t("提现")}
        </button>
      </div>
    </form>
  );
}

function Incoming() {
  const { t, formatDate } = useI18n();
  const { stage } = useVault();
  const [items, setItems] = useState<IncomingItem[] | null>(null);
  useEffect(() => {
    if (stage !== "ready") return;
    let cancelled = false;
    vault
      .history()
      .then((list) => !cancelled && setItems(list))
      .catch(() => !cancelled && setItems([]));
    return () => {
      cancelled = true;
    };
  }, [stage]);
  const state: Record<string, string> = {
    Spendable: "可用",
    ShieldPending: "待解锁",
    ProofSubmitted: "待解锁",
    ShieldBlocked: "需关注",
    MissingInternalPOI: "需关注",
    MissingExternalPOI: "需关注",
    Spent: "已使用",
  };
  return (
    <section className="card">
      <h2 className="card-title">{t("收款记录")}</h2>
      {items === null ? (
        <p className="muted small-text">{t("同步完成后显示。")}</p>
      ) : !items.length ? (
        <p className="muted small-text">{t("还没有收到隐私付款。")}</p>
      ) : (
        <ul className="incoming-list">
          {items.slice(0, 20).map((item) =>
            item.received.map((r, i) => (
              <li key={item.txid + i}>
                <span>
                  <strong>
                    +{amountDisplay(r.amount, 18)} {symbolOf(r.tokenAddress)}
                  </strong>
                  <small className="muted">
                    {item.timestamp
                      ? formatDate(
                          new Date(item.timestamp * 1000).toISOString(),
                          true,
                        )
                      : "—"}
                  </small>
                </span>
                <span className="badge neutral">
                  {t(state[r.state] ?? r.state)}
                </span>
                <a
                  className="mono muted"
                  href={"https://bscscan.com/tx/" + item.txid}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {item.txid.slice(0, 10)}… ↗
                </a>
              </li>
            )),
          )}
        </ul>
      )}
    </section>
  );
}

function AddressCard({ address }: { address: string }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  return (
    <section className="card">
      <h2 className="card-title">{t("RAILGUN 收款地址")}</h2>
      <code className="address-block">{address}</code>
      <button
        type="button"
        className={"text-button copy-button" + (copied ? " copied" : "")}
        onClick={async () => {
          await copyText(address);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
      >
        <span className="copy-swap" key={String(copied)} aria-hidden="true">
          <Icon name={copied ? "check" : "copy"} size={13} />
        </span>
        {copied ? t("已复制") : t("复制地址")}
      </button>
    </section>
  );
}

export function Funds() {
  const { t } = useI18n();
  const { merchant } = useMerchant();
  const v = useVault();
  const [forgetting, setForgetting] = useState(false);
  useEffect(() => {
    void vault
      .refresh()
      .then((s) => {
        if (s.unlocked && s.address === merchant.railgunAddress)
          void vault.ensureSynced().catch(() => {});
      })
      .catch(() => {});
  }, [merchant.railgunAddress]);

  const header = (
    <>
      <Link className="back-link" href="/dashboard">
        <Icon name="arrowLeft" size={14} />
        {t("返回账单")}
      </Link>
      <header className="page-header">
        <div>
          <h1>{t("资金")}</h1>
          <p className="muted">
            {t("隐私钱包在你的浏览器里运行，密钥不会离开这台设备。")}
          </p>
        </div>
        {v.unlocked && (
          <div className="page-actions">
            <button
              className="button secondary"
              onClick={() => void vault.lock()}
            >
              <Icon name="lock" />
              {t("锁定")}
            </button>
          </div>
        )}
      </header>
    </>
  );

  if (!v.loaded)
    return (
      <main className="container">
        {header}
        <div className="detail-skeleton" aria-busy="true">
          <div className="skeleton" />
        </div>
      </main>
    );

  const mine = v.hasWallet && v.address === merchant.railgunAddress;
  return (
    <main className="container">
      {header}
      {v.error && (
        <p className="error-banner" role="alert">
          {vaultErrorText(new VaultError(v.error), t)}
        </p>
      )}
      {mine && !v.unlocked && (
        <div className="withdraw-grid">
          <section className="card form-card">
            <h2 className="card-title">{t("解锁隐私钱包")}</h2>
            <UnlockVault />
          </section>
          <AddressCard address={merchant.railgunAddress} />
        </div>
      )}
      {mine && v.unlocked && (
        <>
          <SyncProgress />
          <Balances />
          <div className="withdraw-grid">
            <Withdraw />
            <div className="detail-side">
              <Incoming />
              <AddressCard address={merchant.railgunAddress} />
            </div>
          </div>
        </>
      )}
      {!mine && (
        <div className="withdraw-grid">
          <section className="card form-card">
            <h2 className="card-title">
              {v.hasWallet
                ? t("这台设备上的隐私钱包不是你的收款钱包")
                : t("在这台设备上恢复隐私钱包")}
            </h2>
            <p className="muted small-text">
              {t(
                "输入创建钱包时抄下的助记词。它必须对应你的收款地址。如果你用的是 Railway 等外部钱包，请直接在那里查看余额和提现。",
              )}
            </p>
            {!v.hasWallet && (
              <ImportVault
                expectedAddress={merchant.railgunAddress}
                onImported={() => vault.sync().catch(() => {})}
              />
            )}
          </section>
          <AddressCard address={merchant.railgunAddress} />
        </div>
      )}
      {v.hasWallet && (
        <div className="danger-zone">
          {forgetting ? (
            <p className="small-text">
              {t("从这台设备移除钱包后，只能用助记词恢复。确定吗？")}{" "}
              <button
                className="text-button danger"
                onClick={() => void vault.forget(v.address ?? "")}
              >
                {t("确认移除")}
              </button>{" "}
              <button
                className="text-button subtle"
                onClick={() => setForgetting(false)}
              >
                {t("取消")}
              </button>
            </p>
          ) : (
            <button
              className="text-button subtle"
              onClick={() => setForgetting(true)}
            >
              {t("从这台设备移除隐私钱包")}
            </button>
          )}
        </div>
      )}
    </main>
  );
}
