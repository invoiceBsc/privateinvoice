import { test, expect } from "@playwright/test";
test.use({ locale: "zh-CN" });
const noOverflow = (page: import("@playwright/test").Page) =>
  expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
test("English default, live switching, saved choice and signed-out gate", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(
    page.getByRole("link", { name: "Start getting paid" }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("combobox", { name: "Language", exact: true }),
  ).toHaveValue("en");
  // Workspace routes show the sign-in screen without workspace navigation.
  await page.goto("/invoice/new");
  await expect(
    page.getByRole("heading", { name: "Sign in to your workspace" }),
  ).toBeVisible();
  // One site header everywhere: the logo returns home, the wallet sits top-right.
  await expect(
    page
      .locator(".site-header")
      .getByRole("button", { name: "Connect wallet" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Back to home" }),
  ).toHaveAttribute("href", "/");
  await page
    .getByRole("combobox", { name: "Language", exact: true })
    .selectOption("zh");
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
  await expect(
    page.getByRole("button", { name: "连接钱包并登录" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("combobox", { name: "语言", exact: true }),
  ).toHaveValue("zh");
  await expect(page.getByRole("heading", { name: "登录工作台" })).toBeVisible();
  const signedOut = await page.request.post("/api/invoices", {
    data: { amount: "12", tokenSymbol: "USDT", description: "Test" },
    headers: { Origin: new URL(page.url()).origin },
  });
  expect(signedOut.status()).toBe(401);
  await page
    .getByRole("combobox", { name: "语言", exact: true })
    .selectOption("en");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await noOverflow(page);
  await page.screenshot({ path: "logs/i18n-mobile-home.png", fullPage: true });
  await page.goto("/dashboard");
  await expect(
    page.getByRole("button", { name: "Connect wallet & sign in" }),
  ).toBeVisible();
  await noOverflow(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await page.screenshot({ path: "logs/i18n-english-home.png", fullPage: true });
});
