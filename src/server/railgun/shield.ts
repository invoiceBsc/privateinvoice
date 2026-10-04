import { randomBytes } from "node:crypto";
import {
  ABIRailgunSmartWallet,
  ByteUtils,
  RailgunEngine,
  ShieldNoteERC20,
} from "@railgun-community/engine";
import {
  createPublicClient,
  decodeEventLog,
  encodeFunctionData,
  http,
  type Abi,
  type Hex,
  type TransactionReceipt,
} from "viem";
import { bsc } from "viem/chains";

/** RAILGUN V2 proxy on BNB Chain (shared-models NETWORK_CONFIG, verified on-chain). */
export const RAILGUN_PROXY = "0x590162bf4b50f6576a459b75309ee21d92178a10";
const abi = ABIRailgunSmartWallet as unknown as Abi;

export function chainClient() {
  const url = process.env.BNB_RPC_URL ?? process.env.NEXT_PUBLIC_BNB_RPC_URL;
  if (!url) throw new Error("BNB RPC is not configured");
  return createPublicClient({ chain: bsc, transport: http(url) });
}

/** Parses a 0zk address; throws when it is not a valid RAILGUN address usable on BNB Chain. */
export function decodeRailgunAddress(address: string) {
  const data = RailgunEngine.decodeAddress(address.trim());
  // Addresses are either network-agnostic or bound to one chain.
  if (data.chain && !(data.chain.type === 0 && data.chain.id === 56))
    throw new Error("RAILGUN address is bound to another network");
  return data;
}

export function isRailgunAddress(address: string) {
  try {
    decodeRailgunAddress(address);
    return true;
  } catch {
    return false;
  }
}

/** Smallest gross G with G - floor(G·bps/10000) = net, matching RailgunLogic.getFee (inclusive). */
export function grossForNet(net: bigint, bps: bigint) {
  const base = (g: bigint) => g - (g * bps) / 10000n;
  let g = (net * 10000n + (10000n - bps) - 1n) / (10000n - bps);
  while (base(g) > net) g--;
  while (base(g) < net) g++;
  while (g > 0n && base(g - 1n) === net) g--;
  return g;
}

let feeCache: { bps: bigint; at: number } | null = null;
export async function shieldFeeBps() {
  if (feeCache && Date.now() - feeCache.at < 300_000) return feeCache.bps;
  const bps = (await chainClient().readContract({
    address: RAILGUN_PROXY,
    abi,
    functionName: "shieldFee",
  })) as bigint;
  if (bps < 0n || bps >= 10000n)
    throw new Error("Unexpected RAILGUN shield fee");
  feeCache = { bps, at: Date.now() };
  return bps;
}

export interface BuiltShield {
  grossAtomic: string;
  feeAtomic: string;
  feeBps: number;
  shieldPublicKey: string;
  notePublicKey: string;
  encryptedBundle: [string, string, string];
  calldata: Hex;
  createdBlock: number;
}

/**
 * Builds a public-to-private Shield that delivers exactly `netAtomic` to the merchant's 0zk address.
 * The ephemeral shield private key lives only for this call: the stored public values are enough
 * to recognise the commitment, and the merchant decrypts it with their own viewing key.
 */
export async function buildShield(
  merchantAddress: string,
  tokenAddress: string,
  netAtomic: bigint,
): Promise<BuiltShield> {
  const recipient = decodeRailgunAddress(merchantAddress);
  const client = chainClient();
  const [bps, block] = await Promise.all([
    shieldFeeBps(),
    client.getBlockNumber(),
  ]);
  const gross = grossForNet(netAtomic, bps);
  const shieldPrivateKey = randomBytes(32);
  const note = new ShieldNoteERC20(
    recipient.masterPublicKey,
    ByteUtils.randomHex(16),
    gross,
    tokenAddress.toLowerCase(),
  );
  const request = await note.serialize(
    shieldPrivateKey,
    recipient.viewingPublicKey,
  );
  shieldPrivateKey.fill(0);
  const bundle = request.ciphertext.encryptedBundle.map((part) =>
    String(part).toLowerCase(),
  ) as [string, string, string];
  const calldata = encodeFunctionData({
    abi,
    functionName: "shield",
    args: [
      [
        {
          preimage: {
            npk: request.preimage.npk as Hex,
            token: {
              tokenType: Number(request.preimage.token.tokenType),
              tokenAddress: request.preimage.token.tokenAddress as Hex,
              tokenSubID: BigInt(request.preimage.token.tokenSubID),
            },
            value: BigInt(request.preimage.value),
          },
          ciphertext: {
            encryptedBundle: bundle as [Hex, Hex, Hex],
            shieldKey: request.ciphertext.shieldKey as Hex,
          },
        },
      ],
    ],
  });
  return {
    grossAtomic: gross.toString(),
    feeAtomic: (gross - netAtomic).toString(),
    feeBps: Number(bps),
    shieldPublicKey: String(request.ciphertext.shieldKey).toLowerCase(),
    notePublicKey: String(request.preimage.npk).toLowerCase(),
    encryptedBundle: bundle,
    calldata,
    createdBlock: Number(block),
  };
}

export interface ExpectedShield {
  shieldPublicKey: string;
  notePublicKey: string;
  encryptedBundle: string[];
  tokenAddress: string;
  netAtomic: string;
}

export type ShieldMatch =
  | { kind: "match"; blockNumber: number; payer: string | null }
  | { kind: "absent" }
  | { kind: "mismatch"; code: string; detail: string; blockNumber: number };

interface ShieldEventArgs {
  commitments: readonly {
    npk: Hex;
    token: { tokenType: number; tokenAddress: Hex; tokenSubID: bigint };
    value: bigint;
  }[];
  shieldCiphertext: readonly {
    encryptedBundle: readonly Hex[];
    shieldKey: Hex;
  }[];
}

/** Decodes every RAILGUN Shield event in a receipt (or log list) from the BNB proxy. */
export function shieldCommitments(
  logs: TransactionReceipt["logs"],
): { blockNumber: number; transactionHash: Hex; args: ShieldEventArgs }[] {
  const out = [];
  for (const log of logs) {
    if (log.address.toLowerCase() !== RAILGUN_PROXY) continue;
    try {
      const event = decodeEventLog({ abi, data: log.data, topics: log.topics });
      if (event.eventName !== "Shield") continue;
      out.push({
        blockNumber: Number(log.blockNumber),
        transactionHash: log.transactionHash as Hex,
        args: event.args as unknown as ShieldEventArgs,
      });
    } catch {
      /* Not a decodable RAILGUN event. */
    }
  }
  return out;
}

/**
 * Finds this payment's commitment by its shield key and checks every field the merchant's
 * wallet relies on: note public key (binds the recipient), ciphertext (lets them decrypt),
 * token, and the post-fee value.
 */
export function matchShield(
  logs: TransactionReceipt["logs"],
  expected: ExpectedShield,
  payer: string | null,
): ShieldMatch {
  for (const event of shieldCommitments(logs)) {
    const index = event.args.shieldCiphertext.findIndex(
      (c) => c.shieldKey.toLowerCase() === expected.shieldPublicKey,
    );
    if (index < 0) continue;
    const preimage = event.args.commitments[index];
    const ciphertext = event.args.shieldCiphertext[index];
    const fail = (code: string, detail: string): ShieldMatch => ({
      kind: "mismatch",
      code,
      detail,
      blockNumber: event.blockNumber,
    });
    if (preimage.npk.toLowerCase() !== expected.notePublicKey)
      return fail(
        "NOTE_KEY",
        "Note public key differs from the issued payment",
      );
    if (
      ciphertext.encryptedBundle.map((p) => p.toLowerCase()).join() !==
      expected.encryptedBundle.join()
    )
      return fail(
        "CIPHERTEXT",
        "Encrypted note differs from the issued payment",
      );
    if (
      Number(preimage.token.tokenType) !== 0 ||
      preimage.token.tokenAddress.toLowerCase() !==
        expected.tokenAddress.toLowerCase()
    )
      return fail("TOKEN", "Payment used a different token");
    if (preimage.value.toString() !== expected.netAtomic)
      return fail(
        "AMOUNT",
        `Received ${preimage.value} instead of ${expected.netAtomic}`,
      );
    return { kind: "match", blockNumber: event.blockNumber, payer };
  }
  return { kind: "absent" };
}
