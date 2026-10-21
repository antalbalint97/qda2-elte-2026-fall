import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { ROUTES } from "./routes";

// Automated WCAG 2.2 A/AA checks with axe-core. Automated tools catch only part of WCAG; the manual
// checklist is in docs/institutional/accessibility-report.md.
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

async function scan(page: import("@playwright/test").Page) {
  const r = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  return r.violations.map((v) => `${v.impact} ${v.id}: ${v.nodes.length}× e.g. ${v.nodes[0].target.join(" ")}`);
}

for (const route of ROUTES) {
  test(`axe: ${route} (light)`, async ({ page }) => {
    await page.goto(route, { waitUntil: "networkidle" });
    expect(await scan(page)).toEqual([]);
  });
}

for (const route of ["/", "/crosstabs", "/p-values", "/anova", "/variance", "/indices", "/bonus/sopranos", "/privacy"]) {
  test(`axe: ${route} (dark)`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto(route, { waitUntil: "networkidle" });
    await expect(page.locator("html")).toHaveClass(/dark/);
    expect(await scan(page)).toEqual([]);
  });
  test(`axe: ${route} (presentation mode)`, async ({ page }) => {
    await page.goto(`${route}?present=1`, { waitUntil: "networkidle" });
    await expect(page.locator("html")).toHaveClass(/present/);
    expect(await scan(page)).toEqual([]);
  });
}

test("axe: answered quiz feedback and revealed panels", async ({ page }) => {
  await page.goto("/review", { waitUntil: "networkidle" });
  await page.getByRole("group", { name: "Answer options" }).first().getByRole("button").first().click();
  await page.waitForTimeout(500); // let the feedback fade-in finish before measuring contrast
  expect(await scan(page)).toEqual([]);
});

test("heading levels do not skip on any page", async ({ page }) => {
  for (const route of ROUTES) {
    await page.goto(route);
    const levels = await page.locator("h1, h2, h3, h4, h5, h6").evaluateAll((els) =>
      els.filter((e) => (e as HTMLElement).offsetParent !== null).map((e) => Number(e.tagName[1])),
    );
    expect(levels[0], route).toBe(1);
    for (let i = 1; i < levels.length; i++) expect(levels[i] - levels[i - 1], `${route} heading ${i}`).toBeLessThanOrEqual(1);
  }
});

test("reduced-motion preference disables animations", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/correlation");
  const duration = await page.locator(".animate-draw, .animate-fade-up").first().evaluate((el) => getComputedStyle(el).animationDuration).catch(() => "0.00001s");
  expect(parseFloat(duration)).toBeLessThan(0.01);
});

test("axe: index lab with every chart state revealed", async ({ page }) => {
  await page.goto("/indices", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Reverse-score T3" }).click();
  await page.getByRole("button", { name: "Reverse-score T5" }).click();
  await page.getByRole("button", { name: "Delete T6" }).click();
  await page.getByRole("button", { name: "Reveal how the items were designed" }).click();
  await page.getByRole("radio", { name: "Percentiles" }).click();
  await page.waitForTimeout(300);
  expect(await scan(page)).toEqual([]);
});

test("axe: variance lab with every chart state revealed", async ({ page }) => {
  await page.goto("/variance", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Reveal the answers" }).click();
  await page.getByRole("button", { name: "Show ±1 SD" }).click();
  await page.getByRole("radio", { name: "Average square" }).click();
  await page.getByRole("radio", { name: "Your line" }).click();
  await page.getByRole("radio", { name: "Spread grows with X" }).click();
  await page.waitForTimeout(300);
  expect(await scan(page)).toEqual([]);
});
