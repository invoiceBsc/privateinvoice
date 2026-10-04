"use client";
import { Toast } from "@/components/ui/Toast";
import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useMerchant, useSession } from "@/components/ui/session";
import { AnimatedAmount, useSlidingIndicator } from "@/components/ui/motion";
import { useI18n } from "@/i18n/I18nProvider";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  api,
  copyText,
  amountDisplay,
  sumAtomic,
  type InvoiceView,
} from "@/lib/client";
interface Balance {
  tokenSymbol: string;
  spendable: string;
  pending: string;
  blocked: string;
}
interface ScanPayment {
  id: string;
  invoiceId: string;
  providerReference: string;
  txHash: string;
  tokenAddress: string;
  amountAtomic: string;
  status: string;
}
const TOKENS = ["USDT", "USDC"] as const;
const AWAITING_REVIEW = ["PAYMENT_SUBMITTED", "CONFIRMING", "REVIEW_REQUIRED"];

function Money({
  atomic,
  token,
  decimals = 18,
  animated = false,
}: {
  atomic: string;
  token: string;
  decimals?: number;
  animated?: boolean;
}) {
  const value = amountDisplay(atomic, decimals);
  return (
    <span className="money">
      {animated ? <AnimatedAmount value={value} /> : value}
      <small>{token}</small>
    </span>
  );
}

export function Dashboard() {
  const { t, locale, formatDate } = useI18n();
  const count = (n: number) =>
    n + " " + (n === 1 && locale === "en" ? "invoice" : t("张账单"));
  const { merchant } = useMerchant();
  // Real mode: the server verifies payments on-chain; funds live in the merchant's RAILGUN wallet.
  const real = useSession().account?.provider === "railgun";
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [balances, setBalances] = useState<Balance[]>([]);
  const [invoices, setInvoices] = useState<InvoiceView[] | null>(null);
  const [incoming, setIncoming] = useState<ScanPayment[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, updateMessage] = useState("");
  const [feedbackSequence, setFeedbackSequence] = useState(0);
  const [reconciling, setReconciling] = useState("");
  const [copiedId, setCopiedId] = useState("");
  const [confirmCancel, setConfirmCancel] = useState("");
  const copiedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const confirmTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const { containerRef: tabsRef, indicatorRef: tabIndicator } =
    useSlidingIndicator<HTMLDivElement>(tab);
  function setMessage(value: string) {
    updateMessage(value);
    setFeedbackSequence((sequence) => sequence + 1);
  }
  const load = useCallback(async () => {
    try {
      const [list, b] = await Promise.all([
        api<InvoiceView[]>("invoices"),
        real ? Promise.resolve([]) : api<Balance[]>("mock/balances"),
      ]);
      setInvoices(list);
      setBalances(b);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Loading failed");
    }
  }, [real]);
  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    // Payments confirm on their own in real mode; keep the list current.
    const poll = real ? setInterval(() => void load(), 10_000) : undefined;
    return () => {
      clearTimeout(timer);
      clearInterval(poll);
    };
  }, [load, real]);
  async function scan() {
    setBusy(true);
    setError("");
    try {
      const result = await api<{ payments: ScanPayment[] }>("mock/scan", {});
      const found = result.payments.filter(
        (p) => p.status === "CHAIN_CONFIRMED",
      );
      setIncoming(found);
      await load();
      setMessage(
        found.length
          ? t("模拟扫描完成，请核对下方付款。")
          : t("没有发现新的付款。"),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Scan failed");
    } finally {
      setBusy(false);
    }
  }
  async function reconcile(p: ScanPayment) {
    setBusy(true);
    setReconciling(p.id);
    try {
      await api("payments/" + p.id + "/reconcile", {
        noteId: p.providerReference,
        txHash: p.txHash,
        chainId: 56,
        tokenAddress: p.tokenAddress,
        amountAtomic: p.amountAtomic,
      });
      setIncoming((items) => items.filter((i) => i.id !== p.id));
      await load();
      setMessage(t("对账完成，收据已生成。模拟余额暂时待解锁。"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Reconciliation failed");
    } finally {
      setBusy(false);
      setReconciling("");
    }
  }
  async function release() {
    setBusy(true);
    try {
      await api("mock/spendability", {});
      await load();
      setMessage(t("模拟余额已解锁，可体验提现。"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }
  // Destructive: the first click arms the button, a second click within 3s cancels.
  async function cancel(id: string) {
    clearTimeout(confirmTimer.current);
    if (confirmCancel !== id) {
      setConfirmCancel(id);
      confirmTimer.current = setTimeout(() => setConfirmCancel(""), 3000);
      return;
    }
    setConfirmCancel("");
    try {
      await api("invoices/" + id, { status: "CANCELLED" }, "PATCH");
      await load();
      setMessage(t("账单已取消"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Cancellation failed");
    }
  }
  async function copy(id: string, slug: string) {
    try {
      await copyText(location.origin + "/i/" + slug);
      clearTimeout(copiedTimer.current);
      setCopiedId(id);
      copiedTimer.current = setTimeout(() => setCopiedId(""), 1600);
    } catch {
      setMessage(t("请打开账单，从付款链接栏手动复制。"));
    }
  }

  const list = invoices ?? [];
  const byStatus = (statuses: string[]) =>
    list.filter((i) => statuses.includes(i.status));
  const tabs = [
    { key: "all", label: t("全部"), items: list },
    { key: "pending", label: t("待付款"), items: byStatus(["PENDING"]) },
    { key: "review", label: t("待对账"), items: byStatus(AWAITING_REVIEW) },
    { key: "paid", label: t("已付款"), items: byStatus(["PAID"]) },
  ];
  const query = search.trim().toLowerCase();
  const filteredInvoices = (
    tabs.find((x) => x.key === tab)?.items ?? list
  ).filter((i) =>
    `${i.invoiceNumber} ${i.customerLabel ?? ""} ${i.description}`
      .toLowerCase()
      .includes(query),
  );
  const balance = (token: string, state: "pending" | "spendable" | "blocked") =>
    balances.find((b) => b.tokenSymbol === token)?.[state] ?? "0";
  const totals = (items: InvoiceView[]) =>
    TOKENS.map((token) => ({
      token,
      atomic: sumAtomic(
        items.filter((i) => i.tokenSymbol === token).map((i) => i.amountAtomic),
      ),
    })).filter((x, index) => x.atomic !== "0" || index === 0);
  const outstanding = byStatus(["PENDING", ...AWAITING_REVIEW]);
  const collected = byStatus(["PAID"]);
  const pendingRelease = TOKENS.filter(
    (token) => balance(token, "pending") !== "0",
  );

  return (
    <main className="container">
      <header className="page-header">
        <div>
          <h1>{t("账单管理")}</h1>
          <p className="muted">
            {t("创建账单、跟踪付款，让每笔业务有据可查。")}
          </p>
        </div>
        <div className="page-actions">
          {!real && (
            <button
              className="button secondary spin-icon"
              onClick={scan}
              aria-busy={busy}
              disabled={busy}
            >
              <Icon name="scan" />
              {t("扫描付款")}
            </button>
          )}
          <Link className="button" href="/invoice/new">
            <Icon name="plus" />
            {t("创建发票")}
          </Link>
        </div>
      </header>

      <section
        className={"stats" + (real ? " two" : "")}
        aria-label={t("概览")}
      >
        {!real &&
          TOKENS.map((token) => (
            <div className="stat" key={token}>
              <span className="stat-label">
                {token} {t("可用余额")}
              </span>
              <strong className="stat-value">
                <AnimatedAmount
                  value={amountDisplay(balance(token, "spendable"))}
                />
              </strong>
              <span className="stat-sub">
                {t("待解锁")} {amountDisplay(balance(token, "pending"))}
              </span>
            </div>
          ))}
        <div className="stat">
          <span className="stat-label">{t("待收款")}</span>
          <strong className="stat-value">
            {totals(outstanding).map((x) => (
              <Money key={x.token} atomic={x.atomic} token={x.token} animated />
            ))}
          </strong>
          <span className="stat-sub">{count(outstanding.length)}</span>
        </div>
        <div className="stat">
          <span className="stat-label">{t("已收款")}</span>
          <strong className="stat-value">
            {totals(collected).map((x) => (
              <Money key={x.token} atomic={x.atomic} token={x.token} animated />
            ))}
          </strong>
          <span className="stat-sub">{count(collected.length)}</span>
        </div>
      </section>

      {real && (
        <div className="callout neutral">
          <Icon name="shield" />
          <p>
            {t(
              "款项直接进入你的隐私钱包。在「资金」页解锁后可以查看余额和提现。",
            )}
          </p>
          <Link className="button secondary small" href="/withdraw">
            {t("资金")}
          </Link>
        </div>
      )}
      {!real && pendingRelease.length > 0 && (
        <div className="callout">
          <Icon name="info" />
          <p>
            {pendingRelease
              .map(
                (token) =>
                  amountDisplay(balance(token, "pending")) + " " + token,
              )
              .join(" · ")}{" "}
            {t("已到账，等待解锁后才能提现。")}
          </p>
          <button
            className="button secondary small"
            disabled={busy}
            onClick={release}
          >
            {t("解锁模拟余额")}
          </button>
        </div>
      )}

      {error && (
        <p className="error-banner" role="alert">
          {t(error)}
        </p>
      )}
      {message && <Toast key={feedbackSequence} message={t(message)} />}

      {incoming.length > 0 && (
        <section className="card incoming enter-down">
          <div className="card-header">
            <h2>{t("待核对的付款")}</h2>
            <span className="muted">
              {t("核对金额与账单一致后，生成收据。")}
            </span>
          </div>
          {incoming.map((p) => {
            const invoice = list.find((i) => i.id === p.invoiceId);
            return (
              <div className="incoming-row" key={p.id}>
                <div>
                  <strong>{invoice?.invoiceNumber}</strong>
                  <span className="muted">
                    {invoice?.customerLabel || invoice?.description}
                  </span>
                </div>
                <span className="mono muted">{p.txHash.slice(0, 18)}…</span>
                <Money
                  atomic={p.amountAtomic}
                  token={invoice?.tokenSymbol ?? ""}
                  decimals={invoice?.decimals}
                />
                <button
                  className="button small"
                  disabled={busy}
                  aria-busy={reconciling === p.id}
                  onClick={() => reconcile(p)}
                >
                  {t("确认并生成收据")}
                </button>
              </div>
            );
          })}
        </section>
      )}

      <section className="card invoice-panel">
        <div className="table-controls">
          <div
            ref={tabsRef}
            className="tabs"
            role="group"
            aria-label={t("账单状态筛选")}
          >
            <span
              ref={tabIndicator}
              className="tab-indicator"
              aria-hidden="true"
            />
            {tabs.map(({ key, label, items }) => (
              <button
                key={key}
                data-active={tab === key}
                className={tab === key ? "active" : ""}
                aria-pressed={tab === key}
                onClick={() => setTab(key)}
              >
                {label}
                <span className="tab-count" aria-hidden="true">
                  {items.length}
                </span>
              </button>
            ))}
          </div>
          <label className="search">
            <Icon name="search" />
            <input
              aria-label={t("搜索账单")}
              placeholder={t("搜索客户、账单或服务…")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
        </div>
        {invoices === null ? (
          <div className="table-skeleton" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton" />
            ))}
          </div>
        ) : !list.length ? (
          <div className="empty">
            <span className="empty-icon">
              <Icon name="invoice" size={20} />
            </span>
            <h2>{t("从第一张账单开始")}</h2>
            <p className="muted">
              {t("填写金额和服务内容，把付款链接发给客户。")}
            </p>
            <Link className="button" href="/invoice/new">
              <Icon name="plus" />
              {t("创建发票")}
            </Link>
          </div>
        ) : !filteredInvoices.length ? (
          <p className="empty-filter muted">{t("没有符合条件的账单")}</p>
        ) : (
          <table className="invoice-table">
            <thead>
              <tr>
                <th>{t("账单")}</th>
                <th>{t("客户")}</th>
                <th className="num">{t("金额")}</th>
                <th>{t("状态")}</th>
                <th>{t("日期")}</th>
                <th className="actions-col">
                  <span className="sr-only">{t("操作")}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((i) => (
                <tr
                  key={i.id}
                  className={i.status === "CANCELLED" ? "is-closed" : ""}
                >
                  <td className="invoice-cell">
                    <Link href={"/invoice/" + i.id}>
                      <strong>{i.description}</strong>
                      <span className="mono">{i.invoiceNumber}</span>
                    </Link>
                  </td>
                  <td className="customer-cell">
                    {i.customerLabel || <span className="faint">—</span>}
                  </td>
                  <td className="num">
                    <Money
                      atomic={i.amountAtomic}
                      token={i.tokenSymbol}
                      decimals={i.decimals}
                    />
                  </td>
                  <td>
                    <StatusBadge status={i.status} />
                  </td>
                  <td className="date-cell muted">
                    {i.status === "PAID" && i.paidAt
                      ? t("付款于") + " " + formatDate(i.paidAt)
                      : t("截止") + " " + formatDate(i.expiresAt)}
                  </td>
                  <td className="actions-col">
                    <div className="row-actions">
                      {i.receipts?.[0] && (
                        <Link
                          className="text-button"
                          href={"/receipt/" + i.receipts[0].id}
                        >
                          {t("收据")}
                        </Link>
                      )}
                      {i.status === "PENDING" && (
                        <button
                          className={
                            "text-button subtle" +
                            (confirmCancel === i.id ? " armed" : "")
                          }
                          onClick={() => cancel(i.id)}
                        >
                          {confirmCancel === i.id ? t("确认取消？") : t("取消")}
                        </button>
                      )}
                      <button
                        className={
                          "text-button copy-button" +
                          (copiedId === i.id ? " copied" : "")
                        }
                        onClick={() => copy(i.id, i.publicSlug)}
                      >
                        <span
                          className="copy-swap"
                          key={String(copiedId === i.id)}
                          aria-hidden="true"
                        >
                          <Icon
                            name={copiedId === i.id ? "check" : "copy"}
                            size={13}
                          />
                        </span>
                        {copiedId === i.id ? t("已复制") : t("复制链接")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
      {!real && (
        <p className="page-footnote">
          {t("模拟预览 · 账单、支付和余额用于体验，不发生真实转账。")}{" "}
          <span className="mono">{merchant.railgunAddress}</span>
        </p>
      )}
    </main>
  );
}
