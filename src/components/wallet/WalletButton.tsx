"use client";
import { useI18n } from "@/i18n/I18nProvider";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { useState } from "react";
import { useWalletLogin } from "@/components/wallet/useWalletLogin";
import {
  PICKER_CLOSED,
  useWalletPicker,
} from "@/components/wallet/WalletPicker";

/** In-page wallet control: `login` signs in a merchant; otherwise it only connects (checkout). */
export function WalletButton({
  login = false,
  onLogin,
  block = false,
}: {
  login?: boolean;
  onLogin?: () => void | Promise<void>;
  block?: boolean;
}) {
  const { t } = useI18n();
  const { address, chainId } = useAccount();
  const { connectAsync } = useConnect();
  const pick = useWalletPicker();
  const { switchChainAsync } = useSwitchChain();
  const { disconnect } = useDisconnect();
  const signIn = useWalletLogin(() => onLogin?.());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function connect() {
    setBusy(true);
    setError("");
    try {
      if (!address) await connectAsync({ connector: await pick("connect") });
      if (chainId !== 56) await switchChainAsync({ chainId: 56 });
    } catch (e) {
      if (e instanceof Error && e.message === PICKER_CLOSED) return;
      setError(e instanceof Error ? e.message : t("钱包请求失败"));
    } finally {
      setBusy(false);
    }
  }
  const connected = address && !login && chainId === 56;
  const isBusy = login ? signIn.busy : busy;
  const message = login ? signIn.error : error;
  return (
    <div className={"wallet" + (block ? " block" : "")}>
      {connected ? (
        <div className="wallet-chip">
          <span className="wallet-dot" aria-hidden="true" />
          <span className="mono">
            {address.slice(0, 6) + "…" + address.slice(-4)}
          </span>
          <button className="text-button" onClick={() => disconnect()}>
            {t("断开连接")}
          </button>
        </div>
      ) : (
        <button
          className={"button" + (login ? "" : " secondary")}
          onClick={login ? signIn.login : connect}
          aria-busy={isBusy}
          disabled={isBusy}
        >
          {login
            ? t("连接钱包并登录")
            : address
              ? t("切换至 BNB Chain")
              : t("连接钱包")}
        </button>
      )}
      {message && (
        <p className="field-error" role="alert">
          {t(message)}
        </p>
      )}
    </div>
  );
}
