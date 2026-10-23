import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { watchErrors } from "./helpers";
import { LAB_ROUTES } from "./routes";

// V3 laboratories: accessibility (axe WCAG 2.2 A/AA), the configuration hash contract (share link round
// trip, locks, rejected keys, legacy VRA hash), redirects of the prototype URLs and keyboard operation.
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
async function scan(page: import("@playwright/test").Page) {
  const r = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  return r.violations.map((v) => `${v.impact} ${v.id}: ${v.nodes.length}× e.g. ${v.nodes[0].target.join(" ")}`);
}
const hash = (o: object) => "#" + encodeURIComponent(JSON.stringify(o));

for (const route of LAB_ROUTES) {
  test(`axe: ${route} (light, no console errors)`, async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto(route, { waitUntil: "networkidle" });
    expect(await scan(page)).toEqual([]);
    expect(errors).toEqual([]);
  });
  test(`axe: ${route} (dark)`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto(route, { waitUntil: "networkidle" });
    expect(await scan(page)).toEqual([]);
  });
}

for (const route of LAB_ROUTES.filter((r) => r !== "/labs")) {
  test(`axe: ${route} in Teach mode; Escape leaves it`, async ({ page }) => {
    await page.goto(route, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Teach", exact: true }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    expect(await scan(page)).toEqual([]);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
}

test("axe: CI Explorer and Survey Studio with results on screen", async ({ page }) => {
  await page.goto("/lab/ci-explorer" + hash({ design: "cluster", n: 100 }), { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "100 samples" }).click();
  await page.getByRole("button", { name: /Long run/ }).click();
  await page.getByRole("button", { name: "Show the data as a table" }).first().click();
  expect(await scan(page)).toEqual([]);
  for (const stage of [4, 7, 8, 9, 10]) {
    await page.goto("/lab/survey-weighting-studio" + hash({ stage, design: "stratified", nonresponse: "group", adjustment: "raking" }), { waitUntil: "networkidle" });
    if (stage === 10) {
      await page.getByRole("button", { name: "Run 200" }).click();
      await expect(page.getByText("200 repetitions done")).toBeVisible();
    }
    expect(await scan(page), `stage ${stage}`).toEqual([]);
  }
});

test("config hash: values, locks and instructions apply; unknown keys are reported", async ({ page }) => {
  await page.goto("/lab/ci-explorer" + hash({ n: 50, level: 0.9, controls: { locked: ["n"] }, instructions: "Draw 100 samples.", bogus: 1 }), { waitUntil: "networkidle" });
  await expect(page.getByRole("spinbutton", { name: "Sample size" })).toHaveValue("50");
  await expect(page.getByRole("spinbutton", { name: "Sample size" })).toBeDisabled();
  await expect(page.getByRole("slider", { name: "Confidence level" })).toHaveValue("0.9");
  await expect(page.getByText("Draw 100 samples.")).toBeVisible();
  await expect(page.getByText(/not recognised and were ignored: .*bogus/)).toBeVisible();
});

test("share link round trip reproduces the settings", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/lab/survey-weighting-studio", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /08/ }).click();
  await page.getByRole("radio", { name: "Cluster" }).click();
  await page.getByRole("button", { name: "Share" }).click();
  const url = page.url();
  expect(decodeURIComponent(new URL(url).hash)).toContain('"design":"cluster"');
  const fresh = await context.newPage();
  await fresh.goto(url, { waitUntil: "networkidle" });
  await expect(fresh.getByRole("radio", { name: "Cluster" })).toHaveAttribute("aria-checked", "true");
  await expect(fresh.getByRole("button", { name: /08/ })).toHaveAttribute("aria-current", "step");
  await expect(fresh.getByText("Linearised", { exact: true })).toBeVisible();
});

test("legacy VRA hash (#s=2) still opens stage 2 on /lab and /lab/vra-lab", async ({ page }) => {
  for (const path of ["/lab#s=2", "/lab/vra-lab#s=2"]) {
    await page.goto(path, { waitUntil: "networkidle" });
    await expect(page.getByRole("radio", { name: /^2 · / })).toHaveAttribute("aria-checked", "true");
  }
});

test("prototype URLs redirect to the lab routes", async ({ page }) => {
  for (const [from, to] of [
    ["/lab/sampling", "/lab/sampling-universe"],
    ["/lab/ttest", "/lab/ttest-lab"],
    ["/lab/ci", "/lab/ci-explorer"],
    ["/lab/survey-weighting", "/lab/survey-weighting-studio"],
  ]) {
    await page.goto(from);
    expect(new URL(page.url()).pathname).toBe(to);
  }
});

test("unimplemented labs are not routed and are labelled honestly on /labs", async ({ page }) => {
  const r = await page.goto("/lab/pca-studio");
  expect(r?.status()).toBe(404);
  await page.goto("/labs", { waitUntil: "networkidle" });
  await expect(page.getByText("Not yet available").first()).toBeVisible();
  await expect(page.getByText(/pilot-ready/i)).toHaveCount(0);
});

test("keyboard: CI Explorer draws and reports coverage without a mouse", async ({ page }) => {
  await page.goto("/lab/ci-explorer", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "100 samples" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("ci-coverage")).toContainText(/\d+ %/);
  const level = page.getByRole("slider", { name: "Confidence level" });
  await level.focus();
  await page.keyboard.press("ArrowLeft");
  await expect(level).toHaveValue("0.94");
  // a new level starts a new experiment
  await expect(page.getByTestId("ci-coverage")).toContainText("—");
});

test("keyboard: Survey Studio stages and unit inspector", async ({ page }) => {
  await page.goto("/lab/survey-weighting-studio" + hash({ stage: 4, design: "srs" }), { waitUntil: "networkidle" });
  await page.getByRole("spinbutton", { name: "Inspect unit (id)" }).fill("12");
  await expect(page.getByTestId("sws-unit")).toContainText("id 12");
  await page.getByRole("button", { name: /09/ }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText("n_eff,w (Kish)")).toBeVisible();
});
