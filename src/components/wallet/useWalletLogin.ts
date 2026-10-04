"use client";
import { useI18n } from "@/i18n/I18nProvider";
import { useState } from "react";
import { useAccount, useConnect, useSignMessage, useSwitchChain } from "wagmi";
import { api } from "@/lib/client";
import {
  PICKER_CLOSED,
  useWalletPicker,
} from "@/components/wallet/WalletPicker";

/** Connects an injected wallet, switches to BNB Chain and signs the login challenge. */
export function useWalletLogin(onLogin: () => void | Promise<void>) {
  const { t } = useI18n();
  const { address, chainId } = useAccount();
  const { connectAsync } = useConnect();
  const pick = useWalletPicker();
  const { switchChainAsync } = useSwitchChain();
  const { signMessageAsync } = useSignMessage();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function login() {
    setBusy(true);
    setError("");
    try {
      let account = address;
      if (!account) {
        const connector = await pick("login");
        const result = await connectAsync({ connector });
        account = result.accounts[0];
      }
      if (chainId !== 56) await switchChainAsync({ chainId: 56 });
      const challenge = await api<{ nonce: string; message: string }>(
        "auth/nonce",
        { address: account },
      );
      const signature = await signMessageAsync({ message: challenge.message });
      await api("auth/verify", {
        nonce: challenge.nonce,
        address: account,
        signature,
      });
      await onLogin();
    } catch (e) {
      if (e instanceof Error && e.message === PICKER_CLOSED) return;
      setError(e instanceof Error ? e.message : t("钱包请求失败"));
    } finally {
      setBusy(false);
    }
  }
  return { login, busy, error };
}
