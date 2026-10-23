// Expected Value Lab: exact E and Var of the preset games, and the running mean of the seeded simulation.
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { EV_PRESETS } from "../../src/components/lab/labs/expected-value-lab/presets";
import { discreteRV, sampleDiscrete } from "../../src/lib/engine/probability";

const close = (a: number | null, b: number, tol: number, what: string) => assert.ok(a !== null && Math.abs(a - b) <= tol, `${what}: ${a} vs ${b}`);

describe("Expected Value Lab presets", () => {
  // Closed forms worked by hand: E = Σxp, Var = Σx²p − E².
  const exact: Record<keyof typeof EV_PRESETS, [number, number]> = {
    die: [3.5, 35 / 12],
    lottery: [-450 + 90 + 300, 0.9 * 500 ** 2 + 0.09 * 1000 ** 2 + 0.01 * 30000 ** 2 - 60 ** 2],
    insurance: [-120 * 0.97 + 3880 * 0.03, 0.97 * 120 ** 2 + 0.03 * 3880 ** 2 - (-120 * 0.97 + 3880 * 0.03) ** 2],
    bet: [1, 0.5 * 100 + 0.5 * 144 - 1],
  };
  for (const [k, [E, V]] of Object.entries(exact) as [keyof typeof EV_PRESETS, [number, number]][]) {
    test(`${k}: E and Var exact`, () => {
      const rv = discreteRV(EV_PRESETS[k]);
      close(rv.E, E, 1e-9 * Math.max(1, Math.abs(E)), "E");
      close(rv.Var, V, 1e-9 * V, "Var");
      assert.equal(rv.normalised, false, "preset probabilities sum to 1");
    });
    test(`${k}: running mean within 3·SD/√n at n = 10 000 for 20 seeds`, () => {
      const rv = discreteRV(EV_PRESETS[k]);
      let inside = 0;
      for (let seed = 1; seed <= 20; seed++) {
        const s = sampleDiscrete(EV_PRESETS[k], 10000, seed);
        assert.equal(s.running.length, 10000);
        assert.equal(s.index.length, 10000);
        if (Math.abs((s.mean as number) - (rv.E as number)) <= (3 * (rv.SD as number)) / 100) inside++;
      }
      // P(|Z| > 3) ≈ 0.27 %: allow at most one miss in 20.
      assert.ok(inside >= 19, `${inside}/20 inside`);
    });
  }
  test("simulation is deterministic per seed and indices map to values", () => {
    const a = sampleDiscrete(EV_PRESETS.lottery, 500, 7);
    const b = sampleDiscrete(EV_PRESETS.lottery, 500, 7);
    assert.deepEqual(a.draws, b.draws);
    a.index.forEach((k, i) => assert.equal(EV_PRESETS.lottery[k].x, a.draws[i]));
  });
});
