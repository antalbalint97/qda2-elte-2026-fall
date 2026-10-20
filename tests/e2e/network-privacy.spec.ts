import { createServer } from "node:http";
import { expect, test } from "@playwright/test";
import { watchExternalRequests } from "./helpers";
import { ROUTES } from "./routes";

test("no page contacts any host other than the site itself, and no cookies are set", async ({ page, baseURL, context }) => {
  const external = watchExternalRequests(page, baseURL!);
  const setCookie: string[] = [];
  page.on("response", async (r) => {
    const v = await r.headerValue("set-cookie");
    if (v) setCookie.push(`${r.url()}: ${v}`);
  });
  for (const route of ROUTES) {
    await page.goto(route, { waitUntil: "networkidle" });
    // exercise interactive parts that could trigger requests
    const slider = page.getByRole("slider").first();
    if (await slider.count()) {
      await slider.focus();
      await page.keyboard.press("ArrowRight");
    }
  }
  // the mocked AI explainer must not reach any service either
  await page.goto("/review", { waitUntil: "networkidle" });
  const options = page.getByRole("group", { name: "Answer options" }).first().getByRole("button");
  for (let i = 0; i < (await options.count()); i++) {
    await options.nth(i).click();
    if (await page.getByText("Not quite").count()) break;
    await page.getByRole("button", { name: "Try again" }).click();
  }
  const explain = page.getByRole("button", { name: /Explain why my answer was wrong/ });
  if (await explain.count()) {
    await explain.click();
    await expect(page.getByText(/Preview mode: no AI service is connected/)).toBeVisible();
  }
  await page.waitForLoadState("networkidle");
  expect([...external]).toEqual([]);
  expect(setCookie).toEqual([]);
  expect(await context.cookies()).toEqual([]);
});

test("only documented localStorage keys are written; nothing in sessionStorage or IndexedDB", async ({ page }) => {
  await page.goto("/measurement");
  await page.getByRole("button", { name: "Presentation mode" }).click();
  await page.getByRole("button", { name: "Toggle dark mode" }).click();
  await page.getByRole("group", { name: "Answer options" }).first().getByRole("button").first().click();
  const storage = await page.evaluate(async () => ({
    local: Object.keys(localStorage).sort(),
    session: Object.keys(sessionStorage),
    idb: "databases" in indexedDB ? (await indexedDB.databases()).map((d) => d.name) : [],
  }));
  expect(storage.local.every((k) => ["qda2-lab-progress-v1", "qda2-lab-theme", "qda2-lab-present", "qda2-sopranos-notes-v1"].includes(k))).toBe(true);
  expect(storage.local).toContain("qda2-lab-progress-v1");
  expect(storage.session).toEqual([]);
  expect(storage.idb).toEqual([]);
});

test("security headers are sent on pages and static assets", async ({ request }) => {
  for (const path of ["/", "/anova", "/privacy", "/no-such-page"]) {
    const res = await request.get(path);
    const h = res.headers();
    expect(h["content-security-policy"], path).toContain("default-src 'self'");
    expect(h["content-security-policy"], path).toContain("frame-ancestors 'none'");
    expect(h["content-security-policy"], path).not.toContain("unsafe-eval");
    expect(h["x-content-type-options"], path).toBe("nosniff");
    expect(h["x-frame-options"], path).toBe("DENY");
    expect(h["referrer-policy"], path).toBe("strict-origin-when-cross-origin");
    expect(h["permissions-policy"], path).toContain("camera=()");
    expect(h["x-powered-by"], path).toBeUndefined();
  }
  const html = await (await request.get("/")).text();
  const asset = html.match(/\/_next\/static\/[^"']+\.js/)![0];
  const a = await request.get(asset);
  expect(a.status()).toBe(200);
  expect(a.headers()["x-content-type-options"]).toBe("nosniff");
});

// A parent page on another local origin (127.0.0.1:3999 vs localhost) frames the site. It is served by a
// real local server: browsers treat route-mocked pages as public and would block the frame for another
// reason (Private Network Access). With the default configuration the browser must refuse to render
// the frame; when built with EMBED_ALLOWED_ORIGINS=http://127.0.0.1:3999 it must render
// (run with E2E_EXPECT_EMBED=1).
test("framing by another origin follows the configured policy", async ({ page, baseURL }) => {
  const server = createServer((_, res) => {
    res.setHeader("content-type", "text/html");
    res.end(`<!doctype html><title>LMS page</title><iframe title="embedded module" src="${baseURL}/p-values" width="900" height="700"></iframe>`);
  });
  await new Promise<void>((resolve) => server.listen(3999, "127.0.0.1", resolve));
  try {
    const failed: string[] = [];
    page.on("requestfailed", (r) => failed.push(`${r.url()} ${r.failure()?.errorText}`));
    await page.goto("http://127.0.0.1:3999/");
    const frame = page.frameLocator("iframe");
    if (process.env.E2E_EXPECT_EMBED) {
      await expect(frame.locator("h1")).toHaveText("p-values");
    } else {
      await page.waitForTimeout(1500);
      expect(page.frames()[1]?.url()).toBe("chrome-error://chromewebdata/");
      expect(failed.join("\n")).not.toContain("PRIVATE_NETWORK");
    }
  } finally {
    server.close();
  }
});

test("the privacy page shows local data and resets progress", async ({ page }) => {
  await page.goto("/measurement");
  await page.getByRole("group", { name: "Answer options" }).first().getByRole("button").first().click();
  await page.goto("/privacy");
  await expect(page.getByText(/Quiz questions answered so far in this browser: 1/)).toBeVisible();
  await page.getByRole("button", { name: "Reset learning progress" }).click();
  await page.getByRole("button", { name: "Yes, reset progress" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Learning progress was reset" })).toBeVisible();
  await expect(page.getByText(/Quiz questions answered so far in this browser: 0/)).toBeVisible();

  await page.getByRole("button", { name: /Delete everything/ }).click();
  await page.getByRole("button", { name: "Yes, delete everything" }).click();
  await page.waitForLoadState("load");
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);
});
