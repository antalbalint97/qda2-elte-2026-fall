// One-way repeated-measures ANOVA vs base R (scripts/validation/rm_reference.R → fixtures/rm-reference.json).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";
import { rmAnova } from "../../src/lib/engine/regression";

const REF = JSON.parse(readFileSync(new URL("./fixtures/rm-reference.json", import.meta.url), "utf8")).cases;
const close = (a: number | null, b: number, tol: number, what: string) => assert.ok(a !== null && Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${what}: ${a} vs ${b}`);

describe("rmAnova vs R aov(Error()) and anova.mlm(test = 'Spherical')", () => {
  for (const [id, c] of Object.entries(REF) as [string, { data: number[][]; F: number; p: number; ssCond: number; ssErr: number; ssSubj: number; dfErr: number; pGG?: number }][]) {
    test(`case ${id} (${c.data.length} × ${c.data[0].length})`, () => {
      const r = rmAnova(c.data);
      close(r.ssCond, c.ssCond, 1e-9, "SS cond");
      close(r.ssErr, c.ssErr, 1e-9, "SS error");
      close(r.ssSubj, c.ssSubj, 1e-9, "SS subjects");
      assert.equal(r.dfErr, c.dfErr);
      close(r.F, c.F, 1e-9, "F");
      close(r.p, c.p, 1e-8, "p");
      if (c.pGG !== undefined) close(r.pGG, c.pGG, 1e-8, "p (Greenhouse–Geisser)");
      else assert.equal(r.epsGG, null);
    });
  }
  test("undefined cases are refused", () => {
    assert.equal(rmAnova([[1, 2]]).F, null);
    assert.equal(rmAnova([[1, 2], [3, 4]]).F, null); // no subject × condition variation
  });
});
