// Browser R adapter: the parts that run without a browser (limits, refusals, timeouts, the package allow-list).
import assert from "node:assert/strict";
import { test } from "node:test";
import { ALLOWED_PACKAGES, isAllowedPackage, LIMITS, limitLines, refuseCode, WEBR_VERSION, withTimeout } from "../../src/lib/r/webr-adapter";

test("pinned runtime version and package allow-list", () => {
  assert.equal(WEBR_VERSION, "0.4.2");
  assert.deepEqual([...ALLOWED_PACKAGES], ["survey"]);
  assert.equal(isAllowedPackage("survey"), true);
  for (const p of ["remotes", "devtools", "Survey", "survey; system('x')", ""]) assert.equal(isAllowedPackage(p), false, p);
});

test("refuseCode only limits length; R code is never inspected or rewritten as JavaScript", () => {
  assert.equal(refuseCode("1 + 1"), null);
  assert.equal(refuseCode("x".repeat(LIMITS.codeChars)), null);
  assert.match(refuseCode("x".repeat(LIMITS.codeChars + 1))!, /longer than 20000/);
});

test("limitLines splits multi-line chunks and truncates at the limit", () => {
  const r = limitLines([{ kind: "stdout", text: "a\nb" }, { kind: "error", text: "c" }]);
  assert.deepEqual(r, { lines: [{ kind: "stdout", text: "a" }, { kind: "stdout", text: "b" }, { kind: "error", text: "c" }], truncated: false });
  const many = limitLines([{ kind: "stdout", text: Array.from({ length: 10 }, (_, i) => String(i)).join("\n") }], 4);
  assert.equal(many.truncated, true);
  assert.deepEqual(many.lines.map((l) => l.text), ["0", "1", "2", "3"]);
});

test("withTimeout resolves with the result, or with the fallback once time is up", async () => {
  assert.equal(await withTimeout(Promise.resolve(7), 50, () => -1), 7);
  const slow = new Promise<number>((res) => setTimeout(() => res(7), 200));
  let fired = 0;
  assert.equal(await withTimeout(slow, 20, () => (fired++, -1)), -1);
  assert.equal(fired, 1);
});
