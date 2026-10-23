// Confidence-interval engine of the CI Explorer: closed-form intervals against statsmodels values and
// long-run coverage simulations (the "coverage simulations" item of the V3 validation plan).
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { normalQuantile } from "../../src/lib/engine/distributions";
import { rng } from "../../src/lib/engine/rng";
import { ciInterval, coverageSimulation, makeClusteredPopulation, wilsonInterval } from "../../src/lib/engine/sampling";

const close = (a: number, b: number, tol: number, what: string) => assert.ok(Math.abs(a - b) <= tol, `${what}: ${a} vs ${b}`);

describe("proportion intervals vs statsmodels proportion_confint", () => {
  // python: statsmodels.stats.proportion.proportion_confint(x, n, alpha, method) (0.15.0)
  const cases: [number, number, number, [number, number], [number, number]][] = [
    [16, 50, 0.05, [0.2075821626065684, 0.45810297308144077], [0.19070178350935835, 0.44929821649064167]],
    [9, 30, 0.1, [0.1837072270764405, 0.44938249617359916], [0.16238167208301102, 0.43761832791698896]],
  ];
  for (const [x, n, a, wil, wald] of cases) {
    test(`x=${x}, n=${n}, α=${a}`, () => {
      const p = x / n;
      const z = normalQuantile(1 - a / 2);
      const w = wilsonInterval(p, n, z);
      close(w.lo, wil[0], 1e-7, "Wilson lo");
      close(w.hi, wil[1], 1e-7, "Wilson hi");
      const se = Math.sqrt((p * (1 - p)) / n);
      close(p - z * se, wald[0], 1e-7, "Wald lo");
      close(p + z * se, wald[1], 1e-7, "Wald hi");
    });
  }
  test("Wilson stays inside [0, 1] where Wald does not (x = 2, n = 30)", () => {
    const z = normalQuantile(0.975);
    const w = wilsonInterval(2 / 30, 30, z);
    close(w.lo, 0.018477023791270378, 1e-7, "Wilson lo");
    close(w.hi, 0.21323458362616926, 1e-7, "Wilson hi");
    const p = 2 / 30;
    assert.ok(p - z * Math.sqrt((p * (1 - p)) / 30) < 0);
  });
});

describe("coverage simulations (finite population N = 2000, 50 clusters)", () => {
  const reps = 4000;
  // Binomial SE of a 95 % coverage over 4000 reps is 0.34 pp; ±1.5 pp is about 4.4 SE.
  test("SRS t interval at 95 % covers μ within ±1.5 pp (normal and skewed populations)", () => {
    for (const shape of ["normal", "skewed"] as const) {
      const P = makeClusteredPopulation(shape, 2000, 20261023);
      const r = coverageSimulation(P, { n: 30, level: 0.95, method: "t", design: "srs" }, reps, rng(7));
      const c = r.cover / r.count;
      assert.ok(Math.abs(c - 0.95) < 0.015, `${shape}: coverage ${c}`);
    }
  });
  test("SRS t interval at 80 % covers μ within ±2 pp", () => {
    const P = makeClusteredPopulation("normal", 2000, 20261023);
    const r = coverageSimulation(P, { n: 50, level: 0.8, method: "t", design: "srs" }, reps, rng(8));
    assert.ok(Math.abs(r.cover / r.count - 0.8) < 0.02, `coverage ${r.cover / r.count}`);
  });
  test("cluster design: design-based interval stays near nominal, the naive SRS interval under-covers", () => {
    const P = makeClusteredPopulation("normal", 2000, 20261023);
    const r = coverageSimulation(P, { n: 100, level: 0.95, method: "t", design: "cluster" }, reps, rng(9));
    const c = r.cover / r.count;
    const naive = (r.naive as number) / r.count;
    // a = 10 clusters: the ultimate-cluster t(9) interval ignores the sampling fraction 10/50, so it is
    // somewhat conservative; it must not under-cover.
    assert.ok(c > 0.93 && c < 0.995, `design-based coverage ${c}`);
    assert.ok(naive < 0.85, `naive coverage ${naive}`);
  });
  test("Wilson covers at least as well as Wald for the binary population (π = 0.32, n = 20)", () => {
    const P = makeClusteredPopulation("binary", 2000, 20261023);
    const wil = coverageSimulation(P, { n: 20, level: 0.95, method: "wilson", design: "srs", binary: true }, reps, rng(10));
    const wal = coverageSimulation(P, { n: 20, level: 0.95, method: "wald", design: "srs", binary: true }, reps, rng(10));
    assert.ok(wil.cover / wil.count >= wal.cover / wal.count - 0.005, `wilson ${wil.cover / wil.count} wald ${wal.cover / wal.count}`);
    assert.ok(Math.abs(wil.cover / wil.count - 0.95) < 0.025);
  });
  test("deterministic for a seed", () => {
    const P = makeClusteredPopulation("bimodal", 2000, 5);
    const a = ciInterval(P, { n: 30, level: 0.9, method: "t", design: "cluster" }, rng(3));
    const b = ciInterval(P, { n: 30, level: 0.9, method: "t", design: "cluster" }, rng(3));
    assert.deepEqual(a, b);
    assert.equal(a?.clusters, 3);
  });
});
