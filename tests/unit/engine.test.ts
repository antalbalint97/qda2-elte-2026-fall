// V3 engine (src/lib/engine) against SciPy / statsmodels / scikit-learn reference values
// (tests/unit/fixtures/reference-v3.json, written by scripts/validation/reference_v3.py) and against
// the self-test checks shipped with the V3 prototype engine.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";
import * as D from "../../src/lib/engine/distributions";
import * as S from "../../src/lib/engine/descriptives";
import * as I from "../../src/lib/engine/inference";
import * as R from "../../src/lib/engine/regression";
import * as L from "../../src/lib/engine/linalg";
import * as M from "../../src/lib/engine/measurement";
import * as P from "../../src/lib/engine/probability";
import * as C from "../../src/lib/engine/calculus";
import { fmt, fmtP } from "../../src/lib/engine/format";

const REF = JSON.parse(readFileSync(new URL("./fixtures/reference-v3.json", import.meta.url), "utf8"));
// The original SciPy fixture (scripts/validation/reference.py) used by tests/unit/stats.test.ts.
const REF1 = JSON.parse(readFileSync(new URL("./fixtures/reference.json", import.meta.url), "utf8"));

function close(actual: number | null | undefined, expected: number, tol: number, label = "") {
  assert.ok(actual !== null && actual !== undefined && Number.isFinite(actual), `${label}: got ${actual}, expected ${expected}`);
  const ok = Math.abs((actual as number) - expected) <= tol * Math.max(1, Math.abs(expected));
  assert.ok(ok, `${label}: got ${actual}, expected ${expected} (tolerance ${tol})`);
}

describe("distributions vs SciPy", () => {
  test("studentised range CDF (R ptukey port) vs scipy.stats.studentized_range", () => {
    for (const [q, k, df, p] of REF.ptukey) close(D.ptukey(q, k, df), p, 2e-7, `ptukey(${q},${k},${df})`);
  });
  test("studentised range quantile", () => {
    for (const [p, k, df, q] of REF.qtukey) close(D.qtukey(p, k, df), q, 1e-6, `qtukey(${p},${k},${df})`);
  });
  test("noncentral t CDF (AS 243) vs scipy.stats.nct", () => {
    for (const [t, df, ncp, p] of REF.nct) close(D.nctCdf(t, df, ncp), p, 5e-7, `nctCdf(${t},${df},${ncp})`);
  });
  test("t-test power (both tails) vs SciPy nct", () => {
    for (const [d, n, a, kind, pw] of REF.power) close(D.tPower(d, n, a, 2, kind).power, pw, 1e-6, `power(${d},${n},${a},${kind})`);
  });
  test("quantile functions", () => {
    for (const [p, k, x] of REF.quantiles.chi2) close(D.chi2Quantile(p, k), x, 1e-6, `chi2 ppf ${p} ${k}`);
    for (const [p, d1, d2, x] of REF.quantiles.f) close(D.fQuantile(p, d1, d2), x, 1e-6, `F ppf ${p} ${d1} ${d2}`);
    for (const [p, df, x] of REF.quantiles.t) close(D.tQuantile(p, df), x, 1e-7, `t ppf ${p} ${df}`);
    for (const [p, x] of REF.quantiles.norm) close(D.normalQuantile(p), x, 1e-8, `norm ppf ${p}`);
  });
  test("binomial and Poisson", () => {
    for (const [k, n, p, pmf, cdf] of REF.discrete.binom) {
      close(D.binomPmf(k, n, p), pmf, 1e-10, "binom pmf");
      close(D.binomCdf(k, n, p), cdf, 1e-10, "binom cdf");
    }
    for (const [k, l, pmf, cdf] of REF.discrete.pois) {
      close(D.poisPmf(k, l), pmf, 1e-10, "pois pmf");
      close(D.poisCdf(k, l), cdf, 1e-10, "pois cdf");
    }
  });
  test("family facade rejects invalid parameters instead of drawing a curve", () => {
    assert.equal(D.family("normal", { mu: 0, sigma: 0 }), null);
    assert.equal(D.family("binomial", { n: 3.5, p: 0.2 }), null);
    assert.equal(D.family("uniform", { a: 2, b: 1 }), null);
    const f = D.family("normal", { mu: 10, sigma: 2 });
    assert.ok(f);
    close(D.intervalProbability(f, 8, 12), 0.6826894921, 2e-7, "±1σ");
  });
  test("ptukey edge cases are explicit", () => {
    assert.equal(D.ptukey(2, 1, 10), null);
    assert.equal(D.ptukey(2, 3, 1), null);
    assert.equal(D.ptukey(0, 3, 10), 0);
  });
});

describe("descriptives", () => {
  const d = REF.descriptives;
  test("type-7 quantiles, skewness, kurtosis", () => {
    for (const [p, q] of d.q) close(S.quantile(d.x, p), q, 1e-12, `quantile ${p}`);
    close(S.skewness(d.x)?.G1, d.skewG1, 1e-10, "G1");
    close(S.skewness(d.x)?.g1, d.skewg1, 1e-10, "g1");
    close(S.kurtosis(d.x), d.kurtosis, 1e-10, "kurtosis");
  });
  test("undefined states", () => {
    assert.equal(S.describe([]).mean, null);
    assert.equal(S.describe([5]).variance, null);
    assert.equal(S.skewness([1, 1, 1]), null);
    assert.equal(S.zscores([2, 2, 2]), null);
    assert.equal(S.fiveNumber([]), null);
    assert.equal(S.describe([5], true).variance, 0);
  });
  test("identities: Σdev = 0, sample/population ratio", () => {
    const x = [3, 9, 4, 11, 7];
    const a = S.describe(x);
    close(a.devs.reduce((s, v) => s + v, 0), 0, 1e-12, "Σdev");
    close((S.describe(x, true).variance as number) / (a.variance as number), 4 / 5, 1e-12, "(n−1)/n");
  });
});

describe("categorical and correlation vs SciPy", () => {
  test("Pearson χ², Cramér's V, Yates, Fisher, odds ratio", () => {
    for (const c of Object.values(REF.categorical) as Record<string, unknown>[]) {
      const r = I.chiSquare(c.table as number[][]);
      close(r.chi2, c.chi2 as number, 1e-10, "chi2");
      close(r.p, c.p as number, 1e-9, "p");
      close(r.V, c.V as number, 1e-10, "V");
      assert.equal(r.df, c.df);
      if (c.yates !== undefined) {
        close(r.yates?.chi2, c.yates as number, 1e-10, "Yates");
        close(I.fisherExact(c.table as number[][])?.p, c.fisherP as number, 1e-9, "Fisher");
        const or = I.oddsRatio(c.table as number[][]);
        close(or?.or, c.oddsRatio as number, 1e-12, "OR");
        close(or?.ci[0], (c.orCI as number[])[0], 1e-8, "OR lo");
        close(or?.ci[1], (c.orCI as number[])[1], 1e-8, "OR hi");
      }
    }
  });
  test("degenerate tables are refused", () => {
    assert.equal(I.chiSquare([[0, 0], [0, 0]]).chi2, null);
    assert.equal(I.chiSquare([[5, 0], [3, 0]]).chi2, null);
    assert.equal(I.chiSquare([[5, -1], [3, 2]]).chi2, null);
  });
  test("Pearson r with Fisher-z CI and Spearman", () => {
    const c = REF.correlation;
    const r = I.pearson(c.x, c.y);
    close(r.r, c.r, 1e-12, "r");
    close(r.p, c.p, 1e-8, "p");
    close(r.ci?.[0], c.ci[0], 1e-8, "ci lo");
    close(r.ci?.[1], c.ci[1], 1e-8, "ci hi");
    const s = I.spearman(c.x, c.y);
    close(s.r, c.rho, 1e-12, "rho");
    close(s.p, c.rhoP, 1e-8, "rho p");
    assert.equal(I.pearson([1, 2, 3], [4, 4, 4]).r, null);
  });
  test("Welch and Student t with CIs", () => {
    const t = REF.ttests;
    const r = I.independentT(t.a, t.b);
    close(r.welch?.t, t.welchT, 1e-10, "Welch t");
    close(r.welch?.p, t.welchP, 1e-8, "Welch p");
    close(r.welch?.ci?.[0], t.welchCI[0], 1e-7, "Welch CI");
    close(r.equal?.t, t.eqT, 1e-10, "Student t");
    close(r.equal?.ci?.[1], t.eqCI[1], 1e-7, "Student CI");
    assert.equal(I.oneSampleT([4, 4, 4], 3).t, null);
    assert.equal(I.independentT([1], [2, 3]).welch, null);
  });
  test("t-test lab numbers vs the SciPy fixture: both rows, Levene, one-sample, paired, Hedges' g", () => {
    const T = REF1.ttests;
    const r = I.independentT(T.a, T.b);
    close(r.equal?.t, T.equal.t, 1e-10, "Student t");
    assert.equal(r.equal?.df, T.equal.df);
    close(r.equal?.p, T.equal.p, 1e-8, "Student p");
    close(r.welch?.df, T.welch.df, 1e-10, "Welch df");
    close(r.welch?.p, T.welch.p, 1e-8, "Welch p");
    close(r.levene.F, T.levene.f, 1e-10, "Levene F");
    close(r.levene.p, T.levene.p, 1e-8, "Levene p");
    close(r.g, T.hedgesG, 1e-12, "Hedges g");
    const o = I.oneSampleT(T.a, T.mu0);
    close(o.t, T.oneSample.t, 1e-10, "one-sample t");
    close(o.p, T.oneSample.p, 1e-8, "one-sample p");
    const pr = I.pairedT(T.pre, T.post);
    close(pr.t, T.paired.t, 1e-10, "paired t");
    assert.equal(pr.df, T.paired.df);
    close(pr.p, T.paired.p, 1e-8, "paired p");
  });
});

describe("ANOVA family vs SciPy / statsmodels", () => {
  test("Welch ANOVA vs statsmodels anova_oneway(use_var='unequal')", () => {
    const w = R.welchAnova(REF.welch.groups);
    close(w.F, REF.welch.F, 1e-10, "F");
    close(w.df2, REF.welch.df2, 1e-10, "df2");
    close(w.p, REF.welch.p, 1e-8, "p");
  });
  test("Tukey HSD vs scipy.stats.tukey_hsd", () => {
    const pw = R.pairwise(REF.welch.groups, "tukey");
    for (const ref of REF.tukey) {
      const row = pw.rows.find((r) => r.i === ref.i && r.j === ref.j);
      close(row?.p, ref.p, 2e-6, `Tukey p ${ref.i}-${ref.j}`);
      close(row?.ci?.[0], ref.lo, 1e-6, "Tukey lo");
      close(row?.ci?.[1], ref.hi, 1e-6, "Tukey hi");
    }
  });
  test("Games–Howell vs definition with scipy studentized_range", () => {
    const pw = R.pairwise(REF.welch.groups, "gameshowell");
    for (const ref of REF.gamesHowell) {
      const row = pw.rows.find((r) => r.i === ref.i && r.j === ref.j);
      close(row?.stat, ref.q, 1e-10, "q");
      close(row?.df, ref.df, 1e-10, "df");
      close(row?.p, ref.p, 2e-6, "p");
      // Welch df can be < 4 here, where the quadrature of the R algorithm is coarser: CI bounds to 1e-5.
      close(row?.ci?.[0], ref.lo, 1e-5, "lo");
      close(row?.ci?.[1], ref.hi, 1e-5, "hi");
    }
  });
  test("two-way ANOVA (unbalanced) Type I SS vs statsmodels anova_lm(typ=1)", () => {
    const tw = R.twoWay(REF.twoWay.cells);
    close(tw.A.ss, REF.twoWay.ssA, 1e-9, "SS A");
    close(tw.B.ss, REF.twoWay.ssB, 1e-9, "SS B");
    close(tw.AB.ss, REF.twoWay.ssAB, 1e-9, "SS AB");
    close(tw.within.ss, REF.twoWay.ssW, 1e-9, "SS W");
    close(tw.A.F, REF.twoWay.FA, 1e-9, "F A");
    close(tw.AB.p, REF.twoWay.pAB, 1e-8, "p AB");
    assert.equal(tw.balanced, false);
  });
  test("VRA base scenario: OLS and one-way ANOVA", () => {
    const v = REF.vra;
    const f = R.fit(v.x, v.y);
    close(f.slope, v.slope, 1e-12, "slope");
    close(f.r, v.r, 1e-12, "r");
    close((f.ssr as number) + (f.sse as number), f.sst as number, 1e-9, "SST = SSR + SSE");
    const groups = [0, 1, 2].map((j) => v.y.filter((_: number, i: number) => v.g[i] === j));
    const a = R.anova(groups);
    close(a.F, v.F, 1e-10, "F");
    close(a.p, v.p, 1e-8, "p");
    close(a.ssb + a.ssw, a.sst as number, 1e-9, "SST = SSB + SSW");
  });
  test("ANOVA edge cases", () => {
    const z = R.anova([[5, 5], [7, 7]]);
    assert.equal(z.F, null);
    assert.equal(z.zeroWithin, true);
    assert.equal(R.fit([2, 2, 2], [1, 2, 3]).reason, "noXVariation");
    const one = R.anova([[1, 2, 3], [], [4]]);
    assert.equal(one.k, 2);
    assert.equal(one.tooSmall, true);
  });
});

describe("regression vs statsmodels", () => {
  const o = REF.ols;
  const X = o.x1.map((v: number, i: number) => [v, o.x2[i]]);
  test("OLS coefficients, SE, HC3, R², F", () => {
    const f = R.ols(X, o.y);
    assert.ok(f.coef);
    if (!f.coef) return;
    o.coef.forEach((b: number, j: number) => close(f.coef[j], b, 1e-9, `b${j}`));
    o.se.forEach((b: number, j: number) => close(f.se[j], b, 1e-9, `se${j}`));
    o.seHC3.forEach((b: number, j: number) => close(f.seHC3?.[j], b, 1e-9, `HC3 ${j}`));
    close(f.r2, o.r2, 1e-10, "R²");
    close(f.adjR2, o.adjR2, 1e-10, "adj R²");
    close(f.F, o.F, 1e-9, "F");
    close(f.Fp, o.Fp, 1e-8, "F p");
  });
  test("leverage, internally studentised residuals, Cook's D, VIF (OLSInfluence)", () => {
    const f = R.ols(X, o.y);
    if (!f.coef) throw new Error("fit failed");
    o.leverage.forEach((h: number, i: number) => close(f.leverage[i], h, 1e-10, `h${i}`));
    o.stdRes.forEach((r: number, i: number) => close(f.stdRes[i], r, 1e-9, `r${i}`));
    o.cooks.forEach((d: number, i: number) => close(f.cooks[i], d, 1e-9, `D${i}`));
    o.vif.forEach((v: number, j: number) => close(f.vif?.[j], v, 1e-9, `VIF${j}`));
  });
  test("weighted least squares vs statsmodels WLS", () => {
    const f = R.ols(X, o.y, REF.wls.w);
    if (!f.coef) throw new Error("fit failed");
    REF.wls.coef.forEach((b: number, j: number) => close(f.coef[j], b, 1e-9, `wls b${j}`));
    REF.wls.se.forEach((b: number, j: number) => close(f.se[j], b, 1e-9, `wls se${j}`));
    close(f.r2, REF.wls.r2, 1e-10, "wls R²");
    assert.equal(f.seHC3, null);
  });
  test("logistic regression vs statsmodels Logit", () => {
    const l = REF.logit;
    const f = R.logit(l.x.map((v: number, i: number) => [v, l.z[i]]), l.y);
    assert.equal(f.converged, true);
    l.coef.forEach((b: number, j: number) => close(f.coef?.[j], b, 1e-7, `logit b${j}`));
    l.se.forEach((b: number, j: number) => close(f.se?.[j], b, 1e-6, `logit se${j}`));
    l.p.forEach((b: number, j: number) => close(f.p?.[j], b, 1e-6, `logit p${j}`));
    close(f.loglik, l.llf, 1e-8, "loglik");
    close(f.mcFaddenR2, l.prsquared, 1e-8, "McFadden");
  });
  test("regression refuses undefined fits", () => {
    assert.equal(R.ols([[1], [1], [1], [1]], [1, 2, 3, 4]).coef, null);
    assert.equal(R.ols([[1], [2]], [1, 2]).coef, null);
    const sep = R.logit([[1], [2], [3], [4], [5], [6]], [0, 0, 0, 1, 1, 1]);
    assert.equal(sep.coef, null);
    assert.equal(sep.separation, true);
    assert.equal(R.logit([[1], [2], [3]], [1, 1, 1]).coef, null);
  });
});

describe("PCA, eigen, reliability, probability, calculus", () => {
  test("PCA vs NumPy eigvalsh and scikit-learn", () => {
    const cols = REF.pca.data[0].map((_: number, j: number) => REF.pca.data.map((r: number[]) => r[j]));
    const p = L.pca(cols, true);
    assert.ok(p);
    if (!p) return;
    REF.pca.eigCorr.forEach((e: number, k: number) => close(p.eigenvalues[k], e, 1e-9, `λ${k}`));
    REF.pca.explained.forEach((e: number, k: number) => close(p.explained[k], e, 1e-9, `explained ${k}`));
    REF.pca.absFirstLoadingVector.forEach((v: number, j: number) => close(Math.abs(p.vectors[0][j]), v, 1e-7, `|v1_${j}|`));
    const pc = L.pca(cols, false);
    REF.pca.eigCov.forEach((e: number, k: number) => close(pc?.eigenvalues[k], e, 1e-9, `cov λ${k}`));
  });
  test("eigen [[2,1],[1,2]] = 3, 1; singular inverse is null", () => {
    const e = L.eigenSym([[2, 1], [1, 2]]);
    close(e.values[0], 3, 1e-12, "λ1");
    close(e.values[1], 1, 1e-12, "λ2");
    assert.equal(L.inverse([[1, 2], [2, 4]]), null);
    close(L.determinant([[1, 2], [3, 4]]), -2, 1e-12, "det");
  });
  test("Cronbach's α vs covariance form", () => {
    close(M.cronbach(REF.cronbach.items).alpha, REF.cronbach.alpha, 1e-12, "alpha");
    close(M.cronbach([[1, 2, 3, 4], [1, 2, 3, 4], [1, 2, 3, 4]]).alpha, 1, 1e-12, "identical items");
    assert.equal(M.cronbach([[1, 2, 3]]).alpha, null);
  });
  test("probability closed forms", () => {
    const die = [1, 2, 3, 4, 5, 6].map((x) => ({ x, p: 1 / 6 }));
    close(P.discreteRV(die).Var, 35 / 12, 1e-12, "die Var");
    close(P.bayes(0.01, 0.9, 0.05)?.pBgA, 0.009 / 0.0585, 1e-12, "Bayes");
    assert.equal(P.bayes(1.2, 0.5, 0.5), null);
    const two = P.diceSum(2, 6);
    close(two.find((o) => o.x === 7)?.p, 6 / 36, 1e-12, "P(sum=7)");
    assert.equal(P.discreteRV([{ x: 1, p: 0 }]).E, null);
    assert.equal(P.jointTable(0.3, 0.4, 0.5), null);
  });
  test("calculus helpers", () => {
    close(C.derivative((x) => x ** 3, 2), 12, 1e-6, "d/dx x³");
    close(C.integral((x) => x * x, 0, 3), 9, 1e-10, "∫x²");
    close(C.riemann((x) => x, 0, 1, 1000, "mid"), 0.5, 1e-12, "midpoint");
    const gd = C.gradientDescent((v) => (v[0] - 3) ** 2 + (v[1] + 1) ** 2, [0, 0], 0.1, 200);
    close(gd.x[0], 3, 1e-6, "argmin x");
    assert.equal(gd.diverged, false);
    assert.equal(C.gradientDescent((v) => v[0] ** 2, [1], 1.5, 200).diverged, true);
  });
  test("formatting is presentation-only and honest about undefined values", () => {
    assert.equal(fmt(null), "—");
    assert.equal(fmt(Number.NaN), "—");
    assert.equal(fmtP(0.0004), "< .001");
    assert.equal(fmtP(0.0456), ".046");
  });
});
