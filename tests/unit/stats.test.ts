// Numerical verification of src/lib/stats.ts against SciPy reference values
// (tests/unit/fixtures/reference.json, produced by scripts/validation/reference.py) and against
// analytical identities.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";
import {
  chiSquareP,
  chiSquareTest,
  correlationP,
  fP,
  formatP,
  hedgesG,
  independentT,
  leveneTest,
  median,
  normalCdf,
  oneSampleT,
  pairedT,
  pearson,
  ranks,
  sd,
  skewness,
  spearman,
  tCdf,
  tCritical,
  tTwoTailedP,
} from "../../src/lib/stats";

const REF = JSON.parse(readFileSync(new URL("./fixtures/reference.json", import.meta.url), "utf8"));

function close(actual: number, expected: number, tol: number, label = "") {
  const ok = Math.abs(actual - expected) <= tol * Math.max(1, Math.abs(expected));
  assert.ok(ok, `${label}: got ${actual}, expected ${expected} (tolerance ${tol})`);
}

describe("distribution functions match SciPy", () => {
  test("standard normal CDF", () => {
    for (const [x, p] of REF.normalCdf) close(normalCdf(x), p, 2e-7, `Phi(${x})`);
  });
  test("t CDF and two-tailed p", () => {
    for (const [t, df, cdf, p2] of REF.t) {
      close(tCdf(t, df), cdf, 1e-8, `tCdf(${t}, ${df})`);
      close(tTwoTailedP(t, df), p2, 1e-8, `tTwoTailedP(${t}, ${df})`);
      close(tTwoTailedP(-t, df), p2, 1e-8, `symmetry at ${t}`);
    }
  });
  test("critical t values", () => {
    for (const [df, a, crit] of REF.tCritical) close(tCritical(df, a), crit, 1e-7, `tCritical(${df}, ${a})`);
  });
  test("chi-square upper tail", () => {
    for (const [x, df, p] of REF.chiSquareP) close(chiSquareP(x, df), p, 1e-9, `chi2P(${x}, ${df})`);
    assert.equal(chiSquareP(0, 3), 1);
  });
  test("F upper tail", () => {
    for (const [f, d1, d2, p] of REF.fP) close(fP(f, d1, d2), p, 1e-9, `fP(${f}, ${d1}, ${d2})`);
    assert.equal(fP(0, 2, 8), 1);
  });
});

describe("crosstab statistics", () => {
  for (const [name, r] of Object.entries<{
    table: number[][];
    chi2: number;
    df: number;
    p: number;
    cramersV: number;
    expected: number[][];
  }>(REF.crosstabs)) {
    test(`${name}: chi-square, df, p, Cramér's V and expected counts`, () => {
      const t = chiSquareTest(r.table);
      close(t.chi2, r.chi2, 1e-10, "chi2");
      assert.equal(t.df, r.df);
      close(t.p, r.p, 1e-8, "p");
      close(t.cramersV, r.cramersV, 1e-10, "V");
      t.expected.flat().forEach((e, i) => close(e, r.expected.flat()[i], 1e-10, `expected[${i}]`));
    });
    test(`${name}: expected counts reproduce the observed marginals`, () => {
      const t = chiSquareTest(r.table);
      r.table.forEach((row, i) => close(t.expected[i].reduce((a, b) => a + b), row.reduce((a, b) => a + b), 1e-12, "row"));
      r.table[0].forEach((_, j) =>
        close(
          t.expected.reduce((s, row) => s + row[j], 0),
          r.table.reduce((s, row) => s + row[j], 0),
          1e-12,
          "col",
        ),
      );
    });
  }
  test("row and column percentages each sum to 100 within their denominator", () => {
    const tab: number[][] = REF.crosstabs.crosstabs_age_language.table;
    for (const row of tab) close(row.reduce((s, c) => s + (c / row.reduce((a, b) => a + b)) * 100, 0), 100, 1e-12);
    tab[0].forEach((_, j) => {
      const col = tab.reduce((s, row) => s + row[j], 0);
      close(tab.reduce((s, row) => s + (row[j] / col) * 100, 0), 100, 1e-12);
    });
  });
  test("scaling every cell by k multiplies chi-square by k and leaves V unchanged", () => {
    const tab: number[][] = REF.crosstabs.crosstabs_age_language.table;
    const base = chiSquareTest(tab);
    for (const k of [0.03, 0.5, 2, 4]) {
      const s = chiSquareTest(tab.map((r) => r.map((c) => c * k)));
      close(s.chi2, base.chi2 * k, 1e-10, `chi2 x ${k}`);
      close(s.cramersV, base.cramersV, 1e-12, `V x ${k}`);
    }
  });
  test("independence gives chi-square 0, p 1, V 0", () => {
    const t = chiSquareTest([
      [10, 20],
      [30, 60],
    ]);
    close(t.chi2, 0, 1e-12);
    close(t.p, 1, 1e-12);
    close(t.cramersV, 0, 1e-6);
  });
  test("Cramér's V is 1 for a perfect association", () => {
    close(chiSquareTest([[50, 0], [0, 50]]).cramersV, 1, 1e-12);
  });
});

describe("correlation", () => {
  const { x, y } = REF.correlation as { x: number[]; y: number[] };
  test("Pearson r and its p-value match SciPy", () => {
    close(pearson(x, y), REF.correlation.pearson, 1e-12, "r");
    close(correlationP(pearson(x, y), x.length), REF.correlation.pearsonP, 1e-8, "p");
  });
  test("Spearman rho uses average ranks for ties", () => {
    assert.deepEqual(ranks(x), REF.correlation.ranksX);
    close(spearman(x, y), REF.correlation.spearman, 1e-12, "rho");
  });
  test("edge cases: perfect, reversed, linear transforms, monotone transforms", () => {
    const a = [1, 2, 3, 4, 5, 6];
    close(pearson(a, a.map((v) => 3 * v + 2)), 1, 1e-12);
    close(pearson(a, a.map((v) => -v)), -1, 1e-12);
    close(pearson(x.map((v) => 10 * v - 4), y.map((v) => 0.5 * v + 1)), pearson(x, y), 1e-12, "affine invariance");
    close(spearman(a, a.map((v) => Math.exp(v))), 1, 1e-12, "monotone");
    close(spearman(x, y.map((v) => v ** 3)), spearman(x, y), 1e-12, "rank invariance");
  });
  test("a constant variable has no defined correlation (NaN), never a misleading number", () => {
    assert.ok(Number.isNaN(pearson([1, 2, 3], [4, 4, 4])));
  });
  test("|r| = 1 gives p = 0 without dividing by zero", () => {
    assert.ok(correlationP(1, 10) < 1e-10);
  });
});

describe("t-tests, Levene, effect size", () => {
  const T = REF.ttests;
  test("independent samples: both SPSS rows", () => {
    const r = independentT(T.a, T.b);
    close(r.equal.t, T.equal.t, 1e-10, "t equal");
    assert.equal(r.equal.df, T.equal.df);
    close(r.equal.p, T.equal.p, 1e-8, "p equal");
    close(r.welch.t, T.welch.t, 1e-10, "t welch");
    close(r.welch.df, T.welch.df, 1e-10, "df welch");
    close(r.welch.p, T.welch.p, 1e-8, "p welch");
  });
  test("Levene's test centred on the mean (as SPSS)", () => {
    const l = leveneTest(T.a, T.b);
    close(l.f, T.levene.f, 1e-10, "F");
    close(l.p, T.levene.p, 1e-8, "p");
  });
  test("one-sample and paired t", () => {
    const o = oneSampleT(T.a, T.mu0);
    close(o.t, T.oneSample.t, 1e-10);
    close(o.p, T.oneSample.p, 1e-8);
    const p = pairedT(T.pre, T.post);
    close(p.t, T.paired.t, 1e-10);
    assert.equal(p.df, T.paired.df);
    close(p.p, T.paired.p, 1e-8);
  });
  test("Hedges' g, SD, skewness (G1) and median", () => {
    close(hedgesG(T.a, T.b), T.hedgesG, 1e-12, "g");
    close(sd(T.a), T.sdA, 1e-12, "sd");
    close(skewness(T.a), T.skewnessA, 1e-12, "skew");
    assert.equal(median(T.b), T.medianB);
  });
  test("t = 0 gives p = 1", () => {
    assert.equal(tTwoTailedP(0, 10), 1);
  });
});

describe("SPSS-style p formatting", () => {
  test("three decimals, no leading zero, '< .001' for tiny values", () => {
    assert.equal(formatP(0.0004), "< .001");
    assert.equal(formatP(0.001), "= .001");
    assert.equal(formatP(0.0326), "= .033");
    assert.equal(formatP(0.5), "= .500");
    assert.equal(formatP(1), "= 1.000");
  });
  test("p just above .05 is displayed as .050 and is NOT significant: t(24) = 2.06", () => {
    const p = tTwoTailedP(2.06, 24);
    assert.equal(formatP(p), "= .050");
    assert.ok(p > 0.05, "the decision uses the unrounded p");
  });
});
