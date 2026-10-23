// Regression and ANOVA. The simple fit / sseLine / one-way anova contracts are the VRA lab's
// (HANDOFF §3); ols/logit/welch/pairwise/two-way extend them. Undefined results are null.
import { fP, normalCdf, normalQuantile, ptukey, qtukey, tCritical, tTwoTailedP } from "./distributions";
import { describe } from "./descriptives";
import { inverse, matmul, transpose, type Matrix } from "./linalg";
import { mean, ssAround, sum } from "./numeric";

// ── simple regression (VRA stage 2) ─────────────────────────────────────────
export interface SimpleFit {
  n: number;
  mx: number | null;
  my: number | null;
  slope: number | null;
  intercept: number | null;
  r: number | null;
  r2: number | null;
  sst: number | null;
  sse: number | null;
  ssr: number | null;
  fitted: number[] | null;
  residuals: number[] | null;
  reason: "noXVariation" | "tooFew" | null;
}

/** Least-squares line. SST = SSR + SSE holds only for this OLS fit (with intercept). */
export function fit(xs: readonly number[], ys: readonly number[]): SimpleFit {
  const n = xs.length;
  const mx = mean(xs);
  const my = mean(ys);
  if (n < 2 || mx === null || my === null) return { n, mx, my, slope: null, intercept: null, r: null, r2: null, sst: my === null ? null : ssAround(ys, my), sse: null, ssr: null, fitted: null, residuals: null, reason: "tooFew" };
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < n; i++) {
    sxy += (xs[i] - mx) * (ys[i] - my);
    sxx += (xs[i] - mx) ** 2;
    syy += (ys[i] - my) ** 2;
  }
  const sst = syy;
  if (sxx === 0) return { n, mx, my, slope: null, intercept: null, r: null, r2: null, sst, sse: null, ssr: null, fitted: null, residuals: null, reason: "noXVariation" };
  const slope = sxy / sxx;
  const intercept = my - slope * mx;
  const fitted = xs.map((x) => intercept + slope * x);
  const residuals = ys.map((y, i) => y - fitted[i]);
  const sse = sum(residuals.map((e) => e * e));
  const ssr = sum(fitted.map((f) => (f - my) ** 2));
  return { n, mx, my, slope, intercept, r: syy === 0 ? null : sxy / Math.sqrt(sxx * syy), r2: sst === 0 ? null : 1 - sse / sst, sst, sse, ssr, fitted, residuals, reason: null };
}

/** Σ(yᵢ − a − b·xᵢ)²: the squared vertical distances to any line (custom lines included). */
export const sseLine = (xs: readonly number[], ys: readonly number[], a: number, b: number): number => sum(xs.map((x, i) => (ys[i] - a - b * x) ** 2));

// ── one-way ANOVA (VRA stage 3, ANOVA Studio) ───────────────────────────────
export interface OneWay {
  N: number;
  k: number;
  grand: number | null;
  means: (number | null)[];
  ns: number[];
  ssw: number;
  ssb: number;
  sst: number | null;
  dfB: number;
  dfW: number;
  msb: number | null;
  msw: number | null;
  F: number | null;
  p: number | null;
  eta2: number | null;
  tooSmall: boolean;
  zeroWithin: boolean;
}

export function anova(groups: readonly (readonly number[])[]): OneWay {
  const all = groups.flat();
  const N = all.length;
  const grand = mean(all);
  const means = groups.map((g) => mean(g));
  const ns = groups.map((g) => g.length);
  const ssw = sum(groups.map((g, j) => (g.length ? ssAround(g, means[j] as number) : 0)));
  const ssb = grand === null ? 0 : sum(groups.map((g, j) => (g.length ? g.length * ((means[j] as number) - grand) ** 2 : 0)));
  const sst = grand === null ? null : ssAround(all, grand);
  const k = groups.filter((g) => g.length > 0).length;
  const dfB = k - 1;
  const dfW = N - k;
  const msb = dfB > 0 ? ssb / dfB : null;
  const msw = dfW > 0 ? ssw / dfW : null;
  const F = msb !== null && msw !== null && msw > 0 ? msb / msw : null;
  return { N, k, grand, means, ns, ssw, ssb, sst, dfB, dfW, msb, msw, F, p: F !== null ? fP(F, dfB, dfW) : null, eta2: sst ? ssb / sst : null, tooSmall: groups.some((g) => g.length < 2), zeroWithin: msw === 0 };
}

/** ω² = (SSB − dfB·MSW)/(SST + MSW): a less biased effect size than η². */
export function omegaSquared(a: OneWay): number | null {
  return a.msw === null || a.sst === null ? null : (a.ssb - a.dfB * a.msw) / (a.sst + a.msw);
}

export interface WelchResult {
  F: number | null;
  df1: number | null;
  df2: number | null;
  p: number | null;
  method: string;
  reason?: string;
}
/** Welch's heteroscedastic one-way ANOVA (R oneway.test(var.equal = FALSE)). */
export function welchAnova(groups: readonly (readonly number[])[]): WelchResult {
  const method = "Welch (1951) F; df₂ = (k²−1)/(3Λ)";
  const gs = groups.filter((g) => g.length > 1);
  const k = gs.length;
  if (k < 2) return { F: null, df1: null, df2: null, p: null, method, reason: "need ≥ 2 groups with n > 1" };
  const ns = gs.map((g) => g.length);
  const ms = gs.map((g) => mean(g) as number);
  const vs = gs.map((g) => describe(g).variance as number);
  if (vs.some((v) => !(v > 0))) return { F: null, df1: null, df2: null, p: null, method, reason: "a group has zero variance" };
  const w = ns.map((n, j) => n / vs[j]);
  const W = sum(w);
  const gm = sum(w.map((wj, j) => wj * ms[j])) / W;
  const num = sum(w.map((wj, j) => wj * (ms[j] - gm) ** 2)) / (k - 1);
  const lam = sum(ns.map((n, j) => (1 - w[j] / W) ** 2 / (n - 1)));
  const den = 1 + (2 * (k - 2) * lam) / (k * k - 1);
  const F = num / den;
  const df1 = k - 1;
  const df2 = (k * k - 1) / (3 * lam);
  return { F, df1, df2, p: fP(F, df1, df2), method };
}

export type Correction = "none" | "bonferroni" | "tukey" | "gameshowell";
export interface PairRow {
  i: number;
  j: number;
  diff: number;
  se: number;
  stat: number;
  p: number | null;
  ci: [number, number] | null;
  df: number;
  method: string;
}
/**
 * Pairwise mean comparisons. Tukey–Kramer and Games–Howell use the studentised range (R ptukey port,
 * agreement with scipy.stats.studentized_range ≈ 1e-8); LSD and Bonferroni use t with the pooled MSW.
 */
export function pairwise(groups: readonly (readonly number[])[], correction: Correction = "tukey", alpha = 0.05): { rows: PairRow[]; m: number; anova: OneWay } {
  const a = anova(groups);
  const k = groups.length;
  const m = (k * (k - 1)) / 2;
  const rows: PairRow[] = [];
  for (let i = 0; i < k; i++)
    for (let j = i + 1; j < k; j++) {
      const gi = groups[i];
      const gj = groups[j];
      if (gi.length < 2 || gj.length < 2) continue;
      const diff = (mean(gi) as number) - (mean(gj) as number);
      if (correction === "gameshowell") {
        const vi = (describe(gi).variance as number) / gi.length;
        const vj = (describe(gj).variance as number) / gj.length;
        if (!(vi + vj > 0)) continue;
        const se = Math.sqrt((vi + vj) / 2);
        const df = (vi + vj) ** 2 / (vi ** 2 / (gi.length - 1) + vj ** 2 / (gj.length - 1));
        const q = Math.abs(diff) / se;
        const pt = ptukey(q, k, df);
        const qc = qtukey(1 - alpha, k, df);
        rows.push({ i, j, diff, se: Math.sqrt(vi + vj), stat: q, p: pt === null ? null : 1 - pt, ci: qc === null ? null : [diff - qc * se, diff + qc * se], df, method: "Games–Howell (studentised range, Welch df)" });
        continue;
      }
      if (a.msw === null || !(a.msw > 0)) continue;
      const se = Math.sqrt(a.msw * (1 / gi.length + 1 / gj.length));
      if (correction === "tukey") {
        const q = Math.abs(diff) / (se / Math.SQRT2);
        const pt = ptukey(q, k, a.dfW);
        const qc = qtukey(1 - alpha, k, a.dfW);
        rows.push({ i, j, diff, se, stat: q, p: pt === null ? null : 1 - pt, ci: qc === null ? null : [diff - (qc / Math.SQRT2) * se, diff + (qc / Math.SQRT2) * se], df: a.dfW, method: "Tukey HSD / Tukey–Kramer (studentised range)" });
      } else {
        const t = diff / se;
        let p = tTwoTailedP(t, a.dfW);
        const alphaAdj = correction === "bonferroni" ? alpha / m : alpha;
        if (correction === "bonferroni") p = Math.min(1, p * m);
        const tc = tCritical(a.dfW, alphaAdj);
        rows.push({ i, j, diff, se, stat: t, p, ci: [diff - tc * se, diff + tc * se], df: a.dfW, method: correction === "bonferroni" ? "Bonferroni-adjusted LSD" : "Fisher LSD (unadjusted)" });
      }
    }
  return { rows, m, anova: a };
}

// ── multiple regression ─────────────────────────────────────────────────────
export interface OlsResult {
  n: number;
  /** Number of coefficients including the intercept. */
  k: number;
  coef: number[];
  se: number[];
  seHC3: number[] | null;
  t: number[];
  p: number[];
  ci: [number, number][];
  fitted: number[];
  resid: number[];
  stdRes: (number | null)[];
  leverage: number[];
  cooks: (number | null)[];
  sigma: number;
  r2: number | null;
  adjR2: number | null;
  F: number | null;
  Fp: number | null;
  df: number;
  sse: number;
  sst: number;
  vif: (number | null)[] | null;
  weighted: boolean;
  method: string;
}
export type OlsOutcome = OlsResult | { coef: null; reason: string };

/**
 * OLS (optionally weighted) with intercept. X: n × p predictors without the constant column.
 * Classical SEs, HC3 (unweighted fits only), leverage, internally studentised residuals, Cook's D and VIF.
 */
export function ols(X: readonly (readonly number[])[], y: readonly number[], weights?: readonly number[], opts: { vif?: boolean } = {}): OlsOutcome {
  const n = y.length;
  const p = X[0] ? X[0].length : 0;
  const k = p + 1;
  if (X.length !== n) return { coef: null, reason: "X and y lengths differ" };
  if (n <= k) return { coef: null, reason: "n ≤ number of parameters" };
  if (!y.every(Number.isFinite) || !X.every((r) => r.every(Number.isFinite))) return { coef: null, reason: "missing or non-finite values" };
  const W = weights ? [...weights] : new Array<number>(n).fill(1);
  if (W.some((w) => !(w >= 0))) return { coef: null, reason: "weights must be non-negative" };
  const Xd = X.map((r) => [1, ...r]);
  const XtW = transpose(Xd).map((col) => col.map((v, i) => v * W[i]));
  const XtXi = inverse(matmul(XtW, Xd));
  if (!XtXi) return { coef: null, reason: "singular design (collinear predictors or a constant predictor)" };
  const Xty = XtW.map((row) => sum(row.map((v, i) => v * y[i])));
  const coef = XtXi.map((row) => sum(row.map((v, j) => v * Xty[j])));
  const fitted = Xd.map((r) => sum(r.map((v, j) => v * coef[j])));
  const resid = y.map((v, i) => v - fitted[i]);
  const Wsum = sum(W);
  const ybar = sum(y.map((v, i) => v * W[i])) / Wsum;
  const sse = sum(resid.map((e, i) => W[i] * e * e));
  const sst = sum(y.map((v, i) => W[i] * (v - ybar) ** 2));
  const df = n - k;
  const sigma2 = sse / df;
  const se = XtXi.map((row, j) => Math.sqrt(sigma2 * row[j]));
  // hat diagonal h_i = w_i x_i' (X'WX)⁻¹ x_i
  const leverage = Xd.map((r, i) => W[i] * sum(r.map((v, a) => v * sum(XtXi[a].map((mm, b) => mm * r[b])))));
  const stdRes = resid.map((e, i) => (sigma2 > 0 && leverage[i] < 1 - 1e-12 ? (Math.sqrt(W[i]) * e) / Math.sqrt(sigma2 * (1 - leverage[i])) : null));
  const cooks = stdRes.map((r, i) => (r === null ? null : ((r * r) / k) * (leverage[i] / (1 - leverage[i]))));
  let seHC3: number[] | null = null;
  if (!weights && leverage.every((h) => h < 1 - 1e-12)) {
    const meat = matmul(transpose(Xd).map((col) => col.map((v, i) => (v * resid[i] ** 2) / (1 - leverage[i]) ** 2)), Xd);
    const V3 = matmul(matmul(XtXi, meat), XtXi);
    seHC3 = V3.map((r, j) => Math.sqrt(Math.max(0, r[j])));
  }
  const t = coef.map((b, j) => b / se[j]);
  const pv = t.map((tv) => tTwoTailedP(tv, df));
  const tc = tCritical(df);
  const r2 = sst > 0 ? 1 - sse / sst : null;
  const adjR2 = r2 === null ? null : 1 - (1 - r2) * ((n - 1) / df);
  const F = p > 0 && sigma2 > 0 && sst > 0 ? (sst - sse) / p / sigma2 : null;
  let vif: (number | null)[] | null = null;
  if (p > 1 && opts.vif !== false) {
    vif = X[0].map((_, j) => {
      const others = X.map((r) => r.filter((__, m) => m !== j));
      const f2 = ols(others, X.map((r) => r[j]), weights, { vif: false });
      if (f2.coef === null || f2.r2 === null) return null;
      return f2.r2 >= 1 ? null : 1 / (1 - f2.r2);
    });
  }
  return {
    n,
    k,
    coef,
    se,
    seHC3,
    t,
    p: pv,
    ci: coef.map((b, j) => [b - tc * se[j], b + tc * se[j]] as [number, number]),
    fitted,
    resid,
    stdRes,
    leverage,
    cooks,
    sigma: Math.sqrt(sigma2),
    r2,
    adjR2,
    F,
    Fp: F === null ? null : fP(F, p, df),
    df,
    sse,
    sst,
    vif,
    weighted: !!weights,
    method: "OLS normal equations; HC3 (MacKinnon–White) for unweighted fits; Cook's D = r²h/(k(1−h))",
  };
}

export interface LogitResult {
  coef: number[] | null;
  se: number[] | null;
  z: number[] | null;
  p: number[] | null;
  or: number[] | null;
  ci: [number, number][] | null;
  loglik: number | null;
  nullLoglik: number | null;
  mcFaddenR2: number | null;
  converged: boolean;
  iterations: number;
  separation: boolean;
  method: string;
  reason?: string;
}

/** Binary logistic regression by IRLS (Newton–Raphson) with Wald SEs, as statsmodels Logit / R glm(binomial). */
export function logit(X: readonly (readonly number[])[], y: readonly number[], maxIt = 50): LogitResult {
  const n = y.length;
  const fail = (reason: string, extra: Partial<LogitResult> = {}): LogitResult => ({ coef: null, se: null, z: null, p: null, or: null, ci: null, loglik: null, nullLoglik: null, mcFaddenR2: null, converged: false, iterations: 0, separation: false, method: "IRLS", reason, ...extra });
  if (!y.every((v) => v === 0 || v === 1)) return fail("outcome must be coded 0/1");
  const ones = sum(y);
  if (ones === 0 || ones === n) return fail("outcome has only one category");
  const Xd = X.map((r) => [1, ...r]);
  const k = Xd[0].length;
  if (n <= k) return fail("n ≤ number of parameters");
  let b = new Array<number>(k).fill(0);
  const loglikAt = (beta: number[]) => sum(Xd.map((r, i) => {
    const eta = sum(r.map((v, j) => v * beta[j]));
    // log(1 + e^eta) computed stably
    const l1p = eta > 0 ? eta + Math.log1p(Math.exp(-eta)) : Math.log1p(Math.exp(eta));
    return y[i] * eta - l1p;
  }));
  for (let it = 0; it < maxIt; it++) {
    const eta = Xd.map((r) => sum(r.map((v, j) => v * b[j])));
    const mu = eta.map((e) => 1 / (1 + Math.exp(-e)));
    const w = mu.map((m) => Math.max(1e-12, m * (1 - m)));
    const z = eta.map((e, i) => e + (y[i] - mu[i]) / w[i]);
    const XtW = transpose(Xd).map((col) => col.map((v, i) => v * w[i]));
    const inv = inverse(matmul(XtW, Xd), 1e-14);
    if (!inv) return fail("singular information matrix (collinear predictors or separation)", { separation: true, iterations: it });
    const nb = inv.map((row) => sum(row.map((v, j) => v * sum(XtW[j].map((q, i) => q * z[i])))));
    const d = Math.max(...nb.map((v, j) => Math.abs(v - b[j])));
    b = nb;
    if (b.some((v) => Math.abs(v) > 30)) return fail("coefficients diverge: (quasi-)complete separation, maximum likelihood estimate does not exist", { separation: true, iterations: it + 1 });
    if (d < 1e-10) {
      const etaF = Xd.map((r) => sum(r.map((v, j) => v * b[j])));
      const muF = etaF.map((e) => 1 / (1 + Math.exp(-e)));
      const wF = muF.map((m) => m * (1 - m));
      const XtWF = transpose(Xd).map((col) => col.map((v, i) => v * wF[i]));
      const invF = inverse(matmul(XtWF, Xd), 1e-14) as Matrix;
      const se = invF.map((r, j) => Math.sqrt(r[j]));
      const zc = normalQuantile(0.975);
      const ll = loglikAt(b);
      const pbar = ones / n;
      const ll0 = ones * Math.log(pbar) + (n - ones) * Math.log(1 - pbar);
      return {
        coef: b,
        se,
        z: b.map((v, j) => v / se[j]),
        p: b.map((v, j) => 2 * (1 - normalCdf(Math.abs(v / se[j])))),
        or: b.map(Math.exp),
        ci: b.map((v, j) => [v - zc * se[j], v + zc * se[j]] as [number, number]),
        loglik: ll,
        nullLoglik: ll0,
        mcFaddenR2: 1 - ll / ll0,
        converged: true,
        iterations: it + 1,
        separation: false,
        method: "IRLS (Newton–Raphson), Wald SE and z",
      };
    }
  }
  return fail("IRLS did not converge", { iterations: maxIt });
}

// ── two-way ANOVA ───────────────────────────────────────────────────────────
export interface TwoWayRow {
  ss: number;
  df: number;
  ms: number | null;
  F: number | null;
  p: number | null;
  eta2p: number | null;
}
export interface TwoWay {
  A: TwoWayRow;
  B: TwoWayRow;
  AB: TwoWayRow;
  within: { ss: number; df: number; ms: number | null };
  sst: number;
  cellM: (number | null)[][];
  cellN: number[][];
  rowM: (number | null)[];
  colM: (number | null)[];
  grand: number | null;
  balanced: boolean;
  method: string;
  reason?: string;
}

/**
 * Two-way between-subjects ANOVA from cells[a][b] = observations. Sums of squares are sequential
 * (Type I, order A, B, A×B) from nested least-squares fits; for balanced designs Types I, II and III coincide.
 */
export function twoWay(cells: readonly (readonly (readonly number[])[])[]): TwoWay {
  const A = cells.length;
  const B = cells[0]?.length ?? 0;
  const obs: { y: number; a: number; b: number }[] = [];
  cells.forEach((r, i) => r.forEach((c, j) => c.forEach((y) => obs.push({ y, a: i, b: j }))));
  const N = obs.length;
  const all = obs.map((o) => o.y);
  const gm = mean(all);
  const cellN = cells.map((r) => r.map((c) => c.length));
  const cellM = cells.map((r) => r.map((c) => mean(c)));
  const rowM = cells.map((r) => mean(r.flat()));
  const colM = Array.from({ length: B }, (_, j) => mean(cells.map((r) => r[j]).flat()));
  const sst = gm === null ? 0 : ssAround(all, gm);
  const balanced = cellN.flat().every((n) => n === cellN[0][0]);
  const empty: TwoWayRow = { ss: 0, df: 0, ms: null, F: null, p: null, eta2p: null };
  const base = { sst, cellM, cellN, rowM, colM, grand: gm, balanced };
  if (A < 2 || B < 2 || cellN.flat().some((n) => n === 0)) return { A: empty, B: empty, AB: empty, within: { ss: 0, df: 0, ms: null }, ...base, method: "two-way ANOVA", reason: "every cell needs at least one observation" };
  // Residual SS of nested least-squares models with dummy coding.
  const design = (useA: boolean, useB: boolean, useAB: boolean) =>
    obs.map((o) => {
      const r: number[] = [];
      if (useA) for (let i = 1; i < A; i++) r.push(o.a === i ? 1 : 0);
      if (useB) for (let j = 1; j < B; j++) r.push(o.b === j ? 1 : 0);
      if (useAB) for (let i = 1; i < A; i++) for (let j = 1; j < B; j++) r.push(o.a === i && o.b === j ? 1 : 0);
      return r;
    });
  const rss = (X: number[][]) => {
    if (!X[0].length) return sst;
    const f = ols(X, all, undefined, { vif: false });
    return f.coef === null ? NaN : f.sse;
  };
  const r0 = sst;
  const rA = rss(design(true, false, false));
  const rAB = rss(design(true, true, false));
  // Full model = cell means: residual SS is the within-cell SS (no regression needed).
  const ssW = sum(cells.flatMap((r, i) => r.map((c, j) => ssAround(c, cellM[i][j] as number))));
  const dfA = A - 1;
  const dfB = B - 1;
  const dfAB = dfA * dfB;
  const dfW = N - A * B;
  const msW = dfW > 0 ? ssW / dfW : null;
  const row = (ss: number, df: number): TwoWayRow => {
    const ms = ss / df;
    if (msW === null || !(msW > 0)) return { ss, df, ms, F: null, p: null, eta2p: ss / (ss + ssW) };
    const F = ms / msW;
    return { ss, df, ms, F, p: fP(F, df, dfW), eta2p: ss / (ss + ssW) };
  };
  return {
    A: row(r0 - rA, dfA),
    B: row(rA - rAB, dfB),
    AB: row(rAB - ssW, dfAB),
    within: { ss: ssW, df: dfW, ms: msW },
    ...base,
    method: balanced ? "balanced two-way; SS orthogonal (Types I/II/III coincide)" : "unbalanced: sequential (Type I) SS in order A, B, A×B — not SPSS Type III",
  };
}

// ── one-way repeated-measures ANOVA ─────────────────────────────────────────
export interface RmAnova {
  n: number;
  k: number;
  means: number[];
  subjectMeans: number[];
  grand: number;
  ssCond: number;
  ssSubj: number;
  ssErr: number;
  sst: number;
  dfCond: number;
  dfErr: number;
  F: number | null;
  p: number | null;
  eta2p: number | null;
  /** Greenhouse–Geisser ε (k > 2) and the p of F on (ε·df₁, ε·df₂). */
  epsGG: number | null;
  pGG: number | null;
  method: string;
  reason?: string;
}

/**
 * One-way repeated-measures ANOVA from data[subject][condition] (complete cases). SS_total splits into
 * conditions, subjects and error (subject × condition); F = MS_cond / MS_err as R aov(y ~ cond +
 * Error(subj/cond)). Greenhouse–Geisser ε from the double-centred covariance matrix, as anova.mlm(test = "Spherical").
 */
export function rmAnova(data: readonly (readonly number[])[]): RmAnova {
  const n = data.length;
  const k = n ? data[0].length : 0;
  const method = "repeated-measures ANOVA (subjects × conditions); Greenhouse–Geisser ε from the condition covariance matrix";
  const means = Array.from({ length: k }, (_, j) => (n ? sum(data.map((r) => r[j])) / n : NaN));
  const subjectMeans = data.map((r) => sum(r) / k);
  const grand = n && k ? sum(data.map((r) => sum(r))) / (n * k) : NaN;
  const base = { n, k, means, subjectMeans, grand, method };
  const fail = (reason: string): RmAnova => ({ ...base, ssCond: 0, ssSubj: 0, ssErr: 0, sst: 0, dfCond: Math.max(0, k - 1), dfErr: Math.max(0, (n - 1) * (k - 1)), F: null, p: null, eta2p: null, epsGG: null, pGG: null, reason });
  if (n < 2 || k < 2) return fail("need ≥ 2 subjects and ≥ 2 conditions");
  if (data.some((r) => r.length !== k || !r.every(Number.isFinite))) return fail("every subject needs a finite score in every condition");
  const sst = sum(data.flatMap((r) => r.map((v) => (v - grand) ** 2)));
  const ssCond = n * sum(means.map((m) => (m - grand) ** 2));
  const ssSubj = k * sum(subjectMeans.map((m) => (m - grand) ** 2));
  const ssErr = Math.max(0, sst - ssCond - ssSubj);
  const dfCond = k - 1;
  const dfErr = (n - 1) * (k - 1);
  const eta2p = ssCond + ssErr > 0 ? ssCond / (ssCond + ssErr) : null;
  if (!(ssErr > 1e-12 * Math.max(1, sst))) return { ...base, ssCond, ssSubj, ssErr, sst, dfCond, dfErr, F: null, p: null, eta2p, epsGG: null, pGG: null, reason: "no subject × condition variation: F is undefined" };
  const F = ssCond / dfCond / (ssErr / dfErr);
  const p = fP(F, dfCond, dfErr);
  let epsGG: number | null = null;
  let pGG: number | null = null;
  if (k > 2) {
    // sample covariance of the conditions, double-centred
    const S = Array.from({ length: k }, (_, a) => Array.from({ length: k }, (_, b) => sum(data.map((r) => (r[a] - means[a]) * (r[b] - means[b]))) / (n - 1)));
    const rowM = S.map((r) => sum(r) / k);
    const allM = sum(rowM) / k;
    const D = S.map((r, a) => r.map((v, b) => v - rowM[a] - rowM[b] + allM));
    const tr = sum(D.map((r, a) => r[a]));
    const tr2 = sum(D.flatMap((r) => r.map((v) => v * v)));
    epsGG = tr2 > 0 ? Math.min(1, (tr * tr) / ((k - 1) * tr2)) : null;
    pGG = epsGG === null ? null : fP(F, epsGG * dfCond, epsGG * dfErr);
  }
  return { ...base, ssCond, ssSubj, ssErr, sst, dfCond, dfErr, F, p, eta2p, epsGG, pGG };
}
