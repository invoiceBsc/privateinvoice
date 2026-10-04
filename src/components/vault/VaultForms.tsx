"use client";
import { useI18n } from "@/i18n/I18nProvider";
import { useState } from "react";
import { copyText } from "@/lib/client";
import { Icon } from "@/components/ui/Icon";
import { vault, VaultError } from "@/vault/client";

const MIN_PASSWORD = 10;

export function vaultErrorText(error: unknown, t: (s: string) => string) {
  const code = error instanceof VaultError ? error.code : "";
  const known: Record<string, string> = {
    PASSWORD_TOO_SHORT: "密码至少需要 10 个字符。",
    WRONG_PASSWORD: "密码不正确。",
    INVALID_MNEMONIC: "助记词无效，请检查拼写和顺序。",
    ADDRESS_MISMATCH: "这组助记词对应的不是你的收款地址。",
    VAULT_EXISTS: "这台设备上已经有一个隐私钱包。",
    NO_VAULT: "这台设备上没有隐私钱包。",
    VAULT_LOCKED: "请先解锁隐私钱包。",
    VAULT_CRASHED: "隐私钱包意外停止，请刷新页面重试。",
  };
  return t(known[code] ?? "隐私钱包操作失败，请重试。");
}

function PasswordFields({
  password,
  confirm,
  onPassword,
  onConfirm,
}: {
  password: string;
  confirm: string;
  onPassword: (v: string) => void;
  onConfirm: (v: string) => void;
}) {
  const { t } = useI18n();
  const short = password.length > 0 && password.length < MIN_PASSWORD;
  const differs = confirm.length > 0 && confirm !== password;
  return (
    <>
      <label className="field">
        <span>{t("钱包密码")}</span>
        <input
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => onPassword(e.target.value)}
        />
        <span className="hint">
          {short
            ? t("密码至少需要 10 个字符。")
            : t("只用于在这台设备上加密钱包，我们无法帮你找回。")}
        </span>
      </label>
      <label className="field">
        <span>{t("再次输入密码")}</span>
        <input
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => onConfirm(e.target.value)}
        />
        {differs && (
          <span className="field-error">{t("两次输入的密码不一致。")}</span>
        )}
      </label>
    </>
  );
}
const passwordOk = (p: string, c: string) =>
  p.length >= MIN_PASSWORD && p === c;

/** Shows the recovery phrase once and makes the merchant acknowledge the backup. */
function RecoveryPhrase({ mnemonic }: { mnemonic: string }) {
  const { t } = useI18n();
  const [shown, setShown] = useState(false);
  const [copied, setCopied] = useState(false);
  return (
    <div className="phrase">
      <div className={"phrase-grid" + (shown ? "" : " concealed")}>
        {mnemonic.split(" ").map((word, i) => (
          <span key={i}>
            <i>{i + 1}</i>
            {word}
          </span>
        ))}
        {!shown && (
          <button
            type="button"
            className="phrase-reveal"
            onClick={() => setShown(true)}
          >
            <Icon name="lock" size={14} />
            {t("确认周围没人后，点击显示助记词")}
          </button>
        )}
      </div>
      {shown && (
        <button
          type="button"
          className="text-button"
          onClick={async () => {
            await copyText(mnemonic);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
        >
          <Icon name={copied ? "check" : "copy"} size={13} />
          {copied ? t("已复制") : t("复制助记词")}
        </button>
      )}
    </div>
  );
}

/** Creates a new in-browser RAILGUN wallet. Returns its 0zk address to the caller. */
export function CreateVault({
  onCreated,
  disabled,
}: {
  onCreated: (address: string) => Promise<void>;
  disabled?: boolean;
}) {
  const { t } = useI18n();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [mnemonic, setMnemonic] = useState("");
  const [backedUp, setBackedUp] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // If registration fails after the wallet exists, retrying only repeats registration.
  const [created, setCreated] = useState("");
  async function run() {
    setBusy(true);
    setError("");
    try {
      if (!mnemonic) {
        setMnemonic((await vault.generate()).mnemonic);
        return;
      }
      const address =
        created ||
        (await vault.create({ mnemonic, password, fresh: true })).address;
      setCreated(address);
      await onCreated(address);
    } catch (e) {
      setError(
        e instanceof VaultError
          ? vaultErrorText(e, t)
          : e instanceof Error
            ? t(e.message)
            : String(e),
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="vault-form">
      {!mnemonic ? (
        <PasswordFields
          password={password}
          confirm={confirm}
          onPassword={setPassword}
          onConfirm={setConfirm}
        />
      ) : (
        <>
          <p className="muted small-text">
            {t(
              "这 12 个词是找回钱包的唯一方式。换电脑、清理浏览器后，只能靠它恢复资金。请抄写在纸上，不要截图或发给任何人。",
            )}
          </p>
          <RecoveryPhrase mnemonic={mnemonic} />
          <label className="check">
            <input
              type="checkbox"
              checked={backedUp}
              onChange={(e) => setBackedUp(e.target.checked)}
            />
            <span>{t("我已把助记词抄写在安全的地方。")}</span>
          </label>
        </>
      )}
      <button
        type="button"
        className="button block"
        aria-busy={busy}
        disabled={
          disabled ||
          busy ||
          !passwordOk(password, confirm) ||
          (!!mnemonic && !backedUp)
        }
        onClick={run}
      >
        {mnemonic ? t("创建工作空间 →") : t("生成隐私钱包 →")}
      </button>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/** Restores the wallet on this device; the phrase must produce the registered address. */
export function ImportVault({
  expectedAddress,
  onImported,
}: {
  expectedAddress?: string;
  onImported: (address: string) => void | Promise<void>;
}) {
  const { t } = useI18n();
  const [mnemonic, setMnemonic] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <form
      className="vault-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
          const { address } = await vault.create({
            mnemonic,
            password,
            fresh: false,
            expectedAddress,
          });
          await onImported(address);
        } catch (err) {
          setError(vaultErrorText(err, t));
        } finally {
          setBusy(false);
        }
      }}
    >
      <label className="field">
        <span>{t("助记词")}</span>
        <textarea
          rows={3}
          className="mono-input"
          value={mnemonic}
          onChange={(e) => setMnemonic(e.target.value)}
          autoComplete="off"
          spellCheck={false}
          placeholder={t("12 或 24 个英文单词，用空格分隔")}
        />
      </label>
      <PasswordFields
        password={password}
        confirm={confirm}
        onPassword={setPassword}
        onConfirm={setConfirm}
      />
      <button
        className="button block"
        aria-busy={busy}
        disabled={busy || !mnemonic.trim() || !passwordOk(password, confirm)}
      >
        {t("导入钱包")}
      </button>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}

export function UnlockVault() {
  const { t } = useI18n();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <form
      className="vault-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
          await vault.unlock(password);
          setPassword("");
          void vault.ensureSynced().catch(() => {});
        } catch (err) {
          setError(vaultErrorText(err, t));
        } finally {
          setBusy(false);
        }
      }}
    >
      <label className="field">
        <span>{t("钱包密码")}</span>
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
        />
      </label>
      <button
        className="button block"
        aria-busy={busy}
        disabled={busy || !password}
      >
        <Icon name="lock" />
        {t("解锁")}
      </button>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
