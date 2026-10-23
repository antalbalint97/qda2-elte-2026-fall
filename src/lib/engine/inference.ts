// t-tests, categorical tests and correlation with explicit undefined states.
import { chi2Sf, fP, logChoose, normalQuantile, tCritical, tTwoTailedP } from "./distributions";
import { describe, ranks } from "./descriptives";
import { mean, ssAround, sum } from "./numeric";

// ── t-tests (SPSS row conventions) ──────────────────────────────────────────
export interface OneSampleResult {
  n: number;
  mean: number | null;
  sd: number | null;
  se: number | null;
  t: number | null;
  df: number;
  p: number | null;
  diff: number | null;
  ci: [number, number] | null;
  reason?: string;
}

export function oneSampleT(xs: readonly number[], mu0: number, alpha = 0.05): OneSampleResult {
  const n = xs.length;
  const d = describe(xs);
  const m = d.mean;
  const s = d.sd;
  const diff = m === null ? null : m - mu0;
  if (n < 2 || s === null) return { n, mean: m, sd: s, se: null, t: null, df: Math.max(0, n - 1), p: null, diff, ci: null, reason: "n < 2: no standard error" };
  if (s === 0) return { n, mean: m, sd: 0, se: 0, t: null, df: n - 1, p: null, diff, ci: null, reason: "all values equal: SE = 0, t undefined" };
  const se = s / Math.sqrt(n);
  const t = (diff as number) / se;
  const df = n - 1;
  const tc = tCritical(df, alpha);
  return { n, mean: m, sd: s, se, t, df, p: tTwoTailedP(t, df), diff, ci: [(diff as number) - tc * se, (diff as number) + tc * se] };
}

export interface TRow {
  t: number | null;
  df: number;
  se: number;
  p: number | null;
  ci: [number, number] | null;
}
export interface IndependentResult {
  na: number;
  nb: number;
  ma: number | null;
  mb: number | null;
  sa: number | null;
  sb: number | null;
  diff: number | null;
  equal: TRow | null;
  welch: TRow | null;
  /** Cohen's d with the pooled SD. */
  d: number | null;
  /** Hedges' g = d·(1 − 3/(4N − 9)). */
  g: number | null;
  levene: { F: number | null; p: number | null };
  reason?: string;
}

/** Independent-samples t: both SPSS rows (Student and Welch), Hedges' g and Levene (mean-centred). */
export function independentT(a: readonly number[], b: readonly number[], alpha = 0.05): IndependentResult {
  const na = a.length;
  const nb = b.length;
  const da = describe(a);
  const db = describe(b);
  const diff = da.mean !== null && db.mean !== null ? da.mean - db.mean : null;
  const base = { na, nb, ma: da.mean, mb: db.mean, sa: da.sd, sb: db.sd, diff };
  if (na < 2 || nb < 2 || diff === null) return { ...base, equal: null, welch: null, d: null, g: null, levene: { F: null, p: null }, reason: "each group needs at least 2 observations" };
  const va = da.variance as number;
  const vb = db.variance as number;
  const sp2 = ((na - 1) * va + (nb - 1) * vb) / (na + nb - 2);
  const seEq = Math.sqrt(sp2 * (1 / na + 1 / nb));
  const dfEq = na + nb - 2;
  const seW = Math.sqrt(va / na + vb / nb);
  const dfW = va === 0 && vb === 0 ? dfEq : (va / na + vb / nb) ** 2 / ((va / na) ** 2 / (na - 1) + (vb / nb) ** 2 / (nb - 1));
  const row = (se: number, df: number): TRow => {
    if (!(se > 0)) return { t: null, df, se, p: null, ci: null };
    const tc = tCritical(df, alpha);
    const t = diff / se;
    return { t, df, se, p: tTwoTailedP(t, df), ci: [diff - tc * se, diff + tc * se] };
  };
  const sp = Math.sqrt(sp2);
  const d = sp > 0 ? diff / sp : null;
  const g = d === null ? null : d * (1 - 3 / (4 * (na + nb) - 9));
  const za = a.map((x) => Math.abs(x - (da.mean as number)));
  const zb = b.map((x) => Math.abs(x - (db.mean as number)));
  const zbar = mean([...za, ...zb]) as number;
  const mza = mean(za) as number;
  const mzb = mean(zb) as number;
  const betw = na * (mza - zbar) ** 2 + nb * (mzb - zbar) ** 2;
  const within = ssAround(za, mza) + ssAround(zb, mzb);
  const F = within > 0 ? ((na + nb - 2) * betw) / within : null;
  return { ...base, equal: row(seEq, dfEq), welch: row(seW, dfW), d, g, levene: { F, p: F === null ? null : fP(F, 1, na + nb - 2) } };
}

/** Paired t = one-sample t on the differences. Pairs with a missing value are dropped. */
export function pairedT(a: readonly number[], b: readonly number[], alpha = 0.05): OneSampleResult {
  const d: number[] = [];
  for (let i = 0; i < Math.min(a.length, b.length); i++) if (Number.isFinite(a[i]) && Number.isFinite(b[i])) d.push(a[i] - b[i]);
  return oneSampleT(d, 0, alpha);
}

// ── categorical ─────────────────────────────────────────────────────────────
export interface ChiSquareFull {
  N: number;
  rows: number[];
  cols: number[];
  E: number[][];
  contrib: number[][];
  stdRes: (number | null)[][];
  rowPct: (number | null)[][];
  colPct: (number | null)[][];
  chi2: number | null;
  df: number;
  p: number | null;
  V: number | null;
  phi: number | null;
  yates: { chi2: number; p: number } | null;
  expLt5: number;
  expLt1: number;
  sparse: boolean;
  method: string;
  reason?: string;
}

/** Pearson χ² (no continuity correction; SPSS "Pearson Chi-Square"), adjusted standardised residuals, Cramér's V, Yates for 2×2. */
export function chiSquare(table: readonly (readonly number[])[]): ChiSquareFull {
  const R = table.length;
  const C = R ? table[0].length : 0;
  const rows = table.map((r) => sum(r));
  const cols = Array.from({ length: C }, (_, j) => sum(table.map((r) => r[j])));
  const N = sum(rows);
  const method = "Pearson χ² without continuity correction (SPSS 'Pearson Chi-Square'); Yates reported separately for 2×2";
  const empty = { N, rows, cols, E: [], contrib: [], stdRes: [], rowPct: [], colPct: [], chi2: null, df: Math.max(0, (R - 1) * (C - 1)), p: null, V: null, phi: null, yates: null, expLt5: 0, expLt1: 0, sparse: false, method };
  if (table.some((r) => r.some((v) => !(v >= 0) || !Number.isFinite(v)))) return { ...empty, reason: "counts must be non-negative numbers" };
  if (N === 0 || R < 2 || C < 2) return { ...empty, reason: "need at least a 2×2 table with a positive total" };
  if (rows.some((r) => r === 0) || cols.some((c) => c === 0)) return { ...empty, reason: "a row or column total is zero: expected counts undefined" };
  const E = table.map((r, i) => r.map((_, j) => (rows[i] * cols[j]) / N));
  const contrib = table.map((r, i) => r.map((o, j) => (o - E[i][j]) ** 2 / E[i][j]));
  const stdRes = table.map((r, i) => r.map((o, j) => (o - E[i][j]) / Math.sqrt(E[i][j] * (1 - rows[i] / N) * (1 - cols[j] / N))));
  const chi2 = sum(contrib.flat());
  const df = (R - 1) * (C - 1);
  const k = Math.min(R, C) - 1;
  const V = Math.sqrt(chi2 / (N * k));
  const flatE = E.flat();
  const expLt5 = flatE.filter((e) => e < 5).length;
  const expLt1 = flatE.filter((e) => e < 1).length;
  let yates: ChiSquareFull["yates"] = null;
  if (R === 2 && C === 2) {
    const y = sum(table.flatMap((r, i) => r.map((o, j) => Math.max(0, Math.abs(o - E[i][j]) - 0.5) ** 2 / E[i][j])));
    yates = { chi2: y, p: chi2Sf(y, 1) };
  }
  return {
    N,
    rows,
    cols,
    E,
    contrib,
    stdRes,
    rowPct: table.map((r, i) => r.map((o) => (rows[i] ? (100 * o) / rows[i] : null))),
    colPct: table.map((r) => r.map((o, j) => (cols[j] ? (100 * o) / cols[j] : null))),
    chi2,
    df,
    p: chi2Sf(chi2, df),
    V,
    phi: R === 2 && C === 2 ? Math.sqrt(chi2 / N) : null,
    yates,
    expLt5,
    expLt1,
    sparse: expLt5 / (R * C) > 0.2 || expLt1 > 0,
    method,
  };
}

export interface OddsRatio {
  or: number;
  ci: [number, number];
  rr: number | null;
  rd: number | null;
  method: string;
}
/** Odds ratio of a 2×2 table with a Woolf CI; zero cells use the Haldane–Anscombe +0.5 correction (labelled). */
export function oddsRatio(t: readonly (readonly number[])[], alpha = 0.05): OddsRatio | null {
  if (t.length !== 2 || t[0].length !== 2 || t[1].length !== 2) return null;
  const [[a, b], [c, d]] = t;
  const z = normalQuantile(1 - alpha / 2);
  const zero = [a, b, c, d].some((x) => x === 0);
  const [A, B, Cc, D] = zero ? [a + 0.5, b + 0.5, c + 0.5, d + 0.5] : [a, b, c, d];
  const or = (A * D) / (B * Cc);
  const se = Math.sqrt(1 / A + 1 / B + 1 / Cc + 1 / D);
  const rr = a + b > 0 && c + d > 0 && c > 0 ? a / (a + b) / (c / (c + d)) : null;
  const rd = a + b > 0 && c + d > 0 ? a / (a + b) - c / (c + d) : null;
  return { or, ci: [or * Math.exp(-z * se), or * Math.exp(z * se)], rr, rd, method: zero ? "Haldane–Anscombe 0.5 correction (zero cell); Woolf CI" : "Woolf log-OR CI" };
}

/** Two-sided Fisher exact test for a 2×2 table (R fisher.test convention: sum of tables no more probable than the observed). */
export function fisherExact(t: readonly (readonly number[])[]): { p: number; method: string } | null {
  if (t.length !== 2 || t[0].length !== 2) return null;
  const [[a, b], [c, d]] = t;
  const r1 = a + b;
  const r2 = c + d;
  const c1 = a + c;
  const n = r1 + r2;
  if (n === 0) return null;
  const pr = (x: number) => Math.exp(logChoose(r1, x) + logChoose(r2, c1 - x) - logChoose(n, c1));
  const lo = Math.max(0, c1 - r2);
  const hi = Math.min(r1, c1);
  const pObs = pr(a);
  let p = 0;
  for (let x = lo; x <= hi; x++) {
    const px = pr(x);
    if (px <= pObs * (1 + 1e-7)) p += px;
  }
  return { p: Math.min(1, p), method: "two-sided, sum of tables with probability ≤ observed (R fisher.test convention)" };
}

export interface Partials {
  zero: number[][];
  zeroPct: (number | null)[];
  zeroDiff: number | null;
  partialPct: (number | null)[][];
  partialDiff: (number | null)[];
  composition: number[][];
}
/**
 * Lazarsfeld elaboration: partial 2×2 tables (one per level of Z) → zero-order table. Percentages are the
 * share of the first column within each row; differences are row 1 − row 2 in percentage points.
 */
export function partials(tables: readonly (readonly (readonly number[])[])[]): Partials {
  const zero = tables.reduce<number[][]>((acc, t) => acc.map((r, i) => r.map((v, j) => v + t[i][j])), tables[0].map((r) => r.map(() => 0)));
  const pct = (t: readonly (readonly number[])[]) => t.map((r) => (sum(r) ? (100 * r[0]) / sum(r) : null));
  const diff = (t: readonly (readonly number[])[]) => {
    const p = pct(t);
    return p[0] === null || p[1] === null ? null : p[0] - p[1];
  };
  return { zero, zeroPct: pct(zero), zeroDiff: diff(zero), partialPct: tables.map(pct), partialDiff: tables.map(diff), composition: tables.map((t) => t.map((r) => sum(r))) };
}

// ── correlation ─────────────────────────────────────────────────────────────
export interface Correlation {
  r: number | null;
  t: number | null;
  df: number;
  p: number | null;
  ci: [number, number] | null;
  n: number;
  method: string;
  reason?: string;
}

/** Pearson r with the t-test (df = n − 2) and a Fisher-z 95 % CI (n > 3). Pairs with a missing value are dropped. */
export function pearson(xIn: readonly number[], yIn: readonly number[], alpha = 0.05): Correlation {
  const x: number[] = [];
  const y: number[] = [];
  for (let i = 0; i < Math.min(xIn.length, yIn.length); i++) if (Number.isFinite(xIn[i]) && Number.isFinite(yIn[i])) {
    x.push(xIn[i]);
    y.push(yIn[i]);
  }
  const n = x.length;
  const method = "Pearson product-moment r; t = r√(n−2)/√(1−r²); Fisher-z CI";
  const df = n - 2;
  if (n < 3) return { r: null, t: null, df: Math.max(0, df), p: null, ci: null, n, method, reason: "need at least 3 pairs" };
  const mx = mean(x) as number;
  const my = mean(y) as number;
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < n; i++) {
    sxy += (x[i] - mx) * (y[i] - my);
    sxx += (x[i] - mx) ** 2;
    syy += (y[i] - my) ** 2;
  }
  if (sxx === 0 || syy === 0) return { r: null, t: null, df, p: null, ci: null, n, method, reason: "a variable has zero variance: r undefined" };
  const r = Math.max(-1, Math.min(1, sxy / Math.sqrt(sxx * syy)));
  if (Math.abs(r) >= 1 - 1e-15) return { r, t: null, df, p: 0, ci: null, n, method, reason: "perfect correlation" };
  const t = (r * Math.sqrt(df)) / Math.sqrt(1 - r * r);
  let ci: [number, number] | null = null;
  if (n > 3) {
    const z = Math.atanh(r);
    const se = 1 / Math.sqrt(n - 3);
    const zc = normalQuantile(1 - alpha / 2);
    ci = [Math.tanh(z - zc * se), Math.tanh(z + zc * se)];
  }
  return { r, t, df, p: tTwoTailedP(t, df), ci, n, method };
}

/** Spearman's ρ = Pearson r on average ranks; p by the t approximation (as SPSS). */
export function spearman(xIn: readonly number[], yIn: readonly number[]): Correlation {
  const keep = xIn.map((v, i) => Number.isFinite(v) && Number.isFinite(yIn[i]));
  const x = xIn.filter((_, i) => keep[i]);
  const y = yIn.filter((_, i) => keep[i]);
  const r = pearson(ranks(x), ranks(y));
  return { ...r, ci: null, method: "Pearson r on average ranks (ties averaged); p via t approximation (SPSS)" };
}
