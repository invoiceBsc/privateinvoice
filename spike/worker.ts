import Level from "level-js";
import { Buffer } from "buffer";
import { groth16 } from "snarkjs";
import { Wallet } from "ethers";
import {
  startRailgunEngine,
  ArtifactStore,
  getProver,
  createRailgunWallet,
  loadWalletByID,
  loadProvider,
  type SnarkJSGroth16,
  refreshBalances,
  awaitWalletScan,
  getWalletTransactionHistory,
  setOnBalanceUpdateCallback,
  populateShield,
} from "@railgun-community/wallet";
import {
  NetworkName,
  NETWORK_CONFIG,
  TXIDVersion,
} from "@railgun-community/shared-models";
const network = NetworkName.BNBChain;
const chain = NETWORK_CONFIG[network].chain;
let walletId: string | undefined;
let initialized = false;
const openDB = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const r = indexedDB.open("private-invoice-spike-metadata", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("items");
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(new Error("Browser storage unavailable"));
  });
async function read(key: string) {
  const db = await openDB();
  return new Promise<unknown>((resolve, reject) => {
    const t = db.transaction("items", "readonly");
    const r = t.objectStore("items").get(key);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(new Error("Storage read failed"));
    t.oncomplete = () => db.close();
  });
}
async function write(key: string, value: unknown) {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const t = db.transaction("items", "readwrite");
    t.objectStore("items").put(value, key);
    t.oncomplete = () => {
      db.close();
      resolve();
    };
    t.onerror = () => reject(new Error("Storage write failed"));
  });
}
function stage(text: string) {
  postMessage({ stage: text });
}
async function initialize() {
  if (initialized) return;
  stage("Initializing privacy engine");
  const store = new ArtifactStore(
    async (path) => {
      const value = await read("artifact:" + path);
      return typeof value === "string"
        ? value
        : value instanceof Uint8Array
          ? Buffer.from(value)
          : null;
    },
    async (_dir, path, item) =>
      write(
        "artifact:" + path,
        typeof item === "string" ? item : Uint8Array.from(item),
      ),
    async (path) => (await read("artifact:" + path)) !== undefined,
  );
  await startRailgunEngine(
    "privateinvoice",
    new Level("private-invoice-spike-engine"),
    false,
    store,
    false,
    false,
    ["https://ppoi.fdi.network"],
    [],
    false,
  ); // Official SDK uses broader bigint input types than @types/snarkjs; the documented bridge uses this cast.
  getProver().setSnarkJSGroth16(groth16 as unknown as SnarkJSGroth16);
  setOnBalanceUpdateCallback((event) =>
    postMessage({
      balances: {
        ...event,
        erc20Amounts: event.erc20Amounts.map((a) => ({
          ...a,
          amount: a.amount.toString(),
        })),
      },
    }),
  );
  initialized = true;
  stage("Privacy engine initialized");
}
async function key(password: string, salt: Uint8Array) {
  if (password.length < 12)
    throw new Error("Use a password of at least 12 characters");
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bytes = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: Uint8Array.from(salt).buffer,
      iterations: 600000,
    },
    material,
    256,
  );
  return Array.from(new Uint8Array(bytes), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}
async function execute(message: {
  type: string;
  password?: string;
  mnemonic?: string;
  recipient?: string;
  amount?: string;
  tokenAddress?: string;
  rpcURL?: string;
}) {
  switch (message.type) {
    case "generate":
      return { mnemonic: Wallet.createRandom().mnemonic?.phrase };
    case "initialize":
      await initialize();
      return { ready: true };
    case "create": {
      await initialize();
      const existing = await read("wallet");
      if (existing)
        throw new Error("A local wallet already exists. Use Unlock instead.");
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const encryptionKey = await key(message.password ?? "", salt);
      const wallet = await createRailgunWallet(
        encryptionKey,
        message.mnemonic ?? "",
        undefined,
      );
      walletId = wallet.id;
      await write("wallet", { id: wallet.id, salt });
      return { id: wallet.id, address: wallet.railgunAddress };
    }
    case "load": {
      await initialize();
      const metadata = (await read("wallet")) as
        { id: string; salt: Uint8Array } | undefined;
      if (!metadata) throw new Error("No encrypted wallet on this browser");
      const wallet = await loadWalletByID(
        await key(message.password ?? "", metadata.salt),
        metadata.id,
        false,
      );
      walletId = wallet.id;
      return { id: wallet.id, address: wallet.railgunAddress };
    }
    case "network": {
      await initialize();
      stage("Loading BNB provider and Private POI");
      const rpcURL = message.rpcURL ?? "https://bsc-dataseed.bnbchain.org";
      const response = await loadProvider(
        {
          chainId: 56,
          providers: [
            { provider: rpcURL, priority: 1, weight: 2, maxLogsPerBatch: 1000 },
          ],
        },
        network,
      );
      return { network, chain, fees: response.feesSerialized };
    }
    case "scan": {
      if (!walletId) throw new Error("Unlock your wallet first");
      stage("Scanning private balance");
      // Subscribe before starting the scan so a fast completion event cannot be missed.
      const completed = awaitWalletScan(walletId, chain);
      let timer: ReturnType<typeof setTimeout> | undefined;
      const deadline = new Promise<never>((_resolve, reject) => {
        timer = setTimeout(
          () => reject(new Error("Wallet scan incomplete")),
          60000,
        );
      });
      try {
        await Promise.race([
          Promise.all([refreshBalances(chain, [walletId]), completed]),
          deadline,
        ]);
      } finally {
        if (timer) clearTimeout(timer);
      }
      const history = await getWalletTransactionHistory(
        chain,
        walletId,
        undefined,
      );
      return {
        history: history.map((h) => ({
          ...h,
          receiveERC20Amounts: h.receiveERC20Amounts.map((a) => ({
            ...a,
            amount: a.amount.toString(),
          })),
        })),
      };
    }
    case "shield": {
      if (!message.recipient || !message.tokenAddress || !message.amount)
        throw new Error("Recipient, token and atomic amount required");
      if (
        ![
          "0x55d398326f99059ff775485246999027b3197955",
          "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d",
        ].includes(message.tokenAddress.toLowerCase())
      )
        throw new Error("Unsupported token");
      if (BigInt(message.amount) <= 0n) throw new Error("Invalid amount");
      stage("Constructing unsigned Shield transaction");
      const shieldKey = Buffer.from(
        crypto.getRandomValues(new Uint8Array(32)),
      ).toString("hex");
      const response = await populateShield(
        TXIDVersion.V2_PoseidonMerkle,
        network,
        shieldKey,
        [
          {
            tokenAddress: message.tokenAddress,
            amount: BigInt(message.amount),
            recipientAddress: message.recipient,
          },
        ],
        [],
      );
      return { transaction: response.transaction };
    }
    default:
      throw new Error("Unsupported operation");
  }
}
self.onmessage = async (e) => {
  const id = e.data.id;
  try {
    const result = await execute(e.data);
    postMessage({
      id,
      result: JSON.parse(
        JSON.stringify(result, (_k, v) =>
          typeof v === "bigint" ? v.toString() : v,
        ),
      ),
    });
  } catch {
    postMessage({
      id,
      error:
        "RAILGUN operation failed. Check storage, password, provider availability and scan progress. No transaction was submitted.",
    });
  }
};
