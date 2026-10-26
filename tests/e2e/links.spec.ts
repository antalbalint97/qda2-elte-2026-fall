import { expect, test } from "@playwright/test";
import { ROUTES } from "./routes";

test("every internal link resolves, and every #fragment exists on its target page", async ({ page, request, baseURL }) => {
  const links = new Set<string>();
  for (const route of ROUTES) {
    await page.goto(route);
    for (const href of await page.locator("a[href]").evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).href))) {
      const u = new URL(href);
      if (u.origin === new URL(baseURL!).origin) links.add(u.pathname + u.hash);
    }
  }
  const broken: string[] = [];
  const fragments = new Map<string, Set<string>>();
  for (const link of links) {
    const [path, hash] = link.split("#");
    const res = await request.get(path || "/");
    if (res.status() !== 200) broken.push(`${link} → ${res.status()}`);
    // on /lab/* the hash is the lab's state (#s=2, #{json}), not a fragment id; lab-state links are covered in labs.spec.ts
    if (hash && !path.startsWith("/lab/")) (fragments.get(path) ?? fragments.set(path, new Set()).get(path)!).add(hash);
  }
  for (const [path, hashes] of fragments) {
    await page.goto(path);
    for (const h of hashes) if (!(await page.locator(`[id="${h}"]`).count())) broken.push(`${path}#${h} (missing id)`);
  }
  expect(broken).toEqual([]);
  expect(links.size).toBeGreaterThan(20);
});

test("external links are few and use safe attributes", async ({ page, baseURL }) => {
  const external: string[] = [];
  for (const route of ROUTES) {
    await page.goto(route);
    for (const a of await page.locator("a[href^='http']").evaluateAll((as) => as.map((a) => ({ href: (a as HTMLAnchorElement).href, rel: a.getAttribute("rel") ?? "" })))) {
      if (!a.href.startsWith(baseURL!)) {
        external.push(a.href);
        expect(a.rel, a.href).toContain("noopener");
      }
    }
  }
  expect(new Set(external).size).toBeLessThanOrEqual(3);
});
