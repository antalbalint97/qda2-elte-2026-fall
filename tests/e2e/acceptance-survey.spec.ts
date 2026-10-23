import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { watchErrors } from "./helpers";

// Release-blocking acceptance scenario (brief §17): Survey Statistics, lesson "Sampling, Weights and Statistical
// Inference". The instructor builds the lesson in the Course Builder and exports a versioned snapshot; the
// student works through the published lesson. Runs against the production build.
//
// R: with the webR package repository reachable (CI) the student runs the lesson's survey code unchanged and
// the output is compared with native R 4.3.3 + survey (mean 5.4308, SE 0.1822). Where the repository is blocked
// (E2E_NO_WEBR_REPO=1) the student runs base R on the same data instead (the Hájek mean, 5.430833), and the
// survey run is reported as skipped by the r.spec.ts survey test.
test.describe.configure({ timeout: 180_000 });

const lessonUrl = "/course/course.survey/s14/s14l0";
const section = (page: Page, title: string | RegExp) => page.locator("section", { has: page.getByRole("heading", { level: 2, name: title }) });

test("instructor: build the lesson in the Course Builder, preview it and export a versioned snapshot", async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto("/builder", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { level: 1, name: "Course Builder" })).toBeVisible();
  await expect(page.getByText("Everything here is saved only in this browser.")).toBeVisible();

  // 1. open the course (the Survey Statistics template is the default draft) and add a lesson to week 14
  await expect(page.getByRole("combobox", { name: "Course" })).toHaveValue("course.survey");
  const outline = page.getByRole("navigation", { name: "Outline" });
  await outline.getByRole("listitem").filter({ hasText: "Week 14" }).getByRole("button", { name: "+ Add lesson" }).click();
  await page.getByRole("textbox", { name: "Lesson title (English)" }).fill("Sampling, weights and inference (workshop)");
  await expect(outline.getByRole("button", { name: "Sampling, weights and inference (workshop)", exact: true })).toHaveAttribute("aria-current", "true");

  const library = page.getByRole("tabpanel");
  const addFromLibrary = async (search: string, title: RegExp) => {
    await page.getByRole("tab", { name: "Library" }).click();
    await page.getByRole("searchbox", { name: "Search the library" }).fill(search);
    await library.getByRole("button", { name: title }).first().click();
    await expect(page.getByTestId("inspector")).toBeVisible();
  };

  // 2. concept block on inclusion probabilities, with the instructor's own explanation
  await addFromLibrary("inclusion", /Add “πₖ and dₖ = 1\/πₖ” to the lesson/);
  await page.getByRole("textbox", { name: /Explanatory text/ }).fill("Every unit has a known inclusion probability πₖ fixed by the design.\n\nIts design weight is dₖ = 1/πₖ.");
  // 3. prediction
  await addFromLibrary("p.representative", /Add “Predict: is one random sample representative\?”/);
  await page.getByRole("textbox", { name: "Prompt / question shown to students" }).fill("Will the unweighted mean of an equal-allocation stratified sample be above or below the true mean?");
  // 4–5. Survey Weighting Studio, configured and locked
  await addFromLibrary("l.sws-weights", /Add “Weighting Studio · Step 6–8/);
  const insp = page.getByTestId("inspector");
  await insp.getByRole("spinbutton", { name: "stage (int)" }).fill("4");
  await insp.getByRole("combobox", { name: "design (enum)" }).selectOption("stratified");
  await insp.getByRole("spinbutton", { name: "n (int)" }).fill("120");
  await insp.getByRole("checkbox", { name: "design" }).check();
  await insp.getByRole("textbox", { name: "Student instructions (shown inside the lab)" }).fill("Write down πₖ for three sampled units.");
  await expect(insp.getByText("Variant: your overrides apply to this course only.")).toBeVisible();
  // 6. mathematical explanation
  await addFromLibrary("m.ht-hajek", /Add “Ŷ_HT = Σy\/π and ȳ_H = Σwy\/Σw”/);
  // 7. an R code block of the instructor's own
  await page.getByRole("tab", { name: "Library" }).click();
  await page.getByRole("combobox", { name: "Type" }).last().selectOption("r");
  await page.getByRole("textbox", { name: "Title", exact: true }).fill("R: the weighted mean");
  await page.getByRole("button", { name: "Create" }).last().click();
  await insp.getByRole("combobox", { name: /Dataset/ }).selectOption("ds.trust-survey");
  const code = insp.getByRole("textbox", { name: "Starter code" });
  await code.click();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.insertText("weighted.mean(trust_survey$trust, trust_survey$weight)");
  // 8. knowledge check
  await addFromLibrary("a.survey-variance", /Add “Check: deff, n_eff, variance methods”/);
  await expect(page.getByTestId("lesson-blocks").getByRole("listitem")).toHaveCount(6);
  // reorder: move the R block below the check and back (Alt+arrow and buttons)
  await page.getByRole("button", { name: "Move down: R: the weighted mean" }).click();
  await page.getByRole("button", { name: "Move up: R: the weighted mean" }).click();
  await expect(page.getByTestId("lesson-blocks").getByRole("listitem").nth(4)).toContainText("R: the weighted mean");

  // 9. student preview renders the draft with the same lesson renderer
  await page.getByRole("button", { name: "Student preview" }).click();
  const dialog = page.getByRole("dialog", { name: "Student preview" });
  await expect(dialog.getByRole("heading", { level: 1, name: "Sampling, weights and inference (workshop)" })).toBeVisible();
  await expect(dialog.getByTestId("review-notice")).toContainText("Preview of a local draft");
  await expect(dialog.getByText("Every unit has a known inclusion probability πₖ fixed by the design.")).toBeVisible();
  await expect(dialog.getByTestId("lab-survey-weighting-studio")).toBeVisible();
  await expect(dialog.getByTestId("lab-survey-weighting-studio").getByText("Write down πₖ for three sampled units.")).toBeVisible();
  await expect(dialog.getByRole("textbox", { name: /R code: R: the weighted mean/ })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();

  // 10. snapshot version + export
  await page.getByRole("button", { name: "Create snapshot version" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Snapshot version 1.0.0 created." })).toBeVisible();
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Export JSON" }).click()]);
  expect(download.suggestedFilename()).toBe("course.survey-1.0.0.qda2-course.json");
  const exp = JSON.parse(readFileSync((await download.path())!, "utf8"));
  expect(exp.schema).toBe("qda2-course/2");
  expect(exp.latestSnapshot).toBe("1.0.0");
  const snap = exp.course.versions[0].snapshot;
  expect(snap.schema).toBe("qda2-snapshot/2");
  expect(snap.missing).toEqual([]);
  const lesson = snap.units.flatMap((u: { lessons: unknown[] }) => u.lessons).find((l: { title: { en: string } }) => l.title.en === "Sampling, weights and inference (workshop)");
  const blocks = lesson.blocks.map((b: { iid: string }) => snap.blocks[b.iid]);
  expect(blocks.map((b: { type: string }) => b.type)).toEqual(["concept", "prediction", "lab", "math", "r", "assessment"]);
  expect(blocks[2].config).toMatchObject({ stage: 4, design: "stratified", n: 120 });
  expect(blocks[2].lockedControls).toEqual(["design"]);
  expect(blocks[4].config.code).toBe("weighted.mean(trust_survey$trust, trust_survey$weight)");
  expect(snap.datasets["ds.trust-survey"].rows).toHaveLength(180);
  expect(blocks[5].questionItems.length).toBeGreaterThan(0);
  // the status now says Exported; editing makes it a draft again
  await expect(page.getByTestId("builder-status").getByRole("listitem").nth(1)).toHaveAttribute("aria-current", "true");
  await page.getByRole("textbox", { name: "Lesson title (English)" }).fill("Sampling, weights and inference (workshop 2)");
  await expect(page.getByTestId("builder-status").getByRole("listitem").nth(0)).toHaveAttribute("aria-current", "true");
  // the snapshot taken before the edit keeps the old title
  await page.getByRole("button", { name: "Preview 1.0.0" }).click();
  await expect(page.getByRole("dialog").getByRole("heading", { level: 1, name: "Sampling, weights and inference (workshop)" })).toBeVisible();
  await page.keyboard.press("Escape");
  expect(errors).toEqual([]);
});

test("student: work through the published lesson without an account", async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto(lessonUrl, { waitUntil: "networkidle" });
  // 1–2. open the published lesson and read the concept
  await expect(page.getByRole("heading", { level: 1, name: "Sampling, Weights and Statistical Inference" })).toBeVisible();
  await expect(page.getByTestId("review-notice")).toContainText("not yet reviewed for teaching");
  await expect(section(page, "πₖ and dₖ = 1/πₖ")).toContainText("its inclusion probability πₖ");

  // 3. make a prediction; it survives a reload (this browser only)
  const prediction = section(page, "Predict: is one random sample representative?").getByRole("textbox", { name: "Your prediction" });
  await prediction.fill("Above: the tertiary group scores highest and is oversampled.");
  await expect(section(page, "Predict: is one random sample representative?").getByText("Saved in this browser only.")).toBeVisible();

  // 4. manipulate the survey laboratory (the design is locked by the instructor)
  const lab = page.getByTestId("lab-survey-weighting-studio");
  await expect(lab.getByText("Inclusion probabilities and base weights")).toBeVisible();
  await expect(lab.getByRole("radio", { name: "Stratified" })).toBeDisabled();
  await lab.getByRole("button", { name: /05\s*Estimates/ }).click();
  await expect(lab.getByText("Unweighted, Horvitz–Thompson and Hájek estimates")).toBeVisible();

  // 5. inspect the estimator
  const math = section(page, "Ŷ_HT = Σy/π and ȳ_H = Σwy/Σw");
  await expect(math.locator(".katex").first()).toBeVisible();
  await expect(math).toContainText("The Hájek estimator divides by the estimated population size");

  // 6–7. run real R code and see its output
  const rSection = section(page, "R: a weighted estimate with svydesign");
  const out = rSection.getByTestId("r-output");
  if (process.env.E2E_NO_WEBR_REPO) {
    const box = rSection.getByRole("textbox", { name: /R code/ });
    await box.click();
    await page.keyboard.press("ControlOrMeta+a");
    await page.keyboard.insertText("weighted.mean(trust_survey$trust, trust_survey$weight)");
    await rSection.getByRole("button", { name: "Run", exact: true }).click();
    await expect(out).toContainText("[1] 5.430833", { timeout: 120_000 });
    // Reset code restores the instructor's starter code
    await rSection.getByRole("button", { name: "Reset code" }).click();
    await expect(rSection.getByTestId("r-editor")).toContainText("svydesign(ids = ~psu");
  } else {
    await rSection.getByRole("button", { name: "Run", exact: true }).click();
    await expect(out).toContainText(/trust\s+5\.43083\s+0\.18221\s+2\.3872/, { timeout: 170_000 });
  }
  await rSection.getByText("Compare with the expected result").click();
  await expect(rSection.getByTestId("r-expected")).toContainText("SE ≈ 0.18");

  // 8. answer the knowledge check: a wrong answer gets its own feedback, the right one the explanation
  const q = page.locator('[data-question="s-deff-meaning"]');
  await q.getByRole("radio", { name: /biased upward/ }).check();
  await q.getByRole("button", { name: "Check" }).click();
  await expect(q.getByRole("status")).toContainText("Not quite.");
  await q.getByRole("button", { name: "Try again" }).click();
  await q.getByRole("radio", { name: /2\.4 times what an SRS/ }).check();
  await q.getByRole("button", { name: "Check" }).click();
  await expect(q.getByRole("status")).toContainText("Correct.");

  // 9. reset the experiment to the instructor's preset
  await section(page, "Weighting Studio · Step 6–8: inspect π, weight, compare").getByRole("button", { name: "Reset to the lesson's preset" }).click();
  await expect(page.getByTestId("lab-survey-weighting-studio").getByText("Inclusion probabilities and base weights")).toBeVisible();

  // the prediction is still there after a reload; the answers can be exported or deleted
  await page.reload({ waitUntil: "networkidle" });
  await expect(section(page, "Predict: is one random sample representative?").getByRole("textbox", { name: "Your prediction" })).toHaveValue("Above: the tertiary group scores highest and is oversampled.");
  await expect(page.getByText(/\d+ saved answers/)).toBeVisible();
  const [saved] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Save my answers as a file" }).click()]);
  const exported = JSON.parse(readFileSync((await saved.path())!, "utf8"));
  expect(exported.course).toBe("course.survey");
  expect(JSON.stringify(exported.answers)).toContain("the tertiary group scores highest");
  await page.getByRole("button", { name: "Delete my answers" }).click();
  await expect(section(page, "Predict: is one random sample representative?").getByRole("textbox", { name: "Your prediction" })).toHaveValue("");
  await page.reload({ waitUntil: "networkidle" });
  await expect(section(page, "Predict: is one random sample representative?").getByRole("textbox", { name: "Your prediction" })).toHaveValue("");

  // 10. continue to the next lesson
  await page.getByRole("link", { name: /Next lesson\s*Project/ }).click();
  await expect(page).toHaveURL(/\/course\/course\.survey\/s14\/s14l1$/);
  await expect(page.getByRole("heading", { level: 1, name: "Project" })).toBeVisible();
  expect(errors.filter((e) => !/PostMessage/.test(e))).toEqual([]);
});
