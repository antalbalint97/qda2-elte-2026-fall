import { expect, test } from "@playwright/test";
import { expectNoHorizontalScroll, watchErrors } from "./helpers";
import { ROUTES } from "./routes";

for (const route of ROUTES) {
  test(`${route} loads without runtime errors and fits the viewport @layout`, async ({ page }) => {
    const errors = watchErrors(page);
    const res = await page.goto(route, { waitUntil: "networkidle" });
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toBeVisible();
    await expect(page).toHaveTitle(/QDA2 Interactive Lab/);
    await expect(page.locator("footer").last()).toContainText("independently developed educational resource");
    await expectNoHorizontalScroll(page);
    // let deferred client code (effects, timers) run before checking for errors
    await page.waitForTimeout(300);
    expect(errors).toEqual([]);
  });
}

test("refreshing a nested route and direct deep links keep working", async ({ page }) => {
  await page.goto("/bonus/sopranos");
  await page.reload();
  await expect(page.locator("h1")).toBeVisible();
  await page.goto("/crosstabs#chi");
  await expect(page.locator("#chi")).toBeInViewport();
});

test("client-side navigation between modules", async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto("/");
  await page.getByRole("navigation", { name: "Modules" }).getByRole("link", { name: "p-values" }).click();
  await expect(page).toHaveURL(/\/p-values$/);
  await expect(page.locator("h1")).toHaveText("p-values");
  await page.getByRole("link", { name: /Next/ }).click();
  await expect(page).toHaveURL(/\/correlation$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/p-values$/);
  expect(errors).toEqual([]);
});

test("unknown addresses get a helpful 404 page", async ({ page }) => {
  const res = await page.goto("/no-such-page");
  expect(res?.status()).toBe(404);
  await expect(page.locator("h1")).toHaveText("This page does not exist");
  await expect(page.getByRole("link", { name: /Measurement Levels/ })).toBeVisible();
});

test("mathematical notation renders with KaTeX and without errors", async ({ page }) => {
  await page.goto("/anova");
  expect(await page.locator(".katex").count()).toBeGreaterThan(20);
  await expect(page.locator(".katex-error")).toHaveCount(0);
  // MathML is present for assistive technology
  expect(await page.locator(".katex math").count()).toBeGreaterThan(20);
});

test("the site still renders its content with JavaScript disabled", async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto("/crosstabs");
  await expect(page.locator("h1")).toHaveText("Crosstabs");
  await expect(page.locator("table").first()).toBeVisible();
  await ctx.close();
});

test("slow network: pages become usable on a throttled connection", async ({ page }) => {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 400,
    downloadThroughput: (750 * 1024) / 8,
    uploadThroughput: (250 * 1024) / 8,
  });
  const start = Date.now();
  await page.goto("/p-values", { waitUntil: "load", timeout: 60_000 });
  await expect(page.getByRole("slider").first()).toBeEnabled();
  test.info().annotations.push({ type: "load time (750 kbit/s, 400 ms RTT)", description: `${Date.now() - start} ms` });
});

test("presentation mode fits a 1024×768 projector on every page", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  for (const route of ROUTES) {
    await page.goto(`${route}?present=1`);
    await expect(page.locator("html")).toHaveClass(/present/);
    await expectNoHorizontalScroll(page);
  }
});
