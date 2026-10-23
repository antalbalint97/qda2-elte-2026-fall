import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { watchErrors } from "./helpers";

// Concept Atlas, Course Builder and published course pages: accessibility (axe, WCAG 2.2 AA tags) in light
// and dark mode with their interactive states open, keyboard use, and routing of unknown courses/versions.
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const scan = async (page: Page) => (await new AxeBuilder({ page }).withTags(TAGS).analyze()).violations.map((v) => `${v.impact} ${v.id}: ${v.nodes.length}× e.g. ${v.nodes[0].target.join(" ")}`);

const STATES: [string, string, (p: Page) => Promise<void>][] = [
  ["atlas (legend)", "/atlas", async () => {}],
  ["browser R", "/r", async () => {}],
  ["atlas (concept, pedagogical)", "/atlas#survey.inclusion_prob", async (p) => p.getByRole("button", { name: "Pedagogical" }).click()],
  ["course overview", "/course/course.survey", async () => {}],
  ["lesson", "/course/course.survey/s14/s14l0", async () => {}],
  [
    "builder (lesson + inspector)",
    "/builder",
    async (p) => {
      await p.getByRole("button", { name: "Sampling, Weights and Statistical Inference", exact: true }).click();
      await p.getByRole("button", { name: /^Weighting Studio/ }).click();
    },
  ],
  ["builder (library)", "/builder", async (p) => p.getByRole("tab", { name: "Library" }).click()],
];

for (const [name, url, act] of STATES) {
  for (const scheme of ["light", "dark"] as const) {
    test(`axe: ${name} (${scheme})`, async ({ page }) => {
      const errors = watchErrors(page);
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto(url, { waitUntil: "networkidle" });
      await act(page);
      await page.waitForTimeout(300);
      expect(await scan(page)).toEqual([]);
      expect(errors).toEqual([]);
    });
  }
}

test("atlas: keyboard selection, connections listed as text, hash kept", async ({ page }) => {
  await page.goto("/atlas", { waitUntil: "networkidle" });
  await page.getByRole("searchbox", { name: "Search concepts" }).fill("design effect");
  const btn = page.getByRole("button", { name: /^Design effect/ });
  await btn.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#survey\.design_effect$/);
  await expect(page.getByRole("heading", { level: 2, name: "Design effect" })).toBeFocused();
  await expect(page.getByRole("heading", { level: 3, name: "Prerequisites" })).toBeVisible();
  await page.getByRole("button", { name: "Pedagogical" }).click();
  await expect(page.getByRole("link", { name: "Open lab" }).first()).toHaveAttribute("href", /^\/lab\//);
  // authoring is enabled in this test server, so blocks can be handed to the Builder
  await expect(page.getByRole("button", { name: /^Add to Course Builder:/ }).first()).toBeVisible();
});

test("atlas → builder hand-off adds the picked block to the library search", async ({ page }) => {
  await page.goto("/atlas#survey.inclusion_prob", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Pedagogical" }).click();
  await page.getByRole("button", { name: "Add to Course Builder: πₖ and dₖ = 1/πₖ" }).click();
  await expect(page).toHaveURL(/\/builder$/);
  await expect(page.getByRole("searchbox", { name: "Search the library" })).toHaveValue("c.inclusion-weights");
  await expect(page.getByText("From the Concept Atlas: πₖ and dₖ = 1/πₖ.")).toBeVisible();
});

test("unknown courses, lessons and versions are 404; versions are addressable", async ({ page, request }) => {
  expect((await request.get("/course/course.nope")).status()).toBe(404);
  expect((await request.get("/course/course.survey/s14/nope")).status()).toBe(404);
  expect((await request.get("/course/course.survey?v=9.9.9")).status()).toBe(404);
  expect((await request.get("/course/course.survey/s14/s14l0?v=1.0.0")).status()).toBe(200);
  await page.goto("/course/course.survey", { waitUntil: "networkidle" });
  await expect(page.getByTestId("review-notice")).toContainText("not yet reviewed");
  await page.getByRole("link", { name: "Start the course" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("lesson pages load no lab or R runtime code they do not use", async ({ page }) => {
  const scripts: string[] = [];
  page.on("request", (r) => scripts.push(r.url()));
  await page.goto("/course/course.survey/s1/s1l1", { waitUntil: "networkidle" });
  expect(scripts.filter((u) => u.includes("/webr/"))).toEqual([]);
});

test("the home page and the footer lead to the labs, the Concept Atlas and browser R", async ({ page }) => {
  await page.goto("/");
  const explore = page.locator("#explore");
  for (const [name, href] of [["Interactive labs", "/labs"], ["Concept Atlas", "/atlas"], ["R in the browser", "/r"]]) {
    await expect(explore.getByRole("link", { name: new RegExp(`^${name}`) })).toHaveAttribute("href", href);
  }
  const footer = page.getByRole("navigation", { name: "Site information" });
  await footer.getByRole("link", { name: "Concept Atlas" }).click();
  await expect(page).toHaveURL(/\/atlas$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  // the unreviewed preview course is not listed in the navigation
  await page.goto("/");
  await expect(page.locator('a[href^="/course/"]')).toHaveCount(0);
});
