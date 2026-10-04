"use client";
import { useI18n } from "@/i18n/I18nProvider";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useConnectors, type Connector } from "wagmi";
import { Icon } from "@/components/ui/Icon";

export type PickMode = "login" | "connect";
type Pick = (mode?: PickMode) => Promise<Connector>;
const PickerContext = createContext<Pick | null>(null);

/** Opens the wallet chooser and resolves with the connector the user picked. */
export function useWalletPicker() {
  const pick = useContext(PickerContext);
  if (!pick) throw new Error("WalletPickerProvider is required");
  return pick;
}

// Popular BNB Chain wallets offered as install links when they are not detected.
const POPULAR = [
  { name: "MetaMask", url: "https://metamask.io/download/", color: "#f6851b" },
  { name: "Rabby", url: "https://rabby.io/", color: "#7084ff" },
  { name: "OKX Wallet", url: "https://www.okx.com/web3", color: "#111111" },
  {
    name: "Binance Wallet",
    url: "https://www.binance.com/en/web3wallet",
    color: "#f0b90b",
  },
  {
    name: "Trust Wallet",
    url: "https://trustwallet.com/download",
    color: "#0500ff",
  },
];

// The generic injected connector is named "Injected"; name it after the provider when we can.
function injectedName() {
  const provider = (window as unknown as { ethereum?: Record<string, unknown> })
    .ethereum;
  if (!provider) return null;
  if (provider.isRabby) return "Rabby";
  if (provider.isOkxWallet || provider.isOKExWallet) return "OKX Wallet";
  if (provider.isBinance) return "Binance Wallet";
  if (provider.isTrust || provider.isTrustWallet) return "Trust Wallet";
  if (provider.isMetaMask) return "MetaMask";
  return "";
}

interface Option {
  key: string;
  name: string;
  icon?: string;
  connector: Connector;
}

function Picker({
  mode,
  onPick,
  onClose,
}: {
  mode: PickMode;
  onPick: (connector: Connector) => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const connectors = useConnectors();
  const first = useRef<HTMLButtonElement>(null);
  const [closing, setClosing] = useState(false);
  const [legacyName] = useState(injectedName);
  const discovered = connectors.filter((c) => c.id !== "injected");
  const generic = connectors.find((c) => c.id === "injected");
  const options: Option[] = discovered.map((c) => ({
    key: c.uid,
    name: c.name,
    icon: c.icon,
    connector: c,
  }));
  // Only fall back to window.ethereum when no wallet announced itself (EIP-6963).
  if (generic && legacyName !== null && !options.length)
    options.push({
      key: generic.uid,
      name: legacyName || t("浏览器钱包"),
      connector: generic,
    });
  const installed = new Set(options.map((o) => o.name.toLowerCase()));
  const suggestions = POPULAR.filter(
    (w) => !installed.has(w.name.toLowerCase()),
  );
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);
  // With reduced motion there is no exit animation to wait for.
  const close = useCallback(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches)
      onCloseRef.current();
    else setClosing(true);
  }, []);
  useEffect(() => {
    first.current?.focus();
    const key = (event: KeyboardEvent) => event.key === "Escape" && close();
    document.addEventListener("keydown", key);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", key);
      document.body.style.overflow = overflow;
    };
  }, [close]);
  return (
    <div
      className={"modal-backdrop" + (closing ? " closing" : "")}
      onPointerDown={(e) => e.target === e.currentTarget && close()}
      onAnimationEnd={(e) => {
        if (e.animationName === "backdrop-out") onClose();
      }}
    >
      <div
        className="modal wallet-picker"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wallet-picker-title"
      >
        <header className="modal-head">
          <h2 id="wallet-picker-title">{t("选择钱包")}</h2>
          <button
            className="icon-button"
            aria-label={t("关闭")}
            onClick={close}
          >
            <Icon name="close" />
          </button>
        </header>
        {options.length > 0 ? (
          <div className="wallet-options">
            <span className="wallet-group">{t("已检测到")}</span>
            {options.map((option, index) => (
              <button
                key={option.key}
                ref={index === 0 ? first : undefined}
                className="wallet-option"
                onClick={() => onPick(option.connector)}
              >
                {option.icon ? (
                  // eslint-disable-next-line @next/next/no-img-element -- wallet-provided data URI
                  <img src={option.icon} alt="" className="wallet-icon" />
                ) : (
                  <span className="wallet-icon fallback">
                    <Icon name="wallet" size={16} />
                  </span>
                )}
                <span className="wallet-name">{option.name}</span>
                <span className="wallet-tag">{t("已安装")}</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="wallet-empty">
            {t(
              "没有检测到浏览器钱包。安装一个钱包扩展，或在钱包 App 的内置浏览器中打开本页。",
            )}
          </p>
        )}
        {suggestions.length > 0 && (
          <div className="wallet-options">
            <span className="wallet-group">{t("其他钱包")}</span>
            {suggestions.map((wallet) => (
              <a
                key={wallet.name}
                className="wallet-option muted-option"
                href={wallet.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span
                  className="wallet-icon letter"
                  style={{ background: wallet.color }}
                >
                  {wallet.name.charAt(0)}
                </span>
                <span className="wallet-name">{wallet.name}</span>
                <span className="wallet-tag link">
                  {t("安装")}
                  <Icon name="external" size={12} />
                </span>
              </a>
            ))}
          </div>
        )}
        <p className="modal-foot">
          <Icon name="lock" size={13} />
          {mode === "login"
            ? t("仅签名一条登录消息，不会发起链上交易。")
            : t("连接后，付款前还需在钱包中确认。")}
        </p>
      </div>
    </div>
  );
}

export const PICKER_CLOSED = "WALLET_PICKER_CLOSED";

export function WalletPickerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [request, setRequest] = useState<{
    mode: PickMode;
    resolve: (connector: Connector) => void;
    reject: (error: Error) => void;
  } | null>(null);
  const pick = useCallback<Pick>(
    (mode = "login") =>
      new Promise((resolve, reject) => setRequest({ mode, resolve, reject })),
    [],
  );
  return (
    <PickerContext.Provider value={pick}>
      {children}
      {request && (
        <Picker
          mode={request.mode}
          onPick={(connector) => {
            request.resolve(connector);
            setRequest(null);
          }}
          onClose={() => {
            request.reject(new Error(PICKER_CLOSED));
            setRequest(null);
          }}
        />
      )}
    </PickerContext.Provider>
  );
}
