import { test, expect } from "@playwright/test";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
test("header wallet: pick a wallet, sign in, move freely, disconnect", async ({
  page,
}) => {
  const wallet = privateKeyToAccount(generatePrivateKey());
  await page.exposeFunction("signTestMessage", async (hex: `0x${string}`) =>
    wallet.signMessage({ message: { raw: hex } }),
  );
  await page.addInitScript(
    ({ address }) => {
      type TestWindow = Window & {
        signTestMessage: (message: `0x${string}`) => Promise<string>;
        ethereum: unknown;
      };
      const target = window as unknown as TestWindow;
      target.ethereum = {
        isRabby: true,
        on: () => {},
        removeListener: () => {},
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
            return target.signTestMessage(String(params?.[0]) as `0x${string}`);
          throw new Error("Unsupported test-wallet request: " + method);
        },
      };
    },
    { address: wallet.address },
  );
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  const header = page.locator(".site-header");
  // Closing the picker cancels quietly.
  await header.getByRole("button", { name: "Connect wallet" }).click();
  const picker = page.getByRole("dialog", { name: "Choose a wallet" });
  await expect(picker).toBeVisible();
  await expect(picker.getByRole("link", { name: /MetaMask/ })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(picker).toBeHidden();
  await expect(page.locator(".wallet-error")).toHaveCount(0);
  // The detected wallet is named after its provider; uninstalled ones link out.
  await header.getByRole("button", { name: "Connect wallet" }).click();
  await expect(picker.getByRole("link", { name: /Rabby/ })).toHaveCount(0);
  await picker.getByRole("button", { name: "Rabby" }).click();
  // First sign-in goes straight to workspace setup.
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.getByLabel("Business name").fill("Header Studio");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Create workspace" }).click();
  await expect(page.getByRole("heading", { name: "Invoices" })).toBeVisible();
  // The logo returns home without signing out.
  await page.getByRole("link", { name: "Back to home" }).click();
  await expect(page).toHaveURL(/\/$/);
  const chip = header.getByRole("button", { name: "Account menu" });
  await expect(chip).toContainText("Header Studio");
  await chip.click();
  const menu = page.getByRole("menu");
  await menu.getByRole("menuitem", { name: "Workspace" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Invoices" })).toBeVisible();
  await chip.click();
  await page.getByRole("menuitem", { name: "Disconnect" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(
    header.getByRole("button", { name: "Connect wallet" }),
  ).toBeVisible();
  expect((await page.request.get("/api/invoices")).status()).toBe(401);
});
