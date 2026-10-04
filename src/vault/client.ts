"use client";
import { useSyncExternalStore } from "react";

/**
 * Main-thread side of the in-browser RAILGUN vault (public/vault, built from /vault).
 * One worker per tab; it stays alive across client-side navigation, so an unlocked
 * wallet remains unlocked until the tab is closed or the merchant locks it.
 */
export interface TokenBalance {
  tokenAddress: string;
  spendable: string;
  pending: string;
  attention: string;
}
export interface IncomingItem {
  txid: string;
  timestamp: number | null;
  blockNumber: number | null;
  received: { tokenAddress: string; amount: string; state: string }[];
}
export type Stage =
  | "idle"
  | "loading"
  | "engine"
  | "provider"
  | "scan"
  | "ready"
  | "estimate"
  | "prove";
export interface VaultState {
  loaded: boolean;
  hasWallet: boolean;
  address: string | null;
  unlocked: boolean;
  stage: Stage;
  utxo: number;
  txid: number;
  proof: number;
  balances: TokenBalance[] | null;
  error: string;
}

const initial: VaultState = {
  loaded: false,
  hasWallet: false,
  address: null,
  unlocked: false,
  stage: "idle",
  utxo: 0,
  txid: 0,
  proof: 0,
  balances: null,
  error: "",
};
let state = initial;
const listeners = new Set<() => void>();
function set(patch: Partial<VaultState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

let syncing: Promise<void> | null = null;
let worker: Worker | null = null;
let starting: Promise<Worker> | null = null;
let sequence = 0;
const pending = new Map<
  number,
  { resolve: (v: unknown) => void; reject: (e: Error) => void }
>();

export class VaultError extends Error {
  constructor(
    readonly code: string,
    readonly detail?: string,
  ) {
    super(code);
  }
}

async function start() {
  if (worker) return worker;
  starting ??= (async () => {
    set({ stage: "loading" });
    const manifest = (await (
      await fetch("/vault/manifest.json")
    ).json()) as Record<string, { file: string; isEntry?: boolean }>;
    const entry = Object.values(manifest).find((e) => e.isEntry);
    if (!entry) throw new VaultError("VAULT_UNAVAILABLE");
    const w = new Worker("/vault/" + entry.file, { type: "module" });
    w.onmessage = (e) => {
      const d = e.data;
      if (d.event === "stage") set({ stage: d.stage });
      else if (d.event === "scan") {
        // "Complete" and "Incomplete" both end a pass; the engine reports 0% for them.
        const progress = d.status === "Updated" ? (d.progress ?? 0) : 1;
        set(d.tree === "utxo" ? { utxo: progress } : { txid: progress });
      } else if (d.event === "proof") set({ proof: d.progress ?? 0 });
      else if (d.event === "balances") set({ balances: d.balances });
      else if (d.id) {
        const p = pending.get(d.id);
        pending.delete(d.id);
        if (!p) return;
        if (d.error) p.reject(new VaultError(d.error, d.detail));
        else p.resolve(d.result);
      }
    };
    w.onerror = () => {
      for (const p of pending.values())
        p.reject(new VaultError("VAULT_CRASHED"));
      pending.clear();
      worker = null;
      starting = null;
      set({ ...initial, loaded: true, error: "VAULT_CRASHED" });
    };
    worker = w;
    return w;
  })();
  return starting;
}

async function call<T>(type: string, data: Record<string, unknown> = {}) {
  const w = await start();
  const id = ++sequence;
  return new Promise<T>((resolve, reject) => {
    pending.set(id, { resolve: resolve as (v: unknown) => void, reject });
    w.postMessage({ id, type, ...data });
  });
}

const rpcUrl = () =>
  process.env.NEXT_PUBLIC_BNB_RPC_URL ?? "https://bsc-dataseed.bnbchain.org";

async function blockNumber() {
  const res = await fetch(rpcUrl(), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_blockNumber",
      params: [],
    }),
  }).then((r) => r.json());
  return Number(res.result);
}

export const vault = {
  async refresh() {
    const s = await call<{
      hasWallet: boolean;
      address: string | null;
      unlocked: boolean;
      synced: boolean;
      balances: TokenBalance[] | null;
    }>("status");
    set({
      hasWallet: s.hasWallet,
      address: s.address,
      unlocked: s.unlocked,
      balances: s.balances,
      loaded: true,
      stage: syncing ? state.stage : s.synced ? "ready" : "idle",
    });
    return s;
  },
  generate: () => call<{ mnemonic: string }>("generate"),
  /** New wallet (scans from now) or import (full history; must match the registered address). */
  async create(input: {
    mnemonic: string;
    password: string;
    fresh: boolean;
    expectedAddress?: string;
  }) {
    const creationBlock = input.fresh ? await blockNumber() : undefined;
    const result = await call<{ address: string }>("create", {
      mnemonic: input.mnemonic,
      password: input.password,
      creationBlock,
      expectedAddress: input.expectedAddress,
    });
    set({
      hasWallet: true,
      unlocked: true,
      address: result.address,
      error: "",
    });
    return result;
  },
  async unlock(password: string) {
    const result = await call<{ address: string }>("unlock", { password });
    set({ unlocked: true, address: result.address, error: "", stage: "idle" });
    return result;
  },
  async lock() {
    await call("lock");
    set({ unlocked: false, balances: null, stage: "idle", utxo: 0, txid: 0 });
  },
  /** Syncs the unlocked wallet; concurrent callers share one run. */
  sync() {
    syncing ??= (async () => {
      set({ error: "", utxo: 0, txid: 0 });
      try {
        const r = await call<{ balances: TokenBalance[] }>("sync", {
          rpcUrl: rpcUrl(),
        });
        set({ balances: r.balances, stage: "ready" });
      } catch (e) {
        set({
          error: e instanceof VaultError ? e.code : "VAULT_ERROR",
          stage: "idle",
        });
        throw e;
      } finally {
        syncing = null;
      }
    })();
    return syncing;
  },
  /** Starts a sync unless one finished for this unlock or is already running. */
  ensureSynced(): Promise<void> {
    if (!state.unlocked || state.stage === "ready") return Promise.resolve();
    return vault.sync();
  },
  history: () => call<IncomingItem[]>("history"),
  async withdraw(input: {
    tokenAddress: string;
    amount: string;
    destination: string;
    gasPrice: string;
  }) {
    set({ proof: 0 });
    try {
      return await call<{ to: string; data: string; gasLimit: string | null }>(
        "withdraw",
        { ...input, rpcUrl: rpcUrl() },
      );
    } finally {
      set({ stage: "ready" });
    }
  },
  async forget(confirmAddress: string) {
    await call("forget", { confirmAddress });
    set({ ...initial, loaded: true });
  },
};

export function useVault() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => state,
    () => initial,
  );
}
