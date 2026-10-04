import { test, expect } from "@playwright/test";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
test("merchant and customer complete the mock workflow through the UI", async ({
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
        isMetaMask: true,
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
          if (method === "wallet_requestPermissions")
            return [{ parentCapability: "eth_accounts" }];
          if (method === "personal_sign")
            return target.signTestMessage(String(params?.[0]) as `0x${string}`);
          throw new Error("Unsupported test-wallet request: " + method);
        },
      };
    },
    { address: wallet.address },
  );
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/dashboard");
  await page
    .getByRole("combobox", { name: "Language", exact: true })
    .selectOption("zh");
  await page.getByRole("button", { name: "连接钱包并登录" }).click();
  // The wallet picker lists the injected test wallet by its provider name.
  await expect(page.getByRole("dialog", { name: "选择钱包" })).toBeVisible();
  await page.getByRole("button", { name: "MetaMask" }).click();
  await page.getByLabel("商家名称").fill("UI Test Studio");
  await page.screenshot({
    path: "logs/redesign-onboarding.png",
    fullPage: true,
  });
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "创建工作空间" }).click();
  await expect(page.getByRole("heading", { name: "账单管理" })).toBeVisible();
  await page
    .getByRole("link", { name: "创建发票", exact: false })
    .first()
    .click();
  await page.getByLabel("金额", { exact: true }).fill("123.456");
  await page.getByLabel("服务内容", { exact: true }).fill("UI design services");
  await page.getByLabel("客户名称", { exact: false }).fill("UI customer");
  await page.screenshot({ path: "logs/redesign-create.png", fullPage: true });
  await page.getByRole("button", { name: "创建付款链接" }).click();
  await page.getByRole("button", { name: "复制付款链接" }).click();
  await expect(page.getByRole("button", { name: "已复制 ✓" })).toBeVisible();
  await page.getByRole("link", { name: "打开付款页面" }).click();
  await expect(
    page.getByRole("heading", { name: "UI design services" }),
  ).toBeVisible();
  const simulate = page.getByRole("button", { name: "模拟付款", exact: false });
  if (!(await simulate.isEnabled())) {
    await page.getByRole("button", { name: "连接钱包", exact: true }).click();
    await page.getByRole("button", { name: "MetaMask" }).click();
  }
  await simulate.click();
  await expect(
    page.getByText("付款已提交，商家对账后", { exact: false }),
  ).toBeVisible();
  await page.goto("/dashboard");
  await page.route("**/api/mock/scan", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 700));
    await route.continue();
  });
  const scan = page.getByRole("button", { name: "扫描付款" });
  await scan.hover();
  const before = await scan.evaluate((el) => ({
    text: el.textContent,
    width: el.getBoundingClientRect().width,
    background: getComputedStyle(el).backgroundImage,
  }));
  await scan.click();
  await expect(scan).toBeDisabled();
  await expect(scan).toHaveAttribute("aria-busy", "true");
  await expect(scan).toHaveCSS("opacity", "1");
  const during = await scan.evaluate((el) => ({
    text: el.textContent,
    width: el.getBoundingClientRect().width,
    background: getComputedStyle(el).backgroundImage,
  }));
  expect(during).toEqual(before);
  await expect(scan).toBeEnabled();
  await expect(scan).toHaveCSS("opacity", "1");
  await page.getByRole("button", { name: "确认并生成收据" }).click();
  await expect(
    page.locator("table").getByText("已付款", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "解锁模拟余额" }).click();
  await expect(
    page.getByText("模拟余额已解锁", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "已付款", exact: true }).click();
  await expect(
    page.locator("table").getByText("已付款", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("搜索账单").fill("no-such-customer");
  await expect(page.getByText("没有符合条件的账单")).toBeVisible();
  await page.getByLabel("搜索账单").fill("UI customer");
  await expect(
    page.locator("table").getByText("UI customer", { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "logs/redesign-dashboard.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "logs/redesign-mobile-dashboard.png",
    fullPage: true,
  });
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole("link", { name: "余额与提现" }).click();
  await page.getByLabel("金额", { exact: true }).fill("23.456");
  await page.getByLabel("收款地址").fill(wallet.address);
  await page.getByRole("button", { name: "模拟提现" }).click();
  await expect(page.getByRole("status")).toContainText("模拟提现已完成");
});
