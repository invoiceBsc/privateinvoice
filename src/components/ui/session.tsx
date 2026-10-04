"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { api } from "@/lib/client";

export interface Merchant {
  displayName: string;
  railgunAddress: string;
}
export interface Account {
  authenticated: boolean;
  address: string | null;
  merchant: Merchant | null;
  provider: string;
}
interface Session {
  /** null while the first request is in flight. */
  account: Account | null;
  error: string;
  refresh: () => Promise<Account | null>;
}
const SessionContext = createContext<Session | null>(null);

/** Loads the signed-in account once for the whole site (header and workspace). */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [error, setError] = useState("");
  const refresh = useCallback(async () => {
    try {
      const next = await api<Account>("merchant");
      setAccount(next);
      setError("");
      return next;
    } catch (e) {
      setError(e instanceof Error ? e.message : "工作空间加载失败");
      return null;
    }
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => void refresh(), 0);
    return () => clearTimeout(timer);
  }, [refresh]);
  return (
    <SessionContext.Provider value={{ account, error, refresh }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const session = useContext(SessionContext);
  if (!session) throw new Error("SessionProvider is required");
  return session;
}

/** For workspace pages, which only render once a merchant exists. */
export function useMerchant() {
  const { account, refresh } = useSession();
  if (!account?.merchant) throw new Error("Merchant workspace is required");
  return { merchant: account.merchant, refresh };
}
