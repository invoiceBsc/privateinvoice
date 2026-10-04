/**
 * The merchant's in-browser RAILGUN wallet: creation at onboarding, recovery-phrase backup,
 * sync and balances, lock/unlock, removal and restore. Needs a real-mode app (FORK_APP_URL);
 * the vault itself syncs BNB Chain mainnet through the public RPC.
 */
import { test, expect } from "@playwright/test";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { Wallet } from "ethers";
import type { Hex } from "viem";

const APP = process.env.FORK_APP_URL;
test.skip(!APP, "Set FORK_APP_URL to a PRIVACY_PROVIDER=railgun instance");
test.use({ baseURL: APP });
test.setTimeout(600_000);

const PASSWORD = "correct horse battery staple";
const shot = (page: import("@playwright/test").Page, name: string) =>
  process.env.SHOTS
    ? page.screenshot({
        path: `${process.env.SHOTS}/${name}.png`,
        fullPage: true,
      })
    : Promise.resolve();

test("merchant creates, backs up, syncs, locks, removes and restores the private wallet", async ({
  page,
}) => {
  const evm = privateKeyToAccount(generatePrivateKey());
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
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Connect wallet & sign in" }).click();
  await page.getByRole("button", { name: "MetaMask" }).click();

  // Onboarding: the built-in wallet is the default.
  await page.getByLabel("Business name").fill("Vault Studio");
  await expect(
    page.getByRole("radio", { name: "Built-in wallet" }),
  ).toHaveAttribute("aria-checked", "true");
  await page.getByLabel("Wallet password").fill("short");
  await expect(page.getByText("Use at least 10 characters.")).toBeVisible();
  await page.getByLabel("Wallet password").fill(PASSWORD);
  await page.getByLabel("Confirm password").fill(PASSWORD);
  await page.getByRole("button", { name: "Create private wallet" }).click();
  const create = page.getByRole("button", { name: "Create workspace" });
  await expect(create).toBeDisabled();
  await page.getByRole("button", { name: /click to reveal/ }).click();
  const words = (await page.locator(".phrase-grid span").allTextContents()).map(
    (w) => w.replace(/^\d+/, "").trim(),
  );
  expect(words).toHaveLength(12);
  const mnemonic = words.join(" ");
  await page.getByRole("checkbox").check();
  await shot(page, "vault-onboarding-phrase");
  await create.click();
  await expect(page.getByRole("heading", { name: "Invoices" })).toBeVisible({
    timeout: 30_000,
  });

  // Funds: still unlocked from creation; sync then show balances and the withdraw form.
  await page
    .locator(".main-nav")
    .getByRole("link", { name: "Funds", exact: true })
    .click();
  await expect(page.getByRole("heading", { name: "Funds" })).toBeVisible();
  await expect(
    page.getByText(
      /Syncing private records|Starting privacy engine|Connecting to BNB Chain|Loading private wallet/,
    ),
  ).toBeVisible({ timeout: 60_000 });
  await shot(page, "vault-syncing");
  await expect(page.getByText("No private payments yet.")).toBeVisible({
    timeout: 480_000,
  });
  await expect(page.getByText("USDT available balance")).toBeVisible();
  await shot(page, "vault-funds");
  await expect(
    page.getByRole("button", { name: "Withdraw", exact: true }),
  ).toBeDisabled();

  // Lock, reject a wrong password, unlock.
  await page.getByRole("button", { name: "Lock" }).click();
  await shot(page, "vault-locked");
  await page.getByLabel("Wallet password").fill("not the password");
  await page.getByRole("button", { name: "Unlock" }).click();
  await expect(page.getByText("Wrong password.")).toBeVisible({
    timeout: 60_000,
  });
  await page.getByLabel("Wallet password").fill(PASSWORD);
  await page.getByRole("button", { name: "Unlock" }).click();
  await expect(page.getByRole("button", { name: "Lock" })).toBeVisible({
    timeout: 60_000,
  });

  // Remove from this device, refuse a different phrase, restore with the right one.
  await page
    .getByRole("button", { name: "Remove the private wallet from this device" })
    .click();
  await page.getByRole("button", { name: "Remove", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "Restore your private wallet on this device",
    }),
  ).toBeVisible();
  await page
    .getByLabel("Recovery phrase")
    .fill(Wallet.createRandom().mnemonic!.phrase);
  await page.getByLabel("Wallet password").fill(PASSWORD);
  await page.getByLabel("Confirm password").fill(PASSWORD);
  await page.getByRole("button", { name: "Import wallet" }).click();
  await expect(
    page.getByText(
      "This recovery phrase doesn't match your receiving address.",
    ),
  ).toBeVisible({ timeout: 60_000 });
  await shot(page, "vault-restore");
  await page.getByLabel("Recovery phrase").fill(mnemonic);
  await page.getByRole("button", { name: "Import wallet" }).click();
  await expect(page.getByRole("button", { name: "Lock" })).toBeVisible({
    timeout: 60_000,
  });
});
