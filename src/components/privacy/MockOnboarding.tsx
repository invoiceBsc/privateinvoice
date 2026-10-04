"use client";
import { useI18n } from "@/i18n/I18nProvider";
import { useState } from "react";
import { api } from "@/lib/client";
import { privacyProvider } from "@/privacy/provider";
import { useSession } from "@/components/ui/session";
import { CreateVault } from "@/components/vault/VaultForms";

const ZK_ADDRESS = /^0zk1[02-9ac-hj-np-z]{60,200}$/;
export function MockOnboarding({ done }: { done: () => void }) {
  const { t } = useI18n();
  const real = useSession().account?.provider === "railgun";
  const [name, setName] = useState("");
  const [zkAddress, setZkAddress] = useState("");
  // Real mode: a wallet created in this browser (default) or an existing RAILGUN address.
  const [method, setMethod] = useState<"vault" | "address">("vault");
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function create(e: React.FormEvent) {
    e.preventDefault();
    // The built-in wallet path has its own buttons; Enter must not submit an empty address.
    if (real && method === "vault") return;
    setBusy(true);
    setError("");
    try {
      const railgunAddress = real
        ? zkAddress.trim()
        : (
            await privacyProvider.createPrivateWallet({
              mnemonic: "mock-only-no-recovery-secrets",
              password: "mock-only",
            })
          ).address;
      await api("merchant", { displayName: name, railgunAddress });
      done();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("设置失败，请重试"));
    } finally {
      setBusy(false);
    }
  }
  const initial = name.trim().charAt(0).toUpperCase();
  return (
    <main className="onboarding">
      <div className="onboarding-steps" aria-hidden="true">
        <span className="done">{t("连接钱包")}</span>
        <i />
        <span className="current">{t("设置商家名称")}</span>
        <i />
        <span>{t("创建并分享账单")}</span>
      </div>
      <form className="card onboarding-card" onSubmit={create}>
        <h1>{t("你的商家叫什么？")}</h1>
        <p className="muted">{t("这个名称会显示在客户的付款页面上。")}</p>
        <label className="field">
          <span>{t("商家名称")}</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            placeholder={t("例如：North 设计工作室")}
            autoComplete="organization"
            autoFocus
          />
        </label>
        <div className="onboarding-preview" aria-hidden="true">
          <span className="avatar">{initial || "?"}</span>
          <div>
            <strong>{name.trim() || t("你的商家名称")}</strong>
            <small>{t("客户在付款页面看到的样子")}</small>
          </div>
        </div>
        {real && (
          <div className="field">
            <span className="field-label" id="method-label">
              {t("收款钱包")}
            </span>
            <div
              className="segmented two"
              role="radiogroup"
              aria-labelledby="method-label"
            >
              {(
                [
                  ["vault", "网站内置钱包"],
                  ["address", "已有 RAILGUN 地址"],
                ] as const
              ).map(([key, label]) => (
                <button
                  type="button"
                  key={key}
                  role="radio"
                  aria-checked={method === key}
                  className={method === key ? "active" : ""}
                  onClick={() => setMethod(key)}
                >
                  {t(label)}
                </button>
              ))}
            </div>
          </div>
        )}
        {real && method === "vault" ? (
          <CreateVault
            disabled={!name.trim()}
            onCreated={async (railgunAddress) => {
              await api("merchant", { displayName: name, railgunAddress });
              done();
            }}
          />
        ) : (
          <>
            {real && (
              <label className="field">
                <span>{t("RAILGUN 收款地址")}</span>
                <textarea
                  className="mono-input"
                  rows={3}
                  value={zkAddress}
                  onChange={(e) =>
                    setZkAddress(e.target.value.replace(/\s+/g, ""))
                  }
                  placeholder="0zk1…"
                  spellCheck={false}
                  autoComplete="off"
                />
                <span className="hint">
                  {zkAddress && !ZK_ADDRESS.test(zkAddress)
                    ? t("这不是有效的 RAILGUN 0zk 地址。")
                    : t(
                        "在 Railway 等 RAILGUN 钱包里复制你的 0zk 地址。客户付款会直接进入这个地址，我们不接触你的私钥。",
                      )}
                </span>
              </label>
            )}
            <label className="check">
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
              />
              <span>
                {real
                  ? t("我确认这个地址由我自己掌控，并已备份它的助记词。")
                  : t("我知道这是模拟账户，不会发生真实转账。")}
              </span>
            </label>
            <button
              className="button block"
              aria-busy={busy}
              disabled={
                !name.trim() ||
                !checked ||
                busy ||
                (real && !ZK_ADDRESS.test(zkAddress))
              }
            >
              {t("创建工作空间 →")}
            </button>
            {error && (
              <p className="field-error" role="alert">
                {t(error)}
              </p>
            )}
          </>
        )}
        <p className="form-footnote">
          {real
            ? t("非托管 · 钥匙只在你的设备上，我们无法动用资金")
            : t("无需助记词 · 不存入真实资金")}
        </p>
      </form>
    </main>
  );
}
