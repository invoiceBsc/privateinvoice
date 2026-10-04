import { test, expect } from "@playwright/test";
test("buttons and route content stay visible without flashing", async ({
  page,
}) => {
  await page.goto("/");
  const button = page.getByRole("link", { name: "Start getting paid" }).first();
  await button.hover();
  // Hover raises the shadow but never moves or fades the control.
  await expect(button).toHaveCSS("transform", "none");
  await expect(button).toHaveCSS("opacity", "1");
  expect(
    await button.evaluate((el) => getComputedStyle(el, "::after").content),
  ).toBe("none");
  // Press gives a small, fully opaque scale-down.
  await page.mouse.down();
  await expect
    .poll(() =>
      button.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).a),
    )
    .toBeLessThan(1);
  const pressed = await button.evaluate(
    (el) => new DOMMatrix(getComputedStyle(el).transform).a,
  );
  expect(pressed).toBeGreaterThanOrEqual(0.95);
  await expect(button).toHaveCSS("opacity", "1");
  await page.mouse.move(1, 1);
  await page.mouse.up();
  await expect(page.locator(".page-transition")).toHaveCSS(
    "animation-name",
    "none",
  );
  await button.click();
  await expect(page).toHaveURL(/dashboard/);
  await expect(page.locator(".page-transition")).toHaveCSS(
    "animation-name",
    "none",
  );
  await expect(page.locator(".page-transition")).toHaveCSS("opacity", "1");
  await page.goto("/");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await expect(page.locator(".page-transition")).toHaveCSS(
    "animation-name",
    "none",
  );
  await expect(page.locator(".landing-preview")).toHaveCSS(
    "animation-name",
    "none",
  );
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
});
test("workspace loading skeleton is shown while account information is pending", async ({
  page,
}) => {
  await page.route("**/api/merchant", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    await route.continue();
  });
  await page.goto("/dashboard");
  await expect(page.locator(".workspace-skeleton")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Connect wallet & sign in" }),
  ).toBeVisible();
  await expect(page.locator(".workspace-skeleton")).not.toBeVisible();
});
