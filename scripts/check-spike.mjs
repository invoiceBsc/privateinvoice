import { chromium } from "@playwright/test";
import fs from "node:fs";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const password = "spike-test-" + crypto.randomUUID();
const result = {
  timestamp: new Date().toISOString(),
  bundle: false,
  engine: false,
  wallet: false,
  unlock: false,
  rpcBrowser: false,
  network: false,
  unsignedShield: false,
  unsignedUSDC: false,
  scanResponse: false,
  balanceCallback: false,
  errors: [],
  failedRequests: [],
};
page.on("pageerror", (e) =>
  result.errors.push(e.name + ": " + e.message.slice(0, 180)),
);
page.on("requestfailed", (request) =>
  result.failedRequests.push({
    host: new URL(request.url()).hostname,
    error: request.failure()?.errorText,
  }),
);
await page.addInitScript(() => {
  const Original = window.Worker;
  window.Worker = class extends Original {
    constructor(url, options) {
      super(url, options);
      this.addEventListener("message", (event) => {
        if (event.data.diagnostic)
          window.networkDiagnostic = event.data.diagnostic;
      });
    }
  };
});
try {
  await page.goto("http://localhost:3100/railgun-spike/index.html");
  result.bundle = await page
    .getByRole("heading", { name: "RAILGUN browser research spike" })
    .isVisible();
  await page
    .getByRole("button", { name: "Initialize engine", exact: true })
    .click();
  await page.waitForFunction(
    () =>
      document
        .getElementById("result")
        ?.textContent?.includes('"ready": true') ||
      !!document.getElementById("error")?.textContent,
    undefined,
    { timeout: 90000 },
  );
  result.engine = await page
    .locator("#result")
    .textContent()
    .then((t) => t?.includes('"ready": true') ?? false);
  if (result.engine) {
    await page.locator("#password").fill(password);
    await page
      .getByRole("button", { name: "Generate recovery phrase" })
      .click();
    await page.waitForFunction(
      () => document.getElementById("mnemonic")?.value?.split(" ").length >= 12,
      undefined,
      { timeout: 30000 },
    );
    await page.locator("#backup").check();
    await page.getByRole("button", { name: "Create / import locally" }).click();
    await page.waitForFunction(
      () =>
        document.getElementById("result")?.textContent?.includes('"address"') ||
        !!document.getElementById("error")?.textContent,
      undefined,
      { timeout: 60000 },
    );
    result.wallet = await page
      .locator("#recipient")
      .inputValue()
      .then((a) => a.startsWith("0zk"));
    if (result.wallet) {
      await page.reload();
      await page.locator("#password").fill(password);
      await page
        .getByRole("button", { name: "Unlock existing wallet" })
        .click();
      await page.waitForFunction(
        () =>
          document
            .getElementById("result")
            ?.textContent?.includes('"address"') ||
          !!document.getElementById("error")?.textContent,
        undefined,
        { timeout: 60000 },
      );
      result.unlock = await page
        .locator("#result")
        .textContent()
        .then((t) => t?.includes('"address"') ?? false);
      const walletAddress = result.unlock
        ? JSON.parse(await page.locator("#result").textContent()).address
        : "";
      result.rpcBrowser = await page.evaluate(async () => {
        try {
          const response = await fetch("https://bsc-dataseed.bnbchain.org", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              jsonrpc: "2.0",
              id: 1,
              method: "eth_chainId",
              params: [],
            }),
            signal: AbortSignal.timeout(12000),
          });
          return (await response.json()).result === "0x38";
        } catch {
          return false;
        }
      });
      await page.getByRole("button", { name: "Load network and fees" }).click();
      await page.waitForFunction(
        () =>
          document.getElementById("result")?.textContent?.includes('"fees"') ||
          !!document.getElementById("error")?.textContent,
        undefined,
        { timeout: 60000 },
      );
      result.network = await page
        .locator("#result")
        .textContent()
        .then((t) => t?.includes('"fees"') ?? false);
      if (result.network) {
        await page.locator("#recipient").fill(walletAddress);
        await page
          .getByRole("button", { name: "Construct unsigned Shield" })
          .click();
        await page.waitForFunction(
          () =>
            document
              .getElementById("result")
              ?.textContent?.includes('"transaction"') ||
            !!document.getElementById("error")?.textContent,
          undefined,
          { timeout: 60000 },
        );
        result.unsignedShield = await page
          .locator("#result")
          .textContent()
          .then((t) => t?.includes('"transaction"') ?? false);
        await page
          .locator("#token")
          .selectOption("0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d");
        await page
          .getByRole("button", { name: "Construct unsigned Shield" })
          .click();
        await page.waitForFunction(
          () => !document.getElementById("shield").disabled,
          undefined,
          { timeout: 60000 },
        );
        const usdc = JSON.parse(await page.locator("#result").textContent());
        result.unsignedUSDC =
          usdc.transaction?.data
            ?.toLowerCase()
            .includes("8ac76a51cc950d9822d68b83fe1ad97b32cd580d") ?? false;
        await page
          .getByRole("button", { name: "Scan balance and incoming history" })
          .click();
        await page.waitForFunction(
          () => !document.getElementById("scan").disabled,
          undefined,
          { timeout: 65000 },
        );
        const scanned = JSON.parse(await page.locator("#result").textContent());
        result.scanResponse = Array.isArray(scanned.history);
        result.balanceCallback = !!(await page
          .locator("#balances")
          .textContent());
      }
    }
  }
  result.networkDiagnostic = await page.evaluate(
    () => window.networkDiagnostic ?? null,
  );
  const error = await page.locator("#error").textContent();
  if (error) result.errors.push(error);
} catch (e) {
  result.errors.push(e.name + ": " + e.message.slice(0, 200));
} finally {
  await browser.close();
  fs.writeFileSync(
    "research/browser-spike-result.json",
    JSON.stringify(result, null, 2),
  );
  console.log(JSON.stringify(result));
}
