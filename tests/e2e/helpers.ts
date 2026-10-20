import { expect, type Page } from "@playwright/test";

/** Collects uncaught exceptions and console errors so a test can assert there were none. */
export function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`console: ${m.text()}`);
  });
  return errors;
}

/** Hosts other than the site itself that the page contacted. */
export function watchExternalRequests(page: Page, baseURL: string) {
  const host = new URL(baseURL).host;
  const external = new Set<string>();
  page.on("request", (r) => {
    const u = new URL(r.url());
    if (!["data:", "blob:"].includes(u.protocol) && u.host !== host) external.add(u.host);
  });
  return external;
}

export async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, "page should not scroll sideways").toBeLessThanOrEqual(1);
}
