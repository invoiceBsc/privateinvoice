/// <reference lib="webworker" />
/**
 * The merchant's RAILGUN wallet, running entirely in this browser.
 * Keys are encrypted at rest (SDK storage in IndexedDB) with a key derived from the merchant's
 * password; the mnemonic and password never leave this worker except to show the recovery phrase
 * once at creation. The server never sees any of it.
 */
import Level from "level-js";
import { Buffer } from "buffer";
import { groth16 } from "snarkjs";
import { Mnemonic, Wallet } from "ethers";
import {
  ArtifactStore,
  awaitWalletScan,
  createRailgunWallet,
  deleteWalletByID,
  gasEstimateForUnprovenUnshield,
  generateUnshieldProof,
  getProver,
  getWalletTransactionHistory,
  loadProvider,
  loadWalletByID,
  populateProvedUnshield,
  refreshBalances,
  setOnBalanceUpdateCallback,
  setOnTXIDMerkletreeScanCallback,
  setOnUTXOMerkletreeScanCallback,
  startRailgunEngine,
  unloadWalletByID,
  type SnarkJSGroth16,
} from "@railgun-community/wallet";
import {
  EVMGasType,
  NETWORK_CONFIG,
  NetworkName,
  RailgunWalletBalanceBucket,
  TXIDVersion,
  getEVMGasTypeForTransaction,
  type TransactionGasDetails,
} from "@railgun-community/shared-models";

// snarkjs (via ffjavascript) proves with nested blob: workers, which stall inside this module
// worker. With no Worker constructor it computes single-threaded here instead; this worker is
// already off the main thread, so the page stays responsive.
(globalThis as { Worker?: unknown }).Worker = undefined;

const network = NetworkName.BNBChain;
const chain = NETWORK_CONFIG[network].chain;
const txid = TXIDVersion.V2_PoseidonMerkle;
const TOKENS = [
  "0x55d398326f99059ff775485246999027b3197955",
  "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d",
];
const META_DB = "private-invoice-vault-meta";

interface Meta {
  id: string;
  address: string;
  salt: Uint8Array;
  creationBlock: number | null;
}

let engineReady: Promise<void> | null = null;
let providerReady: Promise<void> | null = null;
let session: { meta: Meta; key: string; synced: boolean } | null = null;
const balances = new Map<string, Map<string, string>>(); // bucket -> token -> atomic

const post = (message: Record<string, unknown>) => postMessage(message);

// ---------- small IndexedDB key/value store for metadata and artifacts ----------
function openMeta() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(META_DB, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore("meta");
      request.result.createObjectStore("artifacts");
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error("Browser storage unavailable"));
  });
}
async function idb<T>(
  store: "meta" | "artifacts",
  mode: IDBTransactionMode,
  run: (s: IDBObjectStore) => IDBRequest,
): Promise<T> {
  const db = await openMeta();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(store, mode);
    const request = run(tx.objectStore(store));
    request.onsuccess = () => resolve(request.result as T);
    request.onerror = () => reject(new Error("Browser storage failed"));
    tx.oncomplete = () => db.close();
  });
}
const readMeta = () =>
  idb<Meta | undefined>("meta", "readonly", (s) => s.get("wallet"));
const writeMeta = (meta: Meta) =>
  idb("meta", "readwrite", (s) => s.put(meta, "wallet"));
const clearMeta = () => idb("meta", "readwrite", (s) => s.delete("wallet"));

// ---------- engine ----------
function startEngine() {
  engineReady ??= (async () => {
    post({ event: "stage", stage: "engine" });
    const artifacts = new ArtifactStore(
      async (path) => {
        const value = await idb<unknown>("artifacts", "readonly", (s) =>
          s.get(path),
        );
        if (typeof value === "string") return value;
        return value instanceof Uint8Array ? Buffer.from(value) : null;
      },
      async (_dir, path, item) => {
        await idb("artifacts", "readwrite", (s) =>
          s.put(typeof item === "string" ? item : Uint8Array.from(item), path),
        );
      },
      async (path) =>
        (await idb<number>("artifacts", "readonly", (s) => s.count(path))) > 0,
    );
    await startRailgunEngine(
      "privateinvoice",
      new Level("private-invoice-vault-engine"),
      false,
      artifacts,
      false,
      false,
      ["https://ppoi.fdi.network"],
      [],
      false,
    );
    // The SDK's Groth16 type is broader than @types/snarkjs; this is the documented bridge.
    getProver().setSnarkJSGroth16(groth16 as unknown as SnarkJSGroth16);
    setOnUTXOMerkletreeScanCallback((e) =>
      post({
        event: "scan",
        tree: "utxo",
        status: e.scanStatus,
        progress: e.progress,
      }),
    );
    setOnTXIDMerkletreeScanCallback((e) =>
      post({
        event: "scan",
        tree: "txid",
        status: e.scanStatus,
        progress: e.progress,
      }),
    );
    setOnBalanceUpdateCallback((e) => {
      if (session && e.railgunWalletID !== session.meta.id) return;
      const tokens = new Map<string, string>();
      for (const a of e.erc20Amounts)
        tokens.set(a.tokenAddress.toLowerCase(), a.amount.toString());
      balances.set(e.balanceBucket, tokens);
      post({ event: "balances", balances: summarize() });
    });
  })().catch((error) => {
    engineReady = null;
    throw error;
  });
  return engineReady;
}

/** Spendable vs. pending vs. needs-attention per token, following Private POI buckets. */
function summarize() {
  const group: Record<string, string[]> = {
    spendable: [RailgunWalletBalanceBucket.Spendable],
    pending: [
      RailgunWalletBalanceBucket.ShieldPending,
      RailgunWalletBalanceBucket.ProofSubmitted,
    ],
    attention: [
      RailgunWalletBalanceBucket.ShieldBlocked,
      RailgunWalletBalanceBucket.MissingInternalPOI,
      RailgunWalletBalanceBucket.MissingExternalPOI,
    ],
  };
  return TOKENS.map((token) => {
    const sum = (buckets: string[]) =>
      buckets
        .reduce(
          (total, b) => total + BigInt(balances.get(b)?.get(token) ?? "0"),
          0n,
        )
        .toString();
    return {
      tokenAddress: token,
      spendable: sum(group.spendable),
      pending: sum(group.pending),
      attention: sum(group.attention),
    };
  });
}

async function deriveKey(password: string, salt: Uint8Array) {
  if (password.length < 10) throw new Error("PASSWORD_TOO_SHORT");
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: Uint8Array.from(salt),
      iterations: 600_000,
    },
    material,
    256,
  );
  return Buffer.from(bits).toString("hex");
}

function ensureProvider(rpcUrl: string) {
  providerReady ??= (async () => {
    post({ event: "stage", stage: "provider" });
    await loadProvider(
      {
        chainId: 56,
        providers: [
          { provider: rpcUrl, priority: 1, weight: 2, maxLogsPerBatch: 1000 },
        ],
      },
      network,
      15_000,
    );
  })().catch((error) => {
    providerReady = null;
    throw error;
  });
  return providerReady;
}

function requireSession() {
  if (!session) throw new Error("VAULT_LOCKED");
  return session;
}

// ---------- operations ----------
type Request = { id: number; type: string } & Record<string, unknown>;
const ops: Record<string, (r: Request) => Promise<unknown>> = {
  async status() {
    const meta = await readMeta();
    return {
      hasWallet: !!meta,
      address: meta?.address ?? null,
      unlocked: !!session,
      synced: !!session?.synced,
      balances: session?.synced ? summarize() : null,
    };
  },

  async generate() {
    return { mnemonic: Wallet.createRandom().mnemonic!.phrase };
  },

  async create(r) {
    await startEngine();
    if (await readMeta()) throw new Error("VAULT_EXISTS");
    const mnemonic = String(r.mnemonic ?? "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
    if (!Mnemonic.isValidMnemonic(mnemonic))
      throw new Error("INVALID_MNEMONIC");
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const key = await deriveKey(String(r.password ?? ""), salt);
    // New wallets only need scanning from now on; imported ones scan full history.
    const creationBlock =
      typeof r.creationBlock === "number" ? r.creationBlock : null;
    const wallet = await createRailgunWallet(
      key,
      mnemonic,
      creationBlock ? { [network]: creationBlock } : undefined,
    );
    if (r.expectedAddress && wallet.railgunAddress !== r.expectedAddress) {
      await deleteWalletByID(wallet.id);
      throw new Error("ADDRESS_MISMATCH");
    }
    const meta: Meta = {
      id: wallet.id,
      address: wallet.railgunAddress,
      salt,
      creationBlock,
    };
    await writeMeta(meta);
    session = { meta, key, synced: false };
    return { address: wallet.railgunAddress };
  },

  async unlock(r) {
    await startEngine();
    const meta = await readMeta();
    if (!meta) throw new Error("NO_VAULT");
    const key = await deriveKey(String(r.password ?? ""), meta.salt);
    try {
      await loadWalletByID(key, meta.id, false);
    } catch {
      throw new Error("WRONG_PASSWORD");
    }
    session = { meta, key, synced: false };
    return { address: meta.address };
  },

  async lock() {
    if (session) unloadWalletByID(session.meta.id);
    session = null;
    balances.clear();
    return { locked: true };
  },

  async sync(r) {
    const { meta } = requireSession();
    await ensureProvider(String(r.rpcUrl));
    post({ event: "stage", stage: "scan" });
    const scanned = awaitWalletScan(meta.id, chain);
    // refreshBalances never settles when the tail-of-chain RPC scan is incomplete (free RPCs
    // refuse eth_getLogs); the wallet-scan event is the real completion signal. Recent blocks
    // not yet in RAILGUN's indexer are picked up on the next sync.
    refreshBalances(chain, [meta.id]).catch(() => {});
    await scanned;
    if (session?.meta.id === meta.id) session.synced = true;
    post({ event: "stage", stage: "ready" });
    return { balances: summarize() };
  },

  async history() {
    const { meta } = requireSession();
    const items = await getWalletTransactionHistory(chain, meta.id, undefined);
    return items
      .filter((h) => h.receiveERC20Amounts.length > 0)
      .map((h) => ({
        txid: h.txid,
        timestamp: h.timestamp,
        blockNumber: h.blockNumber,
        received: h.receiveERC20Amounts.map((a) => ({
          tokenAddress: a.tokenAddress.toLowerCase(),
          amount: a.amount.toString(),
          state: a.balanceBucket,
        })),
      }))
      .sort((a, b) => (b.blockNumber ?? 0) - (a.blockNumber ?? 0));
  },

  /**
   * Builds a proven unshield to a public address. The merchant's own public wallet sends it
   * (and pays BNB gas), so no Broadcaster is involved.
   */
  async withdraw(r) {
    const { meta, key } = requireSession();
    await ensureProvider(String(r.rpcUrl));
    const recipients = [
      {
        tokenAddress: String(r.tokenAddress).toLowerCase(),
        amount: BigInt(String(r.amount)),
        recipientAddress: String(r.destination),
      },
    ];
    const evmGasType = getEVMGasTypeForTransaction(network, true);
    const gasPrice = BigInt(String(r.gasPrice));
    const base =
      evmGasType === EVMGasType.Type2
        ? {
            evmGasType,
            gasEstimate: 0n,
            maxFeePerGas: gasPrice,
            maxPriorityFeePerGas: gasPrice,
          }
        : { evmGasType, gasEstimate: 0n, gasPrice };
    post({ event: "stage", stage: "estimate" });
    const { gasEstimate } = await gasEstimateForUnprovenUnshield(
      txid,
      network,
      meta.id,
      key,
      recipients,
      [],
      base as TransactionGasDetails,
      undefined,
      true,
    );
    post({ event: "stage", stage: "prove" });
    await generateUnshieldProof(
      txid,
      network,
      meta.id,
      key,
      recipients,
      [],
      undefined,
      true,
      undefined,
      (progress) => post({ event: "proof", progress }),
    );
    const { transaction } = await populateProvedUnshield(
      txid,
      network,
      meta.id,
      recipients,
      [],
      undefined,
      true,
      undefined,
      { ...base, gasEstimate } as TransactionGasDetails,
    );
    return {
      to: transaction.to,
      data: transaction.data,
      gasLimit: transaction.gasLimit?.toString() ?? null,
    };
  },

  async forget(r) {
    const meta = await readMeta();
    if (!meta) return { forgotten: true };
    if (r.confirmAddress !== meta.address)
      throw new Error("CONFIRMATION_MISMATCH");
    await startEngine();
    if (session) unloadWalletByID(meta.id);
    await deleteWalletByID(meta.id).catch(() => {});
    await clearMeta();
    session = null;
    balances.clear();
    return { forgotten: true };
  },
};

const KNOWN = new Set([
  "PASSWORD_TOO_SHORT",
  "VAULT_EXISTS",
  "INVALID_MNEMONIC",
  "ADDRESS_MISMATCH",
  "NO_VAULT",
  "WRONG_PASSWORD",
  "VAULT_LOCKED",
  "CONFIRMATION_MISMATCH",
]);

self.onmessage = async (e: MessageEvent<Request>) => {
  const { id, type } = e.data;
  try {
    const op = ops[type];
    if (!op) throw new Error("UNSUPPORTED");
    const result = await op(e.data);
    post({
      id,
      result: JSON.parse(
        JSON.stringify(result ?? null, (_k, v) =>
          typeof v === "bigint" ? v.toString() : v,
        ),
      ),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // Known codes are translated by the page; anything else is reported without secrets.
    post({
      id,
      error: KNOWN.has(message) ? message : "VAULT_ERROR",
      detail: KNOWN.has(message) ? undefined : message.slice(0, 300),
    });
  }
};
post({ event: "ready" });
