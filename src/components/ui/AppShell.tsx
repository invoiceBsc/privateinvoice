"use client";
import { LanguageSwitcher, useI18n } from "@/i18n/I18nProvider";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Icon, Mark } from "@/components/ui/Icon";
import { useSlidingIndicator } from "@/components/ui/motion";
import { SessionProvider, useSession } from "@/components/ui/session";
import { WalletButton } from "@/components/wallet/WalletButton";
import { WalletMenu } from "@/components/wallet/WalletMenu";
import { WalletPickerProvider } from "@/components/wallet/WalletPicker";
import { MockOnboarding } from "@/components/privacy/MockOnboarding";

export { Mark };

const isWorkspace = (path: string) =>
  path.startsWith("/dashboard") ||
  path.startsWith("/invoice") ||
  path === "/withdraw" ||
  path === "/login";
// Customer-facing pages: the payment card owns the wallet step, so the header stays quiet.
const isCustomerPage = (path: string) =>
  path.startsWith("/i/") || path.startsWith("/receipt/");

// Mock labels disappear once the server runs real RAILGUN payments.
const useRealMode = () => useSession().account?.provider === "railgun";

const NAV = [
  { href: "/", label: "首页", match: (p: string) => p === "/" },
  {
    href: "/dashboard",
    label: "工作台",
    match: (p: string) =>
      p.startsWith("/dashboard") || p.startsWith("/invoice"),
  },
  {
    href: "/withdraw",
    label: "余额与提现",
    match: (p: string) => p === "/withdraw",
  },
  {
    href: "/docs",
    label: "文档",
    match: (p: string) => p.startsWith("/docs") || p === "/privacy-model",
  },
];

const FOOTER = [
  {
    title: "产品",
    links: [
      ["/dashboard", "工作台"],
      ["/invoice/new", "创建发票"],
      ["/withdraw", "资金"],
    ],
  },
  {
    title: "文档",
    links: [
      ["/docs/getting-started", "快速开始"],
      ["/docs/paying", "客户如何付款"],
      ["/docs/private-wallet", "内置隐私钱包"],
      ["/docs/railgun", "RAILGUN 是什么"],
      ["/docs/architecture", "系统架构"],
    ],
  },
  {
    title: "安全",
    links: [
      ["/docs/privacy", "隐私模型"],
      ["/docs/security", "安全建议"],
      ["/docs/networks", "网络与代币"],
      ["/docs/faq", "常见问题"],
    ],
  },
];

function MainNav() {
  const { t } = useI18n();
  const path = usePathname();
  // Highlight the clicked item immediately; fall back to the real path once it changes.
  const [clicked, setClicked] = useState<{ from: string; to: string } | null>(
    null,
  );
  const current = clicked && clicked.from === path ? clicked.to : path;
  const active = NAV.find((item) => item.match(current))?.href ?? "";
  const real = useRealMode();
  const { containerRef, indicatorRef } =
    useSlidingIndicator<HTMLElement>(active);
  return (
    <nav ref={containerRef} className="main-nav" aria-label={t("主导航")}>
      <span ref={indicatorRef} className="nav-indicator" aria-hidden="true" />
      {NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          data-active={active === item.href}
          className={active === item.href ? "active" : ""}
          aria-current={item.match(path) ? "page" : undefined}
          onClick={() => setClicked({ from: path, to: item.href })}
        >
          {t(real && item.href === "/withdraw" ? "资金" : item.label)}
        </Link>
      ))}
    </nav>
  );
}

function SiteHeader({ customer }: { customer: boolean }) {
  const { t } = useI18n();
  const real = useRealMode();
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link className="brand" href="/" aria-label={t("返回首页")}>
          <Mark />
          <span>Private Invoice</span>
        </Link>
        {!customer && <MainNav />}
        <div className="header-actions">
          {!real && (
            <span className="mock-tag">
              <i />
              {t("模拟环境")}
            </span>
          )}
          <LanguageSwitcher />
          {!customer && <WalletMenu />}
        </div>
      </div>
    </header>
  );
}

function SignInPrompt() {
  const { t } = useI18n();
  const { refresh } = useSession();
  return (
    <main className="signin">
      <div className="signin-card">
        <Mark />
        <h1>{t("登录工作台")}</h1>
        <p className="muted">
          {t("连接钱包，签名即可登录。 登录不会授权代币或发送转账。")}
        </p>
        <WalletButton login onLogin={() => void refresh()} block />
        <div className="signin-foot">
          <Icon name="lock" size={14} />
          <span>{t("仅签名一条登录消息，不会发起链上交易。")}</span>
        </div>
      </div>
      <Link className="signin-link" href="/docs/getting-started">
        {t("了解隐私设计 →")}
      </Link>
    </main>
  );
}

/** Workspace routes render only for a signed-in merchant; otherwise sign-in or setup. */
function WorkspaceGate({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const { account, error, refresh } = useSession();
  if (!account)
    return error ? (
      <main className="container">
        <p className="error-banner" role="alert">
          {t(error)}
        </p>
      </main>
    ) : (
      <div className="workspace-skeleton" aria-busy="true">
        <span className="sr-only">{t("正在加载工作台…")}</span>
        <div className="skeleton" />
      </div>
    );
  if (!account.authenticated) return <SignInPrompt />;
  if (!account.merchant) return <MockOnboarding done={() => void refresh()} />;
  return <>{children}</>;
}

function Frame({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const path = usePathname();
  const workspace = isWorkspace(path);
  const real = useRealMode();
  return (
    <div className="site">
      <SiteHeader customer={isCustomerPage(path)} />
      <div className="page-transition">
        {workspace ? <WorkspaceGate>{children}</WorkspaceGate> : children}
      </div>
      <footer className="site-footer">
        <div className="site-footer-inner">
          <div className="footer-brand">
            <Link className="brand" href="/">
              <Mark />
              <span>Private Invoice</span>
            </Link>
            <p>{t("用 USDT / USDC 收款，钱直接进入你自己的隐私钱包。")}</p>
            {!real && <span className="footer-mode">{t("模拟预览")}</span>}
          </div>
          {FOOTER.map((column) => (
            <nav
              key={column.title}
              className="footer-column"
              aria-label={t(column.title)}
            >
              <strong>{t(column.title)}</strong>
              {column.links.map(([href, label]) => (
                <Link key={href} href={href}>
                  {t(label)}
                </Link>
              ))}
            </nav>
          ))}
        </div>
        <div className="site-footer-bottom">
          <span>Private Invoice © 2026</span>
          <span>BNB Chain · USDT / USDC · {t("非托管")}</span>
        </div>
      </footer>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <WalletPickerProvider>
        <Frame>{children}</Frame>
      </WalletPickerProvider>
    </SessionProvider>
  );
}
