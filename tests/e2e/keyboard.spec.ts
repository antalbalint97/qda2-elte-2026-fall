import { expect, test } from "@playwright/test";

test("skip link moves focus to the main content", async ({ page }) => {
  await page.goto("/crosstabs");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to content" });
  await expect(skip).toBeFocused();
  await expect(skip).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main$/);
});

test("every focusable element shows a visible focus indicator", async ({ page }) => {
  await page.goto("/p-values");
  for (let i = 0; i < 25; i++) {
    await page.keyboard.press("Tab");
    const style = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return null;
      const s = getComputedStyle(el);
      return { tag: el.tagName, outline: s.outlineStyle, width: parseFloat(s.outlineWidth), shadow: s.boxShadow };
    });
    if (!style) continue;
    expect(style.outline !== "none" && style.width >= 2, `${style.tag} needs a focus outline`).toBe(true);
  }
});

test("p-value explorer: slider and tail switch work from the keyboard and results are announced", async ({ page }) => {
  await page.goto("/p-values");
  const slider = page.getByRole("slider", { name: "Test statistic (observed t)" });
  await slider.focus();
  const before = await page.getByText(/^p (=|<) /).first().textContent();
  for (let i = 0; i < 10; i++) await page.keyboard.press("ArrowRight");
  await expect(slider).toHaveValue("2.7");
  await expect(page.getByText(/^p (=|<) /).first()).not.toHaveText(before!);
  await expect(page.getByRole("status").filter({ hasText: "Observed t 2.70" })).toHaveText(/two-tailed p = \.0\d\d\. p below \.05: reject H0\./);

  const radios = page.getByRole("radiogroup", { name: "Test direction" });
  await radios.getByRole("radio", { name: "Two-tailed" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(radios.getByRole("radio", { name: "One-tailed" })).toBeFocused();
  await expect(radios.getByRole("radio", { name: "One-tailed" })).toHaveAttribute("aria-checked", "true");
});

test("crosstab: cell contents switch and transpose by keyboard; table keeps header semantics", async ({ page }) => {
  await page.goto("/crosstabs");
  const group = page.getByRole("radiogroup", { name: "Cell contents" }).first();
  await group.getByRole("radio", { name: "Row %" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(group.getByRole("radio", { name: "Column %" })).toHaveAttribute("aria-checked", "true");
  await expect(page.getByText("Compares X within Y ✗")).toBeVisible();
  const transpose = page.getByRole("button", { name: /Transpose/ });
  await transpose.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText("Compares Y within X ✓")).toBeVisible();
  expect(await page.locator("table th[scope=row]").count()).toBeGreaterThan(2);
});

test("ANOVA explorer: keyboard sliders keep SS(total) = SS(between) + SS(within)", async ({ page }) => {
  await page.goto("/anova");
  const gap = page.getByRole("slider", { name: "Group separation" });
  await gap.focus();
  for (let i = 0; i < 5; i++) await page.keyboard.press("ArrowRight");
  await page.getByRole("slider", { name: "Within-group spread" }).focus();
  await page.keyboard.press("ArrowLeft");
  const identity = await page.getByText(/^Check the identity:/).textContent();
  const [b, w, t] = identity!.match(/[\d,]+\.\d+/g)!.map((s) => Number(s.replace(/,/g, "")));
  expect(Math.abs(b + w - t)).toBeLessThan(0.011);
  await expect(page.getByRole("status").filter({ hasText: /^Between SS/ })).toContainText("F ");
  await expect(page.getByRole("img", { name: /Dot plot of three groups/ })).toHaveAttribute("aria-label", /F \d/);
});

test("variance lab: every chart can be driven from the keyboard, with text readouts", async ({ page }) => {
  await page.goto("/variance");
  // squares chart: choose respondent with arrow keys, move them with the slider
  const respondents = page.getByRole("radiogroup", { name: "Respondent to move" });
  await respondents.getByRole("radio", { name: "F" }).focus();
  await page.keyboard.press("ArrowLeft");
  await expect(respondents.getByRole("radio", { name: "E" })).toHaveAttribute("aria-checked", "true");
  const slider = page.getByRole("slider", { name: "Books read by respondent E" });
  await slider.focus();
  for (let i = 0; i < 3; i++) await page.keyboard.press("ArrowRight");
  await expect(slider).toHaveValue("12");
  // books 2, 4, 5, 7, 12, 15: mean 7.5, SS 125.5, variance 25.1
  await expect(page.getByRole("status").filter({ hasText: /^Respondent E/ })).toHaveText(/sum of squares 125\.5, variance 25\.1/);
  await expect(page.getByRole("img", { name: /Six respondents' book counts/ })).toHaveAttribute("aria-label", /E 12/);

  // residual squares: switch to your own line and tilt it
  await page.getByRole("radio", { name: "Mean of Y for everyone" }).focus();
  await page.keyboard.press("ArrowRight");
  const tilt = page.getByRole("slider", { name: /Tilt of your line/ });
  await tilt.focus();
  await page.keyboard.press("End");
  await expect(page.getByText(/^Your line leaves/)).toBeVisible();

  // error demo and spread patterns
  const errorSd = page.getByRole("slider", { name: /Size of the error/ });
  await errorSd.focus();
  await page.keyboard.press("Home");
  await expect(errorSd).toHaveAttribute("aria-valuetext", "error SD 2 points");
  await page.getByRole("button", { name: "Draw new samples" }).press("Enter");
  await page.getByRole("radio", { name: "Constant spread" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByText(/This is heteroscedasticity/)).toBeVisible();
});

test("index lab: build the index and cut it into categories from the keyboard", async ({ page }) => {
  await page.goto("/indices");
  const status = page.getByRole("status").filter({ hasText: /alpha|correlates/ });
  await expect(status).toHaveText(/T3 correlates negatively/);
  for (const id of ["T3", "T5"]) {
    const b = page.getByRole("button", { name: `Reverse-score ${id}` });
    await b.focus();
    await page.keyboard.press("Enter");
    await expect(b).toHaveAttribute("aria-pressed", "true");
  }
  // all six aligned: alpha .690, and T6 is the item to look at
  await expect(page.getByRole("img", { name: /Cronbach's alpha 0\.690: questionable/ })).toBeVisible();
  await expect(status).toHaveText(/Deleting T6 would raise alpha to 0\.782/);
  await page.getByRole("button", { name: "Delete T6" }).press("Enter");
  await expect(status).toHaveText(/^Done: alpha is acceptable/);
  // the three-item minimum
  await page.getByRole("button", { name: "Delete T1" }).press("Enter");
  await page.getByRole("button", { name: "Delete T2" }).press("Enter");
  await expect(page.getByRole("button", { name: "Delete T4" })).toBeDisabled();

  await page.getByRole("radio", { name: "Absolute" }).focus();
  await page.keyboard.press("ArrowRight");
  const h = page.getByRole("slider", { name: "Half-width h" });
  await h.focus();
  await page.keyboard.press("End");
  await expect(h).toHaveAttribute("aria-valuetext", "plus or minus 1.0");
  await expect(page.getByRole("img", { name: /Histogram of the index with relative categories/ })).toBeVisible();
});

test("quiz: answer with the keyboard, hear the feedback, retry", async ({ page }) => {
  await page.goto("/review");
  const first = page.getByRole("group", { name: "Answer options" }).first().getByRole("button").first();
  await first.focus();
  await page.keyboard.press("Enter");
  const feedback = page.getByRole("status").filter({ hasText: /Correct|Not quite|Defensible/ });
  await expect(feedback).toBeVisible();
  await expect(page.getByText(/\((correct answer|your answer, incorrect|your answer, defensible)\)/).first()).toBeAttached();
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(feedback).toHaveCount(0);
});

test("ordering question: arrow buttons reorder and announce the new position", async ({ page }) => {
  await page.goto("/lazarsfeld");
  const down = page.getByRole("button", { name: /^Move “.*” down$/ }).first();
  await down.scrollIntoViewIfNeeded();
  const label = (await down.getAttribute("aria-label"))!.replace(/^Move “|” down$/g, "");
  await down.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status").filter({ hasText: `“${label}” moved to position 2` })).toBeAttached();
});

test("correlation guess: slider is locked after reveal and the result is announced", async ({ page }) => {
  await page.goto("/correlation");
  const guess = page.getByRole("slider", { name: "Your guess" });
  await guess.focus();
  await page.keyboard.press("ArrowRight");
  await page.getByRole("button", { name: "Reveal r" }).click();
  await expect(guess).toBeDisabled();
  await expect(page.getByRole("status").filter({ hasText: /^r = / })).toContainText("off by");
});

test("presentation mode: toggle, persists, and can be set by URL", async ({ page }) => {
  await page.goto("/");
  const btn = page.getByRole("button", { name: "Presentation mode" });
  const h1 = page.locator("h1");
  const base = (await h1.boundingBox())!.height;
  await btn.click();
  await expect(btn).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("html")).toHaveClass(/present/);
  expect((await h1.boundingBox())!.height).toBeGreaterThan(base * 1.1);
  await page.goto("/anova");
  await expect(page.locator("html")).toHaveClass(/present/);
  await page.goto("/anova?present=0");
  await expect(page.locator("html")).not.toHaveClass(/present/);
  await page.goto("/crosstabs?present=1");
  await expect(page.locator("html")).toHaveClass(/present/);
});

test("mobile menu opens and closes by keyboard @layout", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const menu = page.getByRole("button", { name: "Open menu" });
  await menu.focus();
  await page.keyboard.press("Enter");
  await expect(menu).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("navigation", { name: "Modules" }).getByRole("link", { name: /ANOVA Mathematics Lab/ })).toBeVisible();
});
