/**
 * Real RAILGUN payments against a BNB Chain fork (anvil). Runs only when FORK_APP_URL points at an
 * app instance started with PRIVACY_PROVIDER=railgun and BNB_RPC_URL set to the fork.
 */
import { test, expect, type Browser, type Page } from "@playwright/test";
import { createRequire } from "node:module";
import { randomBytes } from "node:crypto";
import path from "node:path";
import {
  createPublicClient,
  createTestClient,
  createWalletClient,
  decodeEventLog,
  erc20Abi,
  http,
  parseUnits,
  type Abi,
  type Hex,
} from "viem";
import { bsc } from "viem/chains";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import {
  ABIRailgunSmartWallet,
  RailgunEngine,
  ShieldNote,
  getPublicViewingKey,
} from "@railgun-community/engine";
import { grossForNet } from "@/server/railgun/shield";

const APP = process.env.FORK_APP_URL;
const RPC = process.env.FORK_RPC_URL ?? "http://127.0.0.1:8545";
const USDT = "0x55d398326f99059fF775485246999027B3197955";
const WHALE = "0x8894E0a0c962CB723c1976a4421c95949bE2D4E3";
const PROXY = "0x590162bf4b50f6576a459b75309ee21d92178a10";
// Anvil's unlocked development account #1.
const PAYER = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

test.skip(!APP, "Set FORK_APP_URL to run against a BNB Chain fork");
test.use({ baseURL: APP });
test.setTimeout(240_000);

const engineRequire = createRequire(path.join(process.cwd(), "package.json"));
const { getSharedSymmetricKey } = engineRequire(
  path.join(
    path.dirname(engineRequire.resolve("@railgun-community/engine")),
    "utils/keys-utils.js",
  ),
) as {
  getSharedSymmetricKey: (a: Uint8Array, b: Uint8Array) => Promise<Uint8Array>;
};

const chain = { ...bsc, rpcUrls: { default: { http: [RPC] } } };
const reader = createPublicClient({ chain, transport: http(RPC) });
const anvil = createTestClient({ chain, mode: "anvil", transport: http(RPC) });
const wallet = createWalletClient({ chain, transport: http(RPC) });
const usdtBalance = (who: Hex) =>
  reader.readContract({
    address: USDT,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [who],
  });
// The fork runs with --slots-in-an-epoch 1, so `finalized` trails `latest` by two blocks.
// Optional visual capture: SHOTS=<dir> saves the key screens of the real flow.
const shot = (page: Page, name: string) =>
  process.env.SHOTS
    ? page.screenshot({
        path: `${process.env.SHOTS}/${name}.png`,
        fullPage: true,
      })
    : Promise.resolve();
const finalize = () => anvil.mine({ blocks: 3 });

async function merchantWorkspace(browser: Browser) {
  const key = generatePrivateKey();
  const evm = privateKeyToAccount(key);
  const viewingPrivate = randomBytes(32);
  const masterPublicKey = BigInt("0x" + randomBytes(16).toString("hex"));
  const zk = RailgunEngine.encodeAddress({
    masterPublicKey,
    viewingPublicKey: await getPublicViewingKey(viewingPrivate),
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();
  await page.exposeFunction("signTestMessage", (hex: Hex) =>
    evm.signMessage({ message: { raw: hex } }),
  );
  await page.addInitScript(
    ({ address }) => {
      const w = window as unknown as {
        signTestMessage: (m: string) => Promise<string>;
        ethereum: unknown;
      };
      w.ethereum = {
        isMetaMask: true,
        on() {},
        removeListener() {},
        request: async ({
          method,
          params,
        }: {
          method: string;
          params?: unknown[];
        }) => {
          if (method === "eth_requestAccounts" || method === "eth_accounts")
            return [address];
          if (method === "eth_chainId") return "0x38";
          if (method === "wallet_switchEthereumChain") return null;
          if (method === "personal_sign")
            return w.signTestMessage(String(params?.[0]));
          throw new Error("Unsupported: " + method);
        },
      };
    },
    { address: evm.address },
  );
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Connect wallet & sign in" }).click();
  await page.getByRole("button", { name: "MetaMask" }).click();
  await page.getByLabel("Business name").fill("Fork Studio");
  // These payment tests receive into an externally held address (keys stay in the test).
  await page.getByRole("radio", { name: "Existing RAILGUN address" }).click();
  await page.getByLabel("RAILGUN receiving address").fill(zk);
  await page.getByRole("checkbox").check();
  await shot(page, "real-onboarding");
  await page.getByRole("button", { name: "Create workspace" }).click();
  await expect(page.getByRole("heading", { name: "Invoices" })).toBeVisible();
  return { page, zk, masterPublicKey, viewingPrivate };
}

async function payerPage(browser: Browser): Promise<Page> {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();
  page.on("console", (m) => {
    if (m.type() === "error")
      console.log("[payer console]", m.text().slice(0, 400));
  });
  // A wallet that forwards everything to the fork, where the payer account is unlocked.
  // Requests go through Node (like a real extension, outside the page's CSP).
  let id = 0;
  await page.exposeFunction(
    "forkRpc",
    async (method: string, params: unknown[]) => {
      const res = await fetch(RPC, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: ++id, method, params }),
      }).then((r) => r.json());
      return res.error ? { error: res.error } : { result: res.result };
    },
  );
  await page.addInitScript(
    ({ address }) => {
      const w = window as unknown as {
        forkRpc: (
          method: string,
          params: unknown[],
        ) => Promise<{ result?: unknown; error?: { message: string } }>;
        ethereum: unknown;
      };
      w.ethereum = {
        isMetaMask: true,
        on() {},
        removeListener() {},
        request: async ({
          method,
          params,
        }: {
          method: string;
          params?: unknown[];
        }) => {
          if (method === "eth_requestAccounts" || method === "eth_accounts")
            return [address];
          if (method === "eth_chainId") return "0x38";
          if (method === "wallet_switchEthereumChain") return null;
          const res = await w.forkRpc(method, params ?? []);
          if (res.error)
            throw Object.assign(new Error(res.error.message), res.error);
          return res.result;
        },
      };
    },
    { address: PAYER },
  );
  return page;
}

async function fundPayer(amount: bigint) {
  await anvil.impersonateAccount({ address: WHALE });
  await anvil.setBalance({ address: WHALE, value: 10n ** 18n });
  const hash = await wallet.writeContract({
    account: WHALE,
    address: USDT,
    abi: erc20Abi,
    functionName: "transfer",
    args: [PAYER, amount],
  });
  await reader.waitForTransactionReceipt({ hash });
}

async function createInvoice(page: Page, amount: string, description: string) {
  await page.goto("/invoice/new");
  await page.getByLabel("Amount", { exact: true }).fill(amount);
  await page
    .getByLabel("Service description", { exact: true })
    .fill(description);
  await page.getByRole("button", { name: "Create payment link" }).click();
  await page.waitForURL(/\/invoice\/[0-9a-f-]{36}$/);
  const id = page.url().split("/").pop()!;
  const href = await page
    .getByRole("link", { name: "Open checkout" })
    .getAttribute("href");
  return { id, slug: href!.split("/").pop()! };
}

/** The merchant's own wallet must be able to decrypt the note: same check its scanner runs. */
async function assertMerchantCanDecrypt(
  txHash: Hex,
  merchant: { masterPublicKey: bigint; viewingPrivate: Uint8Array },
  net: bigint,
) {
  const receipt = await reader.getTransactionReceipt({ hash: txHash });
  // The proxy emits more than one event per Shield transaction; pick the Shield itself.
  const event = receipt.logs
    .filter((l) => l.address.toLowerCase() === PROXY)
    .map((l) => {
      try {
        return decodeEventLog({
          abi: ABIRailgunSmartWallet as unknown as Abi,
          data: l.data,
          topics: l.topics,
        });
      } catch {
        return null;
      }
    })
    .find((e) => e?.eventName === "Shield") as unknown as {
    args: {
      commitments: { npk: Hex; value: bigint }[];
      shieldCiphertext: { encryptedBundle: Hex[]; shieldKey: Hex }[];
    };
  };
  expect(event).toBeTruthy();
  const shared = await getSharedSymmetricKey(
    merchant.viewingPrivate,
    Buffer.from(event.args.shieldCiphertext[0].shieldKey.slice(2), "hex"),
  );
  const random = ShieldNote.decryptRandom(
    event.args.shieldCiphertext[0].encryptedBundle as [string, string, string],
    shared,
  );
  expect(ShieldNote.getNotePublicKey(merchant.masterPublicKey, random)).toBe(
    BigInt(event.args.commitments[0].npk),
  );
  expect(event.args.commitments[0].value).toBe(net);
}

test("customer pays through checkout; the server verifies and settles on finality", async ({
  browser,
}) => {
  const merchant = await merchantWorkspace(browser);
  const net = parseUnits("250", 18);
  const gross = grossForNet(net, 25n);
  const { slug } = await createInvoice(
    merchant.page,
    "250",
    "Fork payment test",
  );
  await fundPayer(gross);
  const before = await usdtBalance(PAYER);

  const payer = await payerPage(browser);
  await payer.goto("/i/" + slug);
  await expect(payer.getByText("Total to pay")).toBeVisible();
  await expect(payer.getByText("≈ 250.63 USDT").first()).toBeVisible();
  await expect(payer.getByText("250.62656641604010025")).toBeVisible();
  await payer
    .getByRole("button", { name: "Connect wallet", exact: true })
    .click();
  await payer.getByRole("button", { name: "MetaMask" }).click();
  await shot(payer, "real-checkout");
  await payer.getByRole("button", { name: /^Pay / }).click();
  await expect(payer.getByText("Payment submitted")).toBeVisible({
    timeout: 60_000,
  });
  expect(before - (await usdtBalance(PAYER))).toBe(gross);

  await finalize();
  await expect(
    payer.getByText("Payment confirmed", { exact: true }),
  ).toBeVisible({
    timeout: 60_000,
  });
  const chainLink = payer.getByRole("link", { name: /On-chain transaction/ });
  await expect(chainLink).toBeVisible();
  await shot(payer, "real-checkout-paid");
  const txHash = (await chainLink.getAttribute("href"))!
    .split("/")
    .pop() as Hex;
  await assertMerchantCanDecrypt(txHash, merchant, net);

  await payer.getByRole("link", { name: /View payment receipt/ }).click();
  await expect(payer.getByText("On-chain transaction")).toBeVisible();

  await merchant.page.goto("/dashboard");
  await expect(
    merchant.page.locator("table").getByText("Paid", { exact: true }),
  ).toBeVisible();
  await shot(merchant.page, "real-dashboard");
  await merchant.page.goto("/withdraw");
  await expect(
    merchant.page.getByRole("heading", { name: "Funds" }),
  ).toBeVisible();
  // External-address merchants have no vault on this device: the page offers restore instead.
  await expect(
    merchant.page.getByRole("heading", {
      name: "Restore your private wallet on this device",
    }),
  ).toBeVisible();
  await shot(merchant.page, "real-receiving-account");
});

test("a payment is found on-chain even when the customer never reports it", async ({
  browser,
}) => {
  const merchant = await merchantWorkspace(browser);
  const { id, slug } = await createInvoice(
    merchant.page,
    "40.5",
    "Silent payment test",
  );
  const attempt = await (
    await merchant.page.request.post(`/api/invoices/${id}/payment-attempt`, {
      data: { payerAddress: PAYER.toLowerCase(), chainId: 56 },
      headers: { Origin: APP! },
    })
  ).json();
  expect(attempt.provider).toBe("railgun");
  await fundPayer(BigInt(attempt.grossAtomic));
  const approve = await wallet.writeContract({
    account: PAYER,
    address: USDT,
    abi: erc20Abi,
    functionName: "approve",
    args: [attempt.spender, BigInt(attempt.grossAtomic)],
  });
  await reader.waitForTransactionReceipt({ hash: approve });
  const shield = await wallet.sendTransaction({
    account: PAYER,
    to: attempt.transaction.to,
    data: attempt.transaction.data,
  });
  await reader.waitForTransactionReceipt({ hash: shield });
  // No /submitted call: the verifier must discover the Shield from chain logs alone.
  await finalize();
  await expect
    .poll(
      async () =>
        (
          await (
            await merchant.page.request.get(`/api/public/invoices/${slug}`)
          ).json()
        ).status,
      { timeout: 60_000, intervals: [2000] },
    )
    .toBe("PAID");
  await assertMerchantCanDecrypt(shield, merchant, parseUnits("40.5", 18));
});
