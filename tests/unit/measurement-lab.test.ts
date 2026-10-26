// Measurement & Index Lab: α, α-if-deleted, corrected item-total r and standardised α vs base R (covariance
// form) on the course item sets; cut rules; the attenuation factor √(ρ_xx ρ_yy) by simulation.
// Fixtures: scripts/validation/measurement_samples.ts + measurement_reference.R.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";
import { cronbachAlpha } from "../../src/lib/reliability";
import { cronbach } from "../../src/lib/engine/measurement";
import { pearson } from "../../src/lib/engine/inference";
import { gaussian, mulberry32 } from "../../src/lib/engine/rng";
import { attenuationOf, categorize, indexScores, itemSet, keyed, thresholds } from "../../src/components/lab/labs/measurement-index-lab/model";

const ITEMS = JSON.parse(readFileSync(new URL("./fixtures/measurement-items.json", import.meta.url), "utf8"));
const REF = JSON.parse(readFileSync(new URL("./fixtures/measurement-reference.json", import.meta.url), "utf8")).cases;
const close = (a: number | null | undefined, b: number, tol: number, what: string) => assert.ok(a !== null && a !== undefined && Math.abs(a - b) <= tol, `${what}: ${a} vs ${b}`);

describe("Measurement & Index Lab vs R", () => {
  for (const c of ITEMS.cases as { id: string; items: number[][] }[]) {
    test(c.id, () => {
      const cr = cronbach(c.items);
      const ref = REF[c.id];
      close(cr.alpha, ref.alpha, 1e-12, "alpha");
      close(cr.standardized, ref.standardized, 1e-12, "standardised alpha");
      cr.itemTotal.forEach((it, j) => {
        close(it.alphaIfDeleted, ref.alphaIfDeleted[j], 1e-12, `alpha if deleted ${j}`);
        close(it.corrected, ref.corrected[j], 1e-12, `corrected r ${j}`);
      });
      // the module 02 implementation (respondents × items) agrees
      const m = c.items[0].map((_, i) => c.items.map((x) => x[i]));
      close(cronbachAlpha(m), ref.alpha, 1e-12, "reliability.ts alpha");
    });
  }
  test("the exported matrices are the lab's keyed items", () => {
    const t = itemSet("trust");
    assert.deepEqual(keyed(t, t.names, ["T3", "T5"]).cols, ITEMS.cases[0].items);
  });
});

describe("Measurement & Index Lab invariants", () => {
  test("forgetting to reverse the negative items drives alpha below zero", () => {
    assert.ok((REF["trust-unkeyed"].alpha as number) < 0);
    assert.ok((REF["trust-keyed"].alpha as number) > 0.6);
  });

  test("cut rules: terciles split into thirds, absolute cuts follow the scale, categories sum to n", () => {
    const t = itemSet("trust");
    const idx = indexScores(keyed(t, ["T1", "T2", "T3", "T4", "T5"], ["T3", "T5"]).cols, "mean");
    const c = thresholds(idx, "relative", [2.5, 3.5], 5, "mean");
    const sizes = categorize(idx, c);
    assert.equal(sizes[0] + sizes[1] + sizes[2], 120);
    sizes.forEach((s) => assert.ok(s >= 25 && s <= 55, `tercile size ${s}`));
    assert.deepEqual(thresholds(idx, "absolute", [3.5, 2.5], 5, "sum"), [12.5, 17.5]);
  });

  test("attenuation: r_obs ≈ r_true · √ρ_xx (ρ_yy = 1), large-sample simulation", () => {
    // one-factor items, n = 20 000
    const z = gaussian(mulberry32(5));
    const n = 20000;
    const theta = Array.from({ length: n }, () => z());
    const cols = [0.8, 0.7, 0.6, 0.5].map((l) => theta.map((th) => 3 + l * th + Math.sqrt(1 - l * l) * z()));
    for (const e of [0.5, 1, 2]) {
      const a = attenuationOf(cols, e, 9, "mean");
      close(a.rObs, (a.rTrue as number) * Math.sqrt(a.rho), 0.01, `σ_e = ${e}`);
      assert.ok((a.rObs as number) < (a.rTrue as number));
    }
    const none = attenuationOf(cols, 0, 9, "mean");
    close(none.rObs, none.rTrue as number, 1e-12, "no error, no attenuation");
    close(pearson(none.index, none.y).r, none.rTrue as number, 1e-12, "same criterion");
  });
});
