import { describe, expect, it } from "vitest";
import {
  ABIRailgunSmartWallet,
  ByteUtils,
  RailgunEngine,
  ShieldNoteERC20,
} from "@railgun-community/engine";
import { randomBytes } from "node:crypto";
import {
  encodeAbiParameters,
  toEventSelector,
  type Abi,
  type AbiEvent,
  type Hex,
} from "viem";
import {
  RAILGUN_PROXY,
  grossForNet,
  matchShield,
} from "@/server/railgun/shield";

const abi = ABIRailgunSmartWallet as unknown as Abi;
const shieldEvent = abi.find(
  (item) => item.type === "event" && item.name === "Shield",
) as AbiEvent;
const USDT = "0x55d398326f99059ff775485246999027b3197955";

describe("grossForNet", () => {
  // RailgunLogic.getFee(amount, isInclusive = true, feeBP): base = amount - amount * feeBP / 10000
  const base = (g: bigint, bps: bigint) => g - (g * bps) / 10000n;
  it("returns the smallest gross that nets exactly the invoice amount", () => {
    for (const bps of [0n, 25n, 30n, 100n]) {
      for (const net of [
        1n,
        399n,
        400n,
        12_345n,
        5000n * 10n ** 18n,
        123_456_789_012_345_678_901n,
      ]) {
        const g = grossForNet(net, bps);
        expect(base(g, bps)).toBe(net);
        if (g > 0n) expect(base(g - 1n, bps)).toBeLessThan(net);
      }
    }
  });
  it("matches the on-chain getFee sample for 5,000 USDT at 25 bps", () => {
    expect(grossForNet(5000n * 10n ** 18n, 25n)).toBe(5012531328320802005012n);
  });
});

// A real RAILGUN address with a known master/viewing key pair, generated for tests.
async function issue(net: bigint, gross: bigint) {
  const viewingPrivate = randomBytes(32);
  const { getPublicViewingKey } = await import("@railgun-community/engine");
  const viewingPublicKey = await getPublicViewingKey(viewingPrivate);
  const address = RailgunEngine.encodeAddress({
    masterPublicKey: 123456789n,
    viewingPublicKey,
  });
  const recipient = RailgunEngine.decodeAddress(address);
  const note = new ShieldNoteERC20(
    recipient.masterPublicKey,
    ByteUtils.randomHex(16),
    gross,
    USDT,
  );
  const request = await note.serialize(
    randomBytes(32),
    recipient.viewingPublicKey,
  );
  const bundle = request.ciphertext.encryptedBundle.map((p) =>
    String(p).toLowerCase(),
  );
  const expected = {
    shieldPublicKey: String(request.ciphertext.shieldKey).toLowerCase(),
    notePublicKey: String(request.preimage.npk).toLowerCase(),
    encryptedBundle: bundle,
    tokenAddress: USDT,
    netAtomic: net.toString(),
  };
  const log = (overrides: {
    value?: bigint;
    npk?: string;
    bundle?: string[];
    token?: string;
    address?: string;
  }) => {
    const args = {
      treeNumber: 0n,
      startPosition: 1n,
      commitments: [
        {
          npk: (overrides.npk ?? request.preimage.npk) as Hex,
          token: {
            tokenType: 0,
            tokenAddress: (overrides.token ?? USDT) as Hex,
            tokenSubID: 0n,
          },
          value: overrides.value ?? net,
        },
      ],
      shieldCiphertext: [
        {
          encryptedBundle: (overrides.bundle ?? bundle) as [Hex, Hex, Hex],
          shieldKey: request.ciphertext.shieldKey as Hex,
        },
      ],
      fees: [gross - net],
    };
    const encoded = {
      topics: [toEventSelector(shieldEvent)],
      data: encodeAbiParameters(shieldEvent.inputs, [
        args.treeNumber,
        args.startPosition,
        args.commitments,
        args.shieldCiphertext,
        args.fees,
      ] as never),
    };
    return [
      {
        address: (overrides.address ?? RAILGUN_PROXY) as Hex,
        data: encoded.data,
        topics: encoded.topics,
        blockNumber: 100n,
        transactionHash: ("0x" + "ab".repeat(32)) as Hex,
        logIndex: 0,
        blockHash: ("0x" + "cd".repeat(32)) as Hex,
        transactionIndex: 0,
        removed: false,
      },
    ] as never;
  };
  return { expected, log };
}

describe("matchShield", () => {
  const net = 5000n * 10n ** 18n;
  const gross = grossForNet(net, 25n);
  it("accepts the issued commitment with the exact post-fee value", async () => {
    const { expected, log } = await issue(net, gross);
    expect(matchShield(log({}), expected, "0xpayer")).toEqual({
      kind: "match",
      blockNumber: 100,
      payer: "0xpayer",
    });
  });
  it("rejects a short payment, a different note, a tampered ciphertext and another token", async () => {
    const { expected, log } = await issue(net, gross);
    expect(matchShield(log({ value: net - 1n }), expected, null)).toMatchObject(
      { kind: "mismatch", code: "AMOUNT" },
    );
    expect(
      matchShield(log({ npk: "0x" + "11".repeat(32) }), expected, null),
    ).toMatchObject({ kind: "mismatch", code: "NOTE_KEY" });
    const tampered = [...expected.encryptedBundle];
    tampered[1] = "0x" + "00".repeat(32);
    expect(
      matchShield(log({ bundle: tampered }), expected, null),
    ).toMatchObject({ kind: "mismatch", code: "CIPHERTEXT" });
    expect(
      matchShield(
        log({ token: "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d" }),
        expected,
        null,
      ),
    ).toMatchObject({ kind: "mismatch", code: "TOKEN" });
  });
  it("ignores Shield events from contracts other than the RAILGUN proxy", async () => {
    const { expected, log } = await issue(net, gross);
    expect(
      matchShield(
        log({ address: "0x000000000000000000000000000000000000dead" }),
        expected,
        null,
      ),
    ).toEqual({ kind: "absent" });
  });
});
