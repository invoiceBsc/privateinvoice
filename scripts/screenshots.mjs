// Captures every page of the mock workflow for visual review.
// Usage: node scripts/screenshots.mjs [outDir] [locale]
import { chromium } from "@playwright/test";
import { messages } from "../src/i18n/messages.ts";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";

const base = process.env.SHOT_BASE_URL ?? "https://privateinvoice.space";
const out = process.argv[2] ?? "data/shots";
const locale = process.argv[3] ?? "zh";
const wallet = privateKeyToAccount(generatePrivateKey());
const browser = await chromium.launch({
  env: {
    ...process.env,
    FONTCONFIG_FILE: new URL("../data/fonts/fonts.conf", import.meta.url)
      .pathname,
  },
});
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
});
await ctx.addCookies([{ name: "invoice_locale", value: locale, url: base }]);
const page = await ctx.newPage();
page.on(
  "console",
  (m) => m.type() === "error" && console.log("console:", m.text()),
);
page.on("pageerror", (e) => console.log("pageerror:", e.message));
await page.exposeFunction("signTestMessage", (hex) =>
  wallet.signMessage({ message: { raw: hex } }),
);
await page.addInitScript(
  ({ address }) => {
    window.ethereum = {
      isMetaMask: true,
      on: () => {},
      removeListener: () => {},
      request: async ({ method, params }) => {
        if (method === "eth_requestAccounts" || method === "eth_accounts")
          return [address];
        if (method === "eth_chainId") return "0x38";
        if (method === "wallet_switchEthereumChain") return null;
        if (method === "wallet_requestPermissions")
          return [{ parentCapability: "eth_accounts" }];
        if (method === "personal_sign")
          return window.signTestMessage(String(params?.[0]));
        throw new Error("Unsupported: " + method);
      },
    };
  },
  { address: wallet.address },
);

const shot = async (name) => {
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/${name}-m.png`, fullPage: true });
  await page.setViewportSize({ width: 1440, height: 900 });
  console.log("shot", name);
};
// Resolve labels through the catalog so selectors follow the copy in either locale.
const t = (zh) => {
  if (locale === "zh") return zh;
  const keys = Object.keys(messages);
  const key = keys.find((k) => k === zh) ?? keys.find((k) => k.startsWith(zh));
  return key ? messages[key].replace(/[→↗·✓]/g, "").trim() : zh;
};

await page.goto(base + "/");
await shot("01-home");
await page.goto(base + "/privacy-model");
await shot("02-privacy");
await page.goto(base + "/dashboard");
await shot("03-login");
await page.getByRole("button", { name: t("连接钱包并登录") }).click();
await shot("03b-wallet-picker");
await page.getByRole("button", { name: "MetaMask" }).click();
await page.getByLabel(t("商家名称")).fill("Northwind Studio");
await shot("04-onboarding");
await page.getByRole("checkbox").check();
await page.getByRole("button", { name: t("创建工作空间") }).click();
await page.waitForTimeout(1500);
await shot("05-dashboard-empty");

async function createInvoice(amount, desc, customer, capture) {
  await page.goto(base + "/invoice/new");
  await page.getByLabel(t("金额"), { exact: true }).fill(amount);
  await page.getByLabel(t("服务内容"), { exact: true }).fill(desc);
  await page.getByLabel(t("客户名称"), { exact: false }).fill(customer);
  if (capture) await shot("06-create");
  await page.getByRole("button", { name: t("创建付款链接") }).click();
  await page.waitForURL(/\/invoice\/[^n]/);
  await page.waitForTimeout(800);
  if (capture) await shot("07-invoice-detail");
  return page
    .getByRole("link", { name: t("打开付款页面") })
    .getAttribute("href");
}
const link = await createInvoice(
  "4800",
  "Brand identity design — phase 1",
  "Acme Labs",
  true,
);
await createInvoice("1250.5", "Monthly retainer, October", "Globex", false);
await createInvoice("320", "Landing page copy edits", "Initech", false);

await page.goto(new URL(link, base).href);
await page.waitForTimeout(1000);
await shot("08-checkout");
const simulate = page.getByRole("button", {
  name: t("模拟付款"),
  exact: false,
});
if (!(await simulate.isEnabled())) {
  await page.getByRole("button", { name: t("连接钱包"), exact: true }).click();
  await page.getByRole("button", { name: "MetaMask" }).click();
}
await simulate.click();
await page.waitForTimeout(1500);
await shot("09-checkout-submitted");

await page.goto(base + "/dashboard");
await page.waitForTimeout(1200);
await page.getByRole("button", { name: t("扫描付款") }).click();
await page.waitForTimeout(1500);
await shot("10-dashboard-reconcile");
await page.getByRole("button", { name: t("确认并生成收据") }).click();
await page.waitForTimeout(1500);
await shot("11-dashboard-paid");
const receipt = page.locator("a[href^='/receipt/']").first();
if (await receipt.count()) {
  await page.goto(base + (await receipt.getAttribute("href")));
  await page.waitForTimeout(800);
  await shot("12-receipt");
}
await page.goto(base + "/withdraw");
await page.waitForTimeout(1000);
await shot("13-withdraw");
await page.goto(base + "/");
await page.waitForTimeout(1200);
await page.getByRole("button", { name: t("账户菜单") }).click();
await page.waitForTimeout(300);
await page.screenshot({ path: `${out}/14-home-account-menu.png` });
await browser.close();
