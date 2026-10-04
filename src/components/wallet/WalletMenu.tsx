"use client";
import { useI18n } from "@/i18n/I18nProvider";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAccount, useDisconnect } from "wagmi";
import { api, copyText } from "@/lib/client";
import { Icon } from "@/components/ui/Icon";
import { useSession } from "@/components/ui/session";
import { useWalletLogin } from "@/components/wallet/useWalletLogin";

const short = (address: string) =>
  address.slice(0, 6) + "…" + address.slice(-4);

/** Header wallet control: connect & sign in, then an account menu. */
export function WalletMenu() {
  const { t } = useI18n();
  const router = useRouter();
  const path = usePathname();
  const { account, refresh } = useSession();
  const { address: walletAddress } = useAccount();
  const { disconnect } = useDisconnect();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const { login, busy, error } = useWalletLogin(async () => {
    const next = await refresh();
    // First sign-in has no workspace yet: take the merchant straight to setup.
    if (next && !next.merchant && path === "/") router.push("/dashboard");
  });

  useEffect(() => {
    if (!open) return;
    const close = (event: Event) => {
      if (
        event instanceof KeyboardEvent
          ? event.key === "Escape"
          : !root.current?.contains(event.target as Node)
      )
        setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  if (!account)
    return <span className="wallet-placeholder" aria-hidden="true" />;

  if (!account.authenticated)
    return (
      <div className="wallet-menu">
        <button
          className="button small connect-button"
          onClick={login}
          aria-busy={busy}
          disabled={busy}
        >
          <Icon name="wallet" />
          {t("连接钱包")}
        </button>
        {error && (
          <p className="wallet-error" role="alert">
            {t(error)}
          </p>
        )}
      </div>
    );

  const address = account.address ?? walletAddress ?? "";
  const name = account.merchant?.displayName;
  const initial = (name ?? "").trim().charAt(0).toUpperCase();
  async function signOut() {
    setOpen(false);
    await api("auth/logout", {});
    disconnect();
    await refresh();
    if (
      path !== "/" &&
      !path.startsWith("/i/") &&
      !path.startsWith("/receipt/")
    )
      router.push("/");
  }
  return (
    <div className="wallet-menu" ref={root}>
      <button
        className={"account-chip" + (open ? " open" : "")}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("账户菜单")}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="avatar small">
          {initial || <Icon name="wallet" size={13} />}
        </span>
        <span className="account-chip-text">
          {name && <strong>{name}</strong>}
          <span className="mono">{short(address)}</span>
        </span>
        <span className="chevron" aria-hidden="true">
          <svg viewBox="0 0 12 12" width="12" height="12" fill="none">
            <path
              d="m3 4.5 3 3 3-3"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>
      {open && (
        <div className="menu" role="menu">
          <div className="menu-head">
            <span className="avatar">
              {initial || <Icon name="wallet" size={14} />}
            </span>
            <div>
              <strong>{name ?? t("未设置商家")}</strong>
              <button
                className="menu-address"
                onClick={async () => {
                  await copyText(address);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
              >
                <span className="mono">{short(address)}</span>
                <Icon name={copied ? "check" : "copy"} size={12} />
              </button>
            </div>
          </div>
          <div className="menu-section">
            <Link
              role="menuitem"
              href="/dashboard"
              onClick={() => setOpen(false)}
            >
              <Icon name="invoice" />
              {t("工作台")}
            </Link>
            <Link
              role="menuitem"
              href="/invoice/new"
              onClick={() => setOpen(false)}
            >
              <Icon name="plus" />
              {t("创建发票")}
            </Link>
            <Link
              role="menuitem"
              href="/withdraw"
              onClick={() => setOpen(false)}
            >
              <Icon name="wallet" />
              {t("余额与提现")}
            </Link>
          </div>
          <div className="menu-section">
            <button role="menuitem" className="danger" onClick={signOut}>
              <Icon name="logout" />
              {t("断开连接")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
