import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { watchErrors, watchExternalRequests } from "./helpers";

// Browser R (/r): real webR from the self-hosted runtime. Starting R takes a few seconds, so these tests have
// longer timeouts. Installing the survey package needs repo.r-wasm.org; sandboxes that block it set
// E2E_NO_WEBR_REPO=1 and the test is reported as skipped, never as passed.
test.describe.configure({ timeout: 120_000 });

async function runCode(page: Page, code: string) {
  const box = page.getByRole("textbox", { name: "R code" });
  await box.click();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.press("Delete");
  await page.keyboard.insertText(code);
  await page.getByRole("button", { name: "Run", exact: true }).click();
}
const output = (page: Page) => page.getByTestId("r-output");

test("base R runs from the self-hosted runtime with no external requests", async ({ page, baseURL }) => {
  const errors = watchErrors(page);
  const external = watchExternalRequests(page, baseURL!);
  await page.goto("/r", { waitUntil: "networkidle" });
  // the editor upgrades to CodeMirror; its content element carries the same accessible name
  await expect(page.getByTestId("r-editor")).toBeVisible();
  await runCode(page, "1 + 1");
  await expect(output(page)).toContainText("[1] 2", { timeout: 90_000 });
  await expect(page.getByTestId("r-status")).toHaveText("R ready");
  expect([...external]).toEqual([]);
  expect(errors.filter((e) => !/PostMessage/.test(e))).toEqual([]);
});

test("course datasets are bound as data frames; errors and warnings are shown as text", async ({ page }) => {
  await page.goto("/r", { waitUntil: "networkidle" });
  await runCode(page, "nrow(news_knowledge)\nlevels(news_knowledge$education)");
  await expect(output(page)).toContainText("[1] 15", { timeout: 90_000 });
  await expect(output(page)).toContainText('"Primary"   "Secondary" "Tertiary"');
  await runCode(page, 'warning("careful")\nstop("<b>not html</b>")');
  await expect(output(page).locator('[data-kind="error"]')).toHaveText("Error: <b>not html</b>");
  await expect(output(page).locator("b")).toHaveCount(0);
  await expect(output(page).locator('[data-kind="warning"]')).toContainText("careful");
});

test("plots appear as images with alt text", async ({ page }) => {
  await page.goto("/r", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "A plot" }).click();
  await page.getByRole("button", { name: "Run", exact: true }).click();
  const img = page.getByRole("img", { name: "Plot 1 produced by the R code" });
  await expect(img).toBeVisible({ timeout: 90_000 });
  expect(await img.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBeGreaterThan(100);
});

test("Stop ends a long computation and restarts R; state is gone afterwards", async ({ page }) => {
  await page.goto("/r", { waitUntil: "networkidle" });
  await runCode(page, "keep <- 42\nkeep");
  await expect(output(page)).toContainText("[1] 42", { timeout: 90_000 });
  await runCode(page, "while (TRUE) {}");
  await expect(page.getByTestId("r-status")).toHaveText("Running…");
  await page.getByRole("button", { name: "Stop" }).click();
  await expect(output(page)).toContainText("Stopped. R was restarted");
  await runCode(page, 'exists("keep")');
  await expect(output(page)).toContainText("[1] FALSE", { timeout: 90_000 });
});

test("the /r page sends the webR CSP; the worker alone may use eval; other pages are unchanged", async ({ request }) => {
  const r = (await request.get("/r")).headers()["content-security-policy"];
  expect(r).toContain("'wasm-unsafe-eval'");
  expect(r).not.toContain("'unsafe-eval'");
  expect(r).toContain("connect-src 'self' https://repo.r-wasm.org");
  expect(r).toContain("frame-ancestors 'none'");
  const w = await request.get("/webr/0.4.2/webr-worker.js");
  expect(w.status()).toBe(200);
  expect(w.headers()["content-security-policy"]).toContain("'unsafe-eval' 'wasm-unsafe-eval'");
  expect(w.headers()["cache-control"]).toContain("immutable");
  const home = (await request.get("/")).headers()["content-security-policy"];
  expect(home).not.toContain("wasm-unsafe-eval");
  expect(home).not.toContain("r-wasm.org");
});

test("axe: /r before and after a run (light and dark)", async ({ page }) => {
  const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
  const scan = async () => (await new AxeBuilder({ page }).withTags(TAGS).analyze()).violations.map((v) => `${v.id}: ${v.nodes[0].target.join(" ")}`);
  await page.goto("/r", { waitUntil: "networkidle" });
  expect(await scan()).toEqual([]);
  await runCode(page, 'summary(news_knowledge)\nwarning("w")');
  await expect(output(page)).toContainText("Mean", { timeout: 90_000 });
  expect(await scan()).toEqual([]);
  await page.emulateMedia({ colorScheme: "dark" });
  expect(await scan()).toEqual([]);
});

test("the survey package installs from the webR repository and matches R's svymean", async ({ page }) => {
  test.skip(!!process.env.E2E_NO_WEBR_REPO, "repo.r-wasm.org is not reachable from this environment");
  test.setTimeout(240_000);
  await page.goto("/r", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Survey design (needs survey)" }).click();
  await expect(page.getByRole("checkbox", { name: "Load the survey package" })).toBeChecked();
  await page.getByRole("button", { name: "Run", exact: true }).click();
  // reference: native R 4.3.3 with survey on the same rows (datasetR output): mean 5.4308, SE 0.1822;
  // Towns 5.233333, SE 0.3595264
  await expect(output(page)).toContainText(/trust 5\.4308 0\.1822/, { timeout: 200_000 });
  await expect(output(page)).toContainText(/Towns\s+Towns 5\.233333 0\.3595264/);
});

test("when the package repository is unreachable, the block says so instead of failing later", async ({ page }) => {
  test.skip(!process.env.E2E_NO_WEBR_REPO, "only meaningful where repo.r-wasm.org is blocked");
  test.setTimeout(240_000);
  await page.goto("/r", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Survey design (needs survey)" }).click();
  await page.getByRole("button", { name: "Run", exact: true }).click();
  await expect(output(page)).toContainText("Not run: package survey could not be installed", { timeout: 200_000 });
  await expect(page.getByTestId("r-status")).toHaveText("R ready");
});
