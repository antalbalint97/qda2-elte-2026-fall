// Checks the teaching data and the interactive calculations of each module: analytical identities,
// boundary values of the sliders, consistency of static SPSS outputs, and the decision logic shown
// next to rounded p-values.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";
import { anova, mean, ORIGINAL } from "../../src/components/modules/anova/data";
import { linearSample, monotonicSample, rhoSample, uShapeSample } from "../../src/components/modules/correlation/gen";
import { COUNTS } from "../../src/components/modules/crosstab/data";
import { EXPLORER, SCENARIOS, type Pattern } from "../../src/components/modules/lazarsfeld/data";
import {
  BOOK_RANGE,
  BOOKS,
  errorDanceSamples,
  errorSd,
  INCOMES,
  NEWS,
  NINTH_INCOME,
  POP,
  REPEATS,
  simulateSample,
  SPREAD_N,
  SPREAD_SEED,
  spreadByThird,
  TRUST_GROUPS,
} from "../../src/components/modules/variance/data";
import {
  chiSquareTest,
  fP,
  formatP,
  linearFit,
  median,
  normalCdf,
  normalPdf,
  pBoundaryNote,
  pearson,
  sd,
  simulateNullT,
  spearman,
  ssAroundLine,
  sumOfSquares,
  tCdf,
  tCritical,
  tTwoTailedP,
  variance,
} from "../../src/lib/stats";

const REF = JSON.parse(readFileSync(new URL("./fixtures/reference.json", import.meta.url), "utf8"));
const range = (a: number, b: number, step: number) =>
  Array.from({ length: Math.round((b - a) / step) + 1 }, (_, i) => +(a + i * step).toFixed(10));

function close(actual: number, expected: number, tol: number, label = "") {
  assert.ok(Math.abs(actual - expected) <= tol * Math.max(1, Math.abs(expected)), `${label}: ${actual} vs ${expected}`);
}

/** The decision printed next to a p-value must agree with the number printed. */
function assertDisplayMatchesDecision(p: number, label: string) {
  const shown = formatP(p);
  const shownValue = shown.startsWith("<") ? 0 : Number(shown.slice(2));
  if (p < 0.05) assert.ok(shownValue <= 0.05 && shown !== "= .050", `${label}: significant but displayed ${shown} (p = ${p})`);
  else assert.ok(shownValue >= 0.05, `${label}: not significant but displayed ${shown} (p = ${p})`);
}

/** Where only a p-value is shown, a value printed as ".050" must come with the boundary note. */
function assertUnambiguous(p: number, label: string) {
  try {
    assertDisplayMatchesDecision(p, label);
  } catch (e) {
    const note = pBoundaryNote(p);
    assert.ok(note && note.includes(p < 0.05 ? "just below" : "not below"), `${label}: ${(e as Error).message}`);
  }
}

describe("02 Crosstabs", () => {
  test("teaching table is the one checked against SciPy", () => {
    assert.deepEqual(COUNTS, REF.crosstabs.crosstabs_age_language.table);
  });
  test("chi-square demo: V is invariant across the whole sample-size slider, chi-square scales with N", () => {
    const base = chiSquareTest(COUNTS);
    for (const f of range(0.3, 40, 0.2)) {
      const t = chiSquareTest(COUNTS.map((r) => r.map((c) => (c * f) / 10)));
      close(t.cramersV, base.cramersV, 1e-12, `V at f=${f}`);
      close(t.chi2, (base.chi2 * f) / 10, 1e-10, `chi2 at f=${f}`);
      assert.ok(t.p >= 0 && t.p <= 1);
    }
  });
});

describe("03 Lazarsfeld", () => {
  const all = [
    ...Object.values(EXPLORER).map((e) => ({ id: `explorer-${e.pattern}`, pattern: e.pattern, zero: e.zero, partials: e.partials })),
    ...SCENARIOS.map((s) => ({ id: s.id, pattern: s.pattern, zero: s.zero, partials: s.partials })),
  ];
  for (const ex of all) {
    test(`${ex.id}: each zero-order percentage lies between its two partial percentages`, () => {
      // A marginal percentage is a weighted average of the conditional ones, so it must lie between them.
      for (const i of [0, 1]) {
        const lo = Math.min(ex.partials[0][i], ex.partials[1][i]);
        const hi = Math.max(ex.partials[0][i], ex.partials[1][i]);
        assert.ok(ex.zero[i] >= lo && ex.zero[i] <= hi, `X category ${i}: ${ex.zero[i]} not in [${lo}, ${hi}]`);
      }
    });
    test(`${ex.id}: partial differences fit the stated pattern (${ex.pattern})`, () => {
      const zeroDiff = ex.zero[1] - ex.zero[0];
      const d = ex.partials.map((p) => p[1] - p[0]);
      const rules: Record<Pattern, () => boolean> = {
        rep: () => d.every((x) => Math.abs(x - zeroDiff) <= 0.25 * Math.abs(zeroDiff)),
        spec: () => Math.abs(d[0] - d[1]) >= 0.5 * Math.abs(zeroDiff),
        expl: () => d.every((x) => Math.abs(x) <= 0.35 * Math.abs(zeroDiff)),
        interp: () => d.every((x) => Math.abs(x) <= 0.35 * Math.abs(zeroDiff)),
      };
      assert.ok(rules[ex.pattern](), `zero-order ${zeroDiff}, partial ${d.join(", ")}`);
    });
  }
});

describe("04 p-values", () => {
  test("explorer: tail areas for every slider position, both test directions", () => {
    const DF = 24;
    for (const t of range(0, 4, 0.05)) {
      const two = 2 * (1 - tCdf(t, DF));
      const one = 1 - tCdf(t, DF);
      close(two, tTwoTailedP(t, DF), 1e-9, `two-tailed at ${t}`);
      close(one, two / 2, 1e-9, `one-tailed at ${t}`);
      assertDisplayMatchesDecision(two, `explorer two-tailed t=${t}`);
      assertDisplayMatchesDecision(one, `explorer one-tailed t=${t}`);
      // the dashed cut-off and the p-value decision must agree
      assert.equal(two < 0.05, t > tCritical(DF), `two-tailed cut-off at ${t}`);
      assert.equal(one < 0.05, t > tCritical(DF, 0.1), `one-tailed cut-off at ${t}`);
    }
    assert.equal(2 * (1 - tCdf(0, DF)), 1, "t = 0 gives p = 1");
  });
  test("sample-size demo: same difference, shrinking p", () => {
    let prev = 1;
    for (const n of [20, 50, 100, 250, 500, 1000]) {
      const p = tTwoTailedP((64 - 60) / (20 / Math.sqrt(n)), n - 1);
      assert.ok(p < prev, `p should fall as N grows (N=${n})`);
      assertDisplayMatchesDecision(p, `N=${n}`);
      prev = p;
    }
  });
  test("maths panel: every slider combination is unambiguous (rounded p or boundary note)", () => {
    const NS = [5, 10, 15, 20, 25, 30, 40, 50, 75, 100, 150, 200, 300, 500, 1000];
    for (const xbar of range(50, 70, 0.5))
      for (const mu0 of range(50, 70, 0.5))
        for (const s of range(2, 40, 1))
          for (const n of NS) {
            const p = tTwoTailedP((xbar - mu0) / (s / Math.sqrt(n)), n - 1);
            assert.ok(p >= 0 && p <= 1);
            assertUnambiguous(p, `x=${xbar} mu0=${mu0} s=${s} n=${n}`);
          }
  });
  test("go-further p-value panel: every slider combination is unambiguous", () => {
    for (const diff of range(1, 12, 0.5))
      for (const sdv of range(5, 40, 1))
        for (const n of range(10, 250, 5)) assertUnambiguous(tTwoTailedP(diff / (sdv / Math.sqrt(n)), n - 1), `diff=${diff} sd=${sdv} n=${n}`);
  });
  test("boundary note", () => {
    assert.equal(pBoundaryNote(0.032), null);
    assert.match(pBoundaryNote(0.04996)!, /\.04996, which is just below/);
    assert.match(pBoundaryNote(0.0504)!, /\.05040, which is not below/);
  });
  test("go-further simulation: simulated null t values reproduce the analytical p-value", () => {
    for (const [diff, sdv, n] of [
      [5, 20, 10],
      [5, 20, 40],
      [3, 10, 25],
      [8, 30, 15],
    ]) {
      const t = diff / (sdv / Math.sqrt(n));
      const p = tTwoTailedP(t, n - 1);
      const sim = simulateNullT(n, sdv, Math.abs(t), 1234 + n, 4000);
      const se = Math.sqrt((p * (1 - p)) / 4000);
      assert.ok(Math.abs(sim.empirical - p) < 4 * se + 0.002, `n=${n}: simulated ${sim.empirical}, analytical ${p}`);
    }
  });
  test("go-further simulation at the slider extremes stays finite", () => {
    for (const [n, sdv] of [
      [10, 5],
      [250, 40],
    ]) {
      const sim = simulateNullT(n, sdv, 2, 7);
      assert.equal(sim.values.length, 500);
      assert.ok(sim.values.every(Number.isFinite));
    }
  });
});

describe("05 Correlation", () => {
  test("rhoSample targets the stated population correlation", () => {
    for (const rho of [-0.9, -0.5, 0, 0.3, 0.7, 0.9]) {
      const { xs, ys } = rhoSample(99, 20000, rho);
      close(pearson(xs, ys), rho, 0.02, `rho=${rho}`);
    }
  });
  test("playground presets: slope s/√(1+s²) gives the requested population r", () => {
    for (const target of [-0.9, -0.5, 0.5, 0.9]) {
      const slope = Math.abs(target) / Math.sqrt(1 - target * target);
      const { xs, ys } = linearSample(3, 20000, Math.sign(target) * slope, 1);
      close(pearson(xs, ys), target, 0.02, `preset ${target}`);
    }
  });
  test("playground extremes are well defined", () => {
    const flat = linearSample(7, 120, 0, 2.5);
    assert.ok(Number.isFinite(pearson(flat.xs, flat.ys)));
    const steep = linearSample(7, 120, 2.5, 0.15);
    assert.ok(pearson(steep.xs, steep.ys) > 0.99);
  });
  test("U-shape example: strong pattern, near-zero r; monotonic example: Spearman above Pearson", () => {
    const u = uShapeSample(42, 150);
    assert.ok(Math.abs(pearson(u.xs, u.ys)) < 0.2);
    const m = monotonicSample(5, 120);
    assert.ok(spearman(m.xs, m.ys) > pearson(m.xs, m.ys));
  });
});

describe("06 t-tests: static SPSS outputs are internally consistent", () => {
  const cases: Array<[string, number, number, string]> = [
    ["p-values page, one-sample", 2.06, 24, "= .050"],
    ["Levene panel, equal variances", 2.14, 1198, "= .033"],
    ["Levene panel, Welch", 2.08, 961.4, "= .038"],
    ["SPSS guide, one-sample", 3.12, 199, "= .002"],
    ["SPSS guide, paired", 6.48, 1049, "< .001"],
  ];
  for (const [label, t, df, shown] of cases)
    test(`${label}: t(${df}) = ${t} prints Sig. ${shown}`, () => assert.equal(formatP(tTwoTailedP(t, df)), shown));
  test("Levene panel: F(1, 1198) values print the Sig. shown", () => {
    // The printed F is itself rounded: any F in [0.665, 0.675) is consistent with the printed .412
    assert.ok(fP(0.675, 1, 1198) <= 0.412 && fP(0.665, 1, 1198) >= 0.412, "Levene p shown as .412");
    assert.equal(formatP(fP(8.32, 1, 1198)), "= .004");
  });
  test("SPSS guide: paired t follows from mean 0.42, SD 2.10, n = 1050", () => {
    close(0.42 / (2.1 / Math.sqrt(1050)), 6.48, 0.002);
  });
  test("SPSS guide: one-sample 95% CI follows from mean difference and t", () => {
    const se = 2.84 / 3.12;
    const crit = tCritical(199);
    close(2.84 - crit * se, 1.04, 0.006, "lower");
    close(2.84 + crit * se, 4.64, 0.006, "upper");
  });
  test("p-values page: M = 64.0, SD = 9.7, n = 25 gives t = 2.06", () => {
    close((64 - 60) / (9.7 / 5), 2.06, 0.002);
  });
  test("effect-size overlap equals 2Φ(−d/2) and the numerical overlap of the curves", () => {
    for (const [d, ovl] of REF.overlap) {
      close(2 * normalCdf(-d / 2), ovl, 2e-7, `d=${d}`);
      let area = 0;
      const h = 0.001;
      for (let x = -8; x < 9; x += h) area += Math.min(normalPdf(x), normalPdf(x, d)) * h;
      close(area, ovl, 1e-3, `numerical d=${d}`);
    }
  });
});

describe("07 ANOVA", () => {
  test("the 11 observations match SciPy's one-way ANOVA", () => {
    assert.deepEqual(ORIGINAL, REF.anova.groups);
    const r = anova(ORIGINAL);
    close(r.between, REF.anova.ssb, 1e-12, "SSB");
    close(r.within, REF.anova.ssw, 1e-12, "SSW");
    close(r.total, REF.anova.sst, 1e-12, "SST");
    assert.equal(r.dfBetween, REF.anova.dfb);
    assert.equal(r.dfWithin, REF.anova.dfw);
    close(r.f, REF.anova.f, 1e-12, "F");
    close(fP(r.f, r.dfBetween, r.dfWithin), REF.anova.p, 1e-8, "p");
    close(r.eta, REF.anova.eta2, 1e-12, "eta squared");
    assert.ok(REF.anova.p < 0.0005, "the static SPSS table prints Sig. .000");
  });
  test("SS(total) = SS(between) + SS(within) and F, eta² agree for every slider position", () => {
    for (const gap of range(-12, 12, 1))
      for (const spread of range(0.2, 1.8, 0.1)) {
        const groups = ORIGINAL.map((xs, j) => {
          const c = mean(xs);
          const shift = j === 0 ? gap : j === 1 ? -gap : 0;
          return xs.map((x) => c + (x - c) * spread + shift);
        });
        const r = anova(groups);
        close(r.between + r.within, r.total, 1e-10, `identity gap=${gap} spread=${spread}`);
        assert.equal(r.dfBetween + r.dfWithin, 10);
        close(r.f, r.msBetween / r.msWithin, 1e-12);
        close(r.eta, r.between / r.total, 1e-12);
        // F and eta squared are two views of the same decomposition
        close(r.f, (r.eta / r.dfBetween) / ((1 - r.eta) / r.dfWithin), 1e-9, `F-eta gap=${gap} spread=${spread}`);
        assert.ok(r.eta >= 0 && r.eta <= 1);
      }
  });
  test("spreading individuals scales SS(within) by spread² and leaves SS(between) unchanged", () => {
    const base = anova(ORIGINAL);
    for (const spread of [0.2, 0.5, 1.5, 1.8]) {
      const r = anova(ORIGINAL.map((xs) => xs.map((x) => mean(xs) + (x - mean(xs)) * spread)));
      close(r.within, base.within * spread ** 2, 1e-10);
      close(r.between, base.between, 1e-10);
    }
  });
});

describe("08 Spread, variance & error", () => {
  test("teaching data are the ones checked against SciPy", () => {
    for (const g of TRUST_GROUPS) assert.deepEqual(g.values, REF.variance.trust[g.id].values, g.id);
    assert.deepEqual(BOOKS, REF.variance.books.values);
    assert.deepEqual(NEWS, { x: REF.variance.news.x, y: REF.variance.news.y });
  });
  test("four groups: same n, mean and median, different SD (the page's claim)", () => {
    const sds = TRUST_GROUPS.map((g) => {
      assert.equal(g.values.length, 20);
      assert.equal(mean(g.values), 5, `${g.id} mean`);
      assert.equal(median(g.values), 5, `${g.id} median`);
      assert.ok(g.values.every((v) => Number.isInteger(v) && v >= 0 && v <= 10));
      return sd(g.values);
    });
    assert.ok(sds[0] < 1 && sds[2] > 4, "consensus SD under 1, polarised SD about 4");
    assert.equal(new Set(sds.map((v) => v.toFixed(2))).size, 4, "all SDs differ");
  });
  test("income slider: the median never moves, the mean rises with the ninth income", () => {
    let prev = -Infinity;
    for (const v of range(NINTH_INCOME.min, NINTH_INCOME.max, NINTH_INCOME.step)) {
      const xs = [...INCOMES, v];
      assert.equal(median(xs), 390);
      assert.ok(mean(xs) > prev);
      prev = mean(xs);
    }
    assert.ok(mean([...INCOMES, NINTH_INCOME.max]) > Math.max(...INCOMES), "at the top, 8 of 9 people earn less than the mean");
  });
  test("squares chart: deviations sum to zero and variance = SS / (n − 1) for every slider position", () => {
    for (let i = 0; i < BOOKS.length; i++) {
      for (let v = BOOK_RANGE.min; v <= BOOK_RANGE.max; v++) {
        const xs = BOOKS.map((b, k) => (k === i ? v : b));
        const m = mean(xs);
        close(xs.reduce((a, x) => a + (x - m), 0), 0, 1e-12, `deviations ${i}=${v}`);
        close(variance(xs), sumOfSquares(xs) / 5, 1e-12);
        close(sd(xs) ** 2, variance(xs), 1e-12);
        // the average square must fit inside the chart's reserved area (SD ≤ 11 books)
        assert.ok(sd(xs) <= 11, `SD ${sd(xs)} at ${i}=${v}`);
      }
    }
  });
  test("residual squares: the best line leaves the least area of any tilt; slope 0 leaves the total", () => {
    const f = linearFit(NEWS.x, NEWS.y);
    const mx = mean(NEWS.x);
    const my = mean(NEWS.y);
    const sxx = sumOfSquares(NEWS.x);
    for (const b of range(-2, 8, 0.1)) {
      const ss = ssAroundLine(NEWS.x, NEWS.y, b, my - b * mx);
      assert.ok(ss >= f.ssResidual - 1e-9, `slope ${b}`);
      // SS(b) = SS residual + (b − b̂)² Σ(x − x̄)²
      close(ss, f.ssResidual + (b - f.slope) ** 2 * sxx, 1e-10, `decomposition at ${b}`);
    }
    close(ssAroundLine(NEWS.x, NEWS.y, 0, my), f.ssTotal, 1e-12);
    assert.ok(f.r2 > 0.8 && f.r2 < 0.85, "page describes about 82% accounted for");
  });
  test("error demo: the standard error predicts the sample-to-sample wobble of the slope", () => {
    // 2,000 samples with n = 30, error SD 10: the SD of the fitted slopes ≈ average SE
    const slopes: number[] = [];
    const ses: number[] = [];
    for (let seed = 1; seed <= 2000; seed++) {
      const s = simulateSample(30, 10, seed);
      const f = linearFit(s.x, s.y);
      slopes.push(f.slope);
      ses.push(f.seSlope);
    }
    close(mean(slopes), POP.slope, 0.01, "slopes centre on the population slope");
    const ratio = sd(slopes) / mean(ses);
    assert.ok(ratio > 0.93 && ratio < 1.07, `SD of slopes / mean SE = ${ratio}`);
  });
  test("error demo: residual SD tracks the error SD; every slider position prints an unambiguous p", () => {
    for (const sigma of range(2, 30, 1)) {
      for (const n of range(10, 200, 10)) {
        const samples = errorDanceSamples(n, sigma, 1);
        assert.equal(samples.length, REPEATS);
        const f = samples[0].fit;
        assert.ok(Number.isFinite(f.t) && Number.isFinite(f.seSlope));
        assertUnambiguous(f.p, `sigma=${sigma} n=${n}`);
        if (n >= 100) close(f.residualSd, sigma, 0.2, `residual SD at sigma=${sigma} n=${n}`);
      }
    }
  });
  test("spread patterns: same average error, constant vs funnel-shaped residuals", () => {
    const xs = range(0, POP.xMax, 0.01);
    for (const p of ["constant", "grows", "shrinks"] as const) close(mean(xs.map((x) => errorSd(p, x))), 10, 1e-3, p);
    const thirds = Object.fromEntries(
      (["constant", "grows", "shrinks"] as const).map((p) => {
        const s = simulateSample(SPREAD_N, 10, SPREAD_SEED, p);
        return [p, spreadByThird(s.x, linearFit(s.x, s.y).residuals)];
      }),
    );
    const ratio = (t: number[]) => t[2] / t[0];
    assert.ok(ratio(thirds.constant) > 0.75 && ratio(thirds.constant) < 1.33, `constant ${ratio(thirds.constant)}`);
    assert.ok(ratio(thirds.grows) > 2, `grows ${ratio(thirds.grows)}`);
    assert.ok(ratio(thirds.shrinks) < 0.5, `shrinks ${ratio(thirds.shrinks)}`);
  });
});
