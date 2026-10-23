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

// Every SVG drag handle of the M3 labs is also a keyboard slider: the arrow keys change its value.
for (const id of ["hypothesis-lab", "distribution-studio", "probability-playground", "expected-value-lab", "categorical-lab", "lazarsfeld-simpson-lab", "anova-studio"]) {
  test(`keyboard: ${id} drag handle moves with the arrow keys`, async ({ page }) => {
    await page.goto(`/lab/${id}`, { waitUntil: "networkidle" });
    const handle = page.locator("svg [role=slider]").first();
    const before = await handle.getAttribute("aria-valuenow");
    const [up, down] = (await handle.getAttribute("aria-orientation")) === "horizontal" ? ["ArrowRight", "ArrowLeft"] : ["ArrowUp", "ArrowDown"];
    await handle.focus();
    await page.keyboard.press(up);
    if ((await handle.getAttribute("aria-valuenow")) === before) {
      await page.keyboard.press(down);
      await page.keyboard.press(down);
    }
    await expect(handle).not.toHaveAttribute("aria-valuenow", before as string);
  });
}

test("keyboard: Correlation & Regression point moves and r updates", async ({ page }) => {
  await page.goto("/lab/corr-reg-lab", { waitUntil: "networkidle" });
  const pt = page.locator("svg [aria-roledescription='movable point']").first();
  const label = (await pt.getAttribute("aria-label")) as string;
  const r0 = await page.getByText("r (Pearson)").locator("..").textContent();
  await pt.focus();
  await page.keyboard.press("Shift+ArrowUp");
  await expect(pt).not.toHaveAttribute("aria-label", label);
  expect(await page.getByText("r (Pearson)").locator("..").textContent()).not.toBe(r0);
});

test("keyboard: Lazarsfeld & Simpson classification on the published kidney-stone data", async ({ page }) => {
  await page.goto("/lab/lazarsfeld-simpson-lab" + hash({ scenario: "simpson", hideAnswer: true }), { waitUntil: "networkidle" });
  await expect(page.getByText("hidden until you classify")).toBeVisible();
  await page.getByRole("button", { name: "Simpson's paradox", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status").filter({ hasText: "Correct" })).toBeVisible();
  await expect(page.getByText("Charig et al. (1986)")).toBeVisible();
});

test("keyboard: Expected Value Lab hides E[X] until a prediction is revealed", async ({ page }) => {
  await page.goto("/lab/expected-value-lab" + hash({ preset: "lottery", hideE: true }), { waitUntil: "networkidle" });
  await expect(page.getByText("hidden until you predict")).toBeVisible();
  await page.getByRole("textbox", { name: "Your prediction of E[X]" }).fill("50");
  await page.getByRole("button", { name: "Reveal E[X]" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status").filter({ hasText: "E[X] = -60" })).toBeVisible();
});

test("keyboard: Categorical Lab keeps both margins while a tile boundary moves", async ({ page }) => {
  await page.goto("/lab/categorical-lab" + hash({ keep: "margins" }), { waitUntil: "networkidle" });
  const col = async () => (await page.locator("table tbody tr").last().textContent())?.replace(/\s+/g, " ");
  const totals = await col();
  const cell = page.getByRole("spinbutton", { name: "Count: Women × Trusts parliament" });
  const v0 = await cell.inputValue();
  await page.locator("svg [role=slider]").first().focus();
  await page.keyboard.press("ArrowUp");
  await expect(cell).not.toHaveValue(v0);
  expect(await col()).toBe(totals);
});

test("keyboard: ANOVA Studio repeated-measures table and interaction handle", async ({ page }) => {
  await page.goto("/lab/anova-studio" + hash({ design: "rm" }), { waitUntil: "networkidle" });
  await expect(page.getByTestId("anova-table")).toContainText("Subjects");
  await page.goto("/lab/anova-studio" + hash({ design: "twoway", preset: "interaction" }), { waitUntil: "networkidle" });
  const row = page.getByTestId("anova-table").locator("tr", { hasText: "A × B" });
  const before = await row.textContent();
  const h = page.getByRole("slider", { name: "Interaction plot (cell means): A1·B1" });
  await h.focus();
  await page.keyboard.press("Shift+ArrowUp");
  await expect(row).not.toHaveText(before as string);
});

test("keyboard: Survey Design Studio traces π through two PPS stages and allocates by drag", async ({ page }) => {
  // the block config of l.sds-stages
  await page.goto("/lab/survey-design-studio" + hash({ strata: 3, stages: 2, pps: true }), { waitUntil: "networkidle" });
  const trace = page.getByTestId("pi-trace");
  await expect(trace).toContainText("PSU 1 (Budapest districts");
  await expect(trace).toContainText("π_PSU = a·M_i/ΣM");
  await page.locator("svg [role=radio][tabindex='0']").focus();
  await page.keyboard.press("End");
  await expect(trace).toContainText("PSU 40 (Villages");
  await expect(page.locator("svg [role=radio][aria-checked=true]")).toBeFocused();
  // one-stage stratified: Σπ_k = n, and dragging an allocation handle switches to a custom allocation
  await page.goto("/lab/survey-design-studio" + hash({ strata: 3, stages: 1 }), { waitUntil: "networkidle" });
  await expect(page.getByText("Σ π_k over the frame").locator("..")).toContainText("160.00");
  const handle = page.getByRole("slider", { name: "n_h: Villages" });
  await handle.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("radio", { name: "Custom" })).toHaveAttribute("aria-checked", "true");
  await expect(page.getByText("Σ π_k over the frame").locator("..")).toContainText("161.00");
});

test("keyboard: Weighting & Calibration Lab steps raking, hides variances until predicted, reports infeasible bounds", async ({ page }) => {
  await page.goto("/lab/weighting-calibration-lab" + hash({ method: "raking", hideVar: true }), { waitUntil: "networkidle" });
  const status = page.getByTestId("calib-status");
  await expect(status).toContainText("Converged after");
  await page.getByRole("button", { name: "One step back" }).focus();
  await page.keyboard.press("Enter");
  await expect(status).toContainText("not converged yet");
  await page.getByRole("button", { name: "Run to convergence" }).focus();
  await page.keyboard.press("Enter");
  await expect(status).toContainText("Converged after");
  const table = page.getByTestId("outcome-table");
  await expect(table.locator("tbody tr").first()).toContainText("?");
  await page.getByRole("radio", { name: "Online hours" }).first().focus();
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "Show the variances" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Largest reduction" })).toBeVisible();
  await expect(table.locator("tbody tr").first()).not.toContainText("?");
  await page.goto("/lab/weighting-calibration-lab" + hash({ method: "bounded", bounds: [0.95, 1.05] }), { waitUntil: "networkidle" });
  await expect(page.getByTestId("calib-status")).toContainText("Did not converge");
});

test("keyboard: Complex Survey Lab switches views, gates BRR and exports R code", async ({ page }) => {
  await page.goto("/lab/complex-survey-lab" + hash({ strata: 4, psuPerStratum: 6, method: "taylor" }), { waitUntil: "networkidle" });
  await expect(page.getByTestId("coverage")).toContainText("%");
  await expect(page.getByRole("radio", { name: "BRR" })).toBeDisabled();
  await page.getByRole("radio", { name: "Standard errors" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("heading", { name: "Domain estimate: group = C" })).toBeVisible();
  await page.goto("/lab/complex-survey-lab" + hash({ psuPerStratum: 2, method: "brr", view: "export" }), { waitUntil: "networkidle" });
  await expect(page.getByTestId("r-code")).toContainText('as.svrepdesign(des, type = "BRR")');
  await expect(page.getByTestId("r-code")).toContainText("svyglm(y ~ x + group, design = des)");
  await page.goto("/lab/complex-survey-lab" + hash({ view: "test" }), { waitUntil: "networkidle" });
  await expect(page.getByTestId("rao-scott")).toContainText("F =");
});

test("keyboard: Measurement & Index Lab toggles items, moves thresholds and hides alpha until predicted", async ({ page }) => {
  await page.goto("/lab/measurement-index-lab", { waitUntil: "networkidle" });
  const items = page.getByTestId("item-table");
  await expect(items).toContainText("T3 (R)");
  await page.getByRole("checkbox", { name: "include T6" }).focus();
  await page.keyboard.press("Space");
  await expect(items).not.toContainText("T6");
  await expect(page.getByText("0.782").first()).toBeVisible();
  await page.goto("/lab/measurement-index-lab" + hash({ view: "index" }), { waitUntil: "networkidle" });
  const t1 = page.getByRole("slider", { name: "Threshold 1" });
  await expect(t1).toHaveAttribute("aria-valuenow", "2.5");
  await t1.focus();
  await page.keyboard.press("ArrowRight");
  await expect(t1).toHaveAttribute("aria-valuenow", "2.55");
  await page.goto("/lab/measurement-index-lab" + hash({ hideAlpha: true }), { waitUntil: "networkidle" });
  await expect(page.getByRole("button", { name: "Reveal α" })).toBeDisabled();
  await page.getByLabel("Your prediction of α").fill("0.8");
  await page.getByRole("button", { name: "Reveal α" }).click();
  await expect(page.getByRole("status").filter({ hasText: "your guess" })).toContainText("α = 0.690");
});

test("keyboard: PCA Studio rotates the probe to PC1, flags a Heywood case, edits a matrix and steps k-means", async ({ page }) => {
  await page.goto("/lab/linalg-pca-studio" + hash({ dims: 2, standardize: true, theta: 43 }), { waitUntil: "networkidle" });
  const axis = page.getByRole("slider", { name: "Probe axis" });
  await expect(axis).toHaveAttribute("aria-valuenow", "43");
  await expect(page.getByText("you found the first principal component")).toBeVisible();
  await axis.focus();
  await page.keyboard.press("Shift+ArrowRight");
  await expect(axis).toHaveAttribute("aria-valuenow", "48");
  await expect(page.getByText("you found the first principal component")).toHaveCount(0);
  await page.getByRole("button", { name: "Snap to PC1" }).click();
  await expect(axis).toHaveAttribute("aria-valuenow", "45");
  await page.goto("/lab/linalg-pca-studio" + hash({ view: "items", method: "paf" }), { waitUntil: "networkidle" });
  await expect(page.getByTestId("paf-status")).toContainText("converged");
  await page.getByRole("radio", { name: "2", exact: true }).click();
  await expect(page.getByTestId("paf-status")).toContainText("Heywood");
  await page.goto("/lab/linalg-pca-studio" + hash({ view: "matrix" }), { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Rotation 90°" }).click();
  await expect(page.getByTestId("eigen-readout")).toContainText("No real eigenvectors");
  await page.getByRole("button", { name: "Symmetric [[2,1],[1,2]]" }).click();
  await expect(page.getByTestId("eigen-readout")).toContainText("λ = 3.000");
  await page.getByLabel("A[1,2]").fill("0");
  await page.getByLabel("A[2,1]").fill("0");
  await expect(page.getByTestId("eigen-readout")).toContainText("λ = 2.000, v = (1.000, 0.000)");
  await page.goto("/lab/linalg-pca-studio" + hash({ view: "kmeans", k: 3, step: 0 }), { waitUntil: "networkidle" });
  await expect(page.getByTestId("kmeans-step")).toContainText("Lloyd step 1/");
  await page.getByRole("button", { name: "Next step" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("kmeans-step")).toContainText("Lloyd step 2/");
});

test("keyboard: Math Studio moves x₀ on the tangent, flags the kink, steps down the SSE bowl and finds the likelihood maximum", async ({ page }) => {
  await page.goto("/lab/math-studio" + hash({ topic: "derivative", fn: "abs", x0: 0.1 }), { waitUntil: "networkidle" });
  const x0 = page.locator("svg").getByRole("slider", { name: "Point x₀" });
  await expect(x0).toHaveAttribute("aria-valuenow", "0.1");
  await x0.focus();
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");
  await expect(x0).toHaveAttribute("aria-valuenow", "0");
  await expect(page.getByRole("status").filter({ hasText: "kink" })).toBeVisible();
  await page.goto("/lab/math-studio" + hash({ topic: "integral", fn: "normal", lo: -1.96, hi: 1.96, nRect: 200, rule: "mid" }), { waitUntil: "networkidle" });
  await expect(page.getByText("0.950004").first()).toBeVisible();
  await page.goto("/lab/math-studio" + hash({ topic: "bowl", ba: 10, bb: 2 }), { waitUntil: "networkidle" });
  await expect(page.getByText("18,445.00", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Gradient step (exact line search)" }).click();
  await expect(page.getByText("18,445.00", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Jump to the minimum (normal equations)" }).click();
  await expect(page.getByText("516.81").first()).toBeVisible();
  await page.goto("/lab/math-studio" + hash({ topic: "likelihood", k: 7, n: 10, p: 0.5 }), { waitUntil: "networkidle" });
  const p = page.locator("svg").getByRole("slider", { name: "Candidate p" });
  await p.focus();
  for (let i = 0; i < 4; i++) await page.keyboard.press("Shift+ArrowRight");
  await expect(p).toHaveAttribute("aria-valuenow", "0.7");
});
