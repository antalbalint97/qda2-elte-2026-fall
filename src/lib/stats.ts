// Small, dependency-free statistics helpers used by the visualizations.
// Accuracy is more than sufficient for teaching purposes (≈1e-7).

export function normalPdf(x: number, mu = 0, sigma = 1): number {
  const z = (x - mu) / sigma;
  return Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI));
}

function erf(x: number): number {
  // Abramowitz & Stegun 7.1.26 is too coarse for tails; use a series / continued fraction via erfc
  return 1 - erfc(x);
}

function erfc(x: number): number {
  // Numerical Recipes erfc with Chebyshev approximation (fractional error < 1.2e-7)
  const z = Math.abs(x);
  const t = 1 / (1 + 0.5 * z);
  const r =
    t *
    Math.exp(
      -z * z -
        1.26551223 +
        t *
          (1.00002368 +
            t *
              (0.37409196 +
                t *
                  (0.09678418 +
                    t *
                      (-0.18628806 +
                        t *
                          (0.27886807 +
                            t *
                              (-1.13520398 +
                                t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))),
    );
  return x >= 0 ? r : 2 - r;
}

export function normalCdf(x: number, mu = 0, sigma = 1): number {
  return 0.5 * (1 + erf((x - mu) / (sigma * Math.SQRT2)));
}

function logGamma(x: number): number {
  const c = [
    76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155,
    0.1208650973866179e-2, -0.5395239384953e-5,
  ];
  let y = x;
  const tmp = x + 5.5 - (x + 0.5) * Math.log(x + 5.5);
  let ser = 1.000000000190015;
  for (const ci of c) ser += ci / ++y;
  return -tmp + Math.log((2.5066282746310005 * ser) / x);
}

function betacf(a: number, b: number, x: number): number {
  const MAXIT = 200;
  const EPS = 3e-12;
  const FPMIN = 1e-300;
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= MAXIT; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return h;
}

/** Regularized incomplete beta function I_x(a, b). */
export function incompleteBeta(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(
    logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x),
  );
  if (x < (a + 1) / (a + b + 2)) return (bt * betacf(a, b, x)) / a;
  return 1 - (bt * betacf(b, a, 1 - x)) / b;
}

export function tPdf(t: number, df: number): number {
  const lg = logGamma((df + 1) / 2) - logGamma(df / 2);
  return Math.exp(lg - 0.5 * Math.log(df * Math.PI) - ((df + 1) / 2) * Math.log(1 + (t * t) / df));
}

export function tCdf(t: number, df: number): number {
  const x = df / (df + t * t);
  const tail = 0.5 * incompleteBeta(x, df / 2, 0.5);
  return t >= 0 ? 1 - tail : tail;
}

/** Two-tailed p-value for a t statistic. */
export function tTwoTailedP(t: number, df: number): number {
  return incompleteBeta(df / (df + t * t), df / 2, 0.5);
}

/** Critical |t| for a two-tailed test (bisection). */
export function tCritical(df: number, alpha = 0.05): number {
  let lo = 0;
  let hi = 50;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (tTwoTailedP(mid, df) > alpha) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** Lower regularized gamma P(a, x). */
function gammaP(a: number, x: number): number {
  if (x <= 0) return 0;
  const gln = logGamma(a);
  if (x < a + 1) {
    let ap = a;
    let sum = 1 / a;
    let del = sum;
    for (let n = 0; n < 500; n++) {
      ap += 1;
      del *= x / ap;
      sum += del;
      if (Math.abs(del) < Math.abs(sum) * 1e-14) break;
    }
    return sum * Math.exp(-x + a * Math.log(x) - gln);
  }
  // continued fraction for Q, then P = 1 - Q
  let b = x + 1 - a;
  let c = 1 / 1e-300;
  let d = 1 / b;
  let h = d;
  for (let i = 1; i < 500; i++) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b;
    if (Math.abs(d) < 1e-300) d = 1e-300;
    c = b + an / c;
    if (Math.abs(c) < 1e-300) c = 1e-300;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < 1e-14) break;
  }
  return 1 - Math.exp(-x + a * Math.log(x) - gln) * h;
}

export function chiSquareP(chi2: number, df: number): number {
  return 1 - gammaP(df / 2, chi2 / 2);
}

export interface ChiSquareResult {
  chi2: number;
  df: number;
  p: number;
  cramersV: number;
  expected: number[][];
  n: number;
  minExpected: number;
}

export function chiSquareTest(table: number[][]): ChiSquareResult {
  const rows = table.length;
  const cols = table[0].length;
  const rowTotals = table.map((r) => r.reduce((a, b) => a + b, 0));
  const colTotals = table[0].map((_, j) => table.reduce((a, r) => a + r[j], 0));
  const n = rowTotals.reduce((a, b) => a + b, 0);
  const expected = table.map((_, i) => table[0].map((__, j) => (rowTotals[i] * colTotals[j]) / n));
  let chi2 = 0;
  for (let i = 0; i < rows; i++)
    for (let j = 0; j < cols; j++) chi2 += (table[i][j] - expected[i][j]) ** 2 / expected[i][j];
  const df = (rows - 1) * (cols - 1);
  const cramersV = Math.sqrt(chi2 / (n * Math.min(rows - 1, cols - 1)));
  return {
    chi2,
    df,
    p: chiSquareP(chi2, df),
    cramersV,
    expected,
    n,
    minExpected: Math.min(...expected.flat()),
  };
}

export function mean(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

export function sd(xs: number[]): number {
  const m = mean(xs);
  return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1));
}

export function pearson(xs: number[], ys: number[]): number {
  const mx = mean(xs);
  const my = mean(ys);
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < xs.length; i++) {
    sxy += (xs[i] - mx) * (ys[i] - my);
    sxx += (xs[i] - mx) ** 2;
    syy += (ys[i] - my) ** 2;
  }
  return sxy / Math.sqrt(sxx * syy);
}

export function ranks(xs: number[]): number[] {
  const idx = xs.map((v, i) => [v, i] as const).sort((a, b) => a[0] - b[0]);
  const r = new Array<number>(xs.length);
  let i = 0;
  while (i < idx.length) {
    let j = i;
    while (j + 1 < idx.length && idx[j + 1][0] === idx[i][0]) j++;
    const avg = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) r[idx[k][1]] = avg;
    i = j + 1;
  }
  return r;
}

export function spearman(xs: number[], ys: number[]): number {
  return pearson(ranks(xs), ranks(ys));
}

/** p-value for a correlation coefficient via t = r√(n−2)/√(1−r²). */
export function correlationP(r: number, n: number): number {
  const t = (r * Math.sqrt(n - 2)) / Math.sqrt(Math.max(1e-12, 1 - r * r));
  return tTwoTailedP(t, n - 2);
}

/** Deterministic PRNG so every visitor sees the same "random" samples. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function gaussian(rand: () => number): () => number {
  return () => {
    let u = 0;
    while (u === 0) u = rand();
    const v = rand();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
}

/** APA-style p formatting: no leading zero, "< .001" for tiny values. */
export function formatP(p: number): string {
  if (p < 0.001) return "< .001";
  const s = p.toFixed(3);
  return "= " + s.replace(/^0/, "");
}

/** Number without leading zero (for r, V, p). */
export function noLeadingZero(x: number, digits = 2): string {
  const s = x.toFixed(digits);
  return s.replace(/^(-?)0\./, "$1.");
}

export function linspace(a: number, b: number, n: number): number[] {
  return Array.from({ length: n }, (_, i) => a + ((b - a) * i) / (n - 1));
}

export function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/** Sample skewness with the small-sample adjustment SPSS reports (G1). */
export function skewness(xs: number[]): number {
  const n = xs.length;
  const m = mean(xs);
  const m2 = xs.reduce((a, x) => a + (x - m) ** 2, 0) / n;
  const m3 = xs.reduce((a, x) => a + (x - m) ** 3, 0) / n;
  const g1 = m3 / m2 ** 1.5;
  return (Math.sqrt(n * (n - 1)) / (n - 2)) * g1;
}

/** Upper-tail p-value of the F distribution. */
export function fP(f: number, d1: number, d2: number): number {
  if (f <= 0) return 1;
  return incompleteBeta(d2 / (d2 + d1 * f), d2 / 2, d1 / 2);
}

/** Levene's test for two groups, centred on the mean (as in SPSS). */
export function leveneTest(a: number[], b: number[]): { f: number; df1: number; df2: number; p: number } {
  const za = a.map((x) => Math.abs(x - mean(a)));
  const zb = b.map((x) => Math.abs(x - mean(b)));
  const all = [...za, ...zb];
  const n = all.length;
  const zbar = mean(all);
  const between = za.length * (mean(za) - zbar) ** 2 + zb.length * (mean(zb) - zbar) ** 2;
  const within = za.reduce((s, z) => s + (z - mean(za)) ** 2, 0) + zb.reduce((s, z) => s + (z - mean(zb)) ** 2, 0);
  const f = (n - 2) * (between / within);
  return { f, df1: 1, df2: n - 2, p: fP(f, 1, n - 2) };
}

export interface TResult {
  t: number;
  df: number;
  p: number;
  meanDiff: number;
  se: number;
}

export function oneSampleT(xs: number[], mu0: number): TResult {
  const se = sd(xs) / Math.sqrt(xs.length);
  const t = (mean(xs) - mu0) / se;
  const df = xs.length - 1;
  return { t, df, p: tTwoTailedP(t, df), meanDiff: mean(xs) - mu0, se };
}

/** Independent-samples t-test: both SPSS rows (equal variances assumed / not assumed). */
export function independentT(a: number[], b: number[]): { equal: TResult; welch: TResult } {
  const [na, nb] = [a.length, b.length];
  const [va, vb] = [sd(a) ** 2, sd(b) ** 2];
  const diff = mean(a) - mean(b);
  const sp2 = ((na - 1) * va + (nb - 1) * vb) / (na + nb - 2);
  const seEq = Math.sqrt(sp2 * (1 / na + 1 / nb));
  const dfEq = na + nb - 2;
  const seW = Math.sqrt(va / na + vb / nb);
  const dfW = (va / na + vb / nb) ** 2 / ((va / na) ** 2 / (na - 1) + (vb / nb) ** 2 / (nb - 1));
  return {
    equal: { t: diff / seEq, df: dfEq, p: tTwoTailedP(diff / seEq, dfEq), meanDiff: diff, se: seEq },
    welch: { t: diff / seW, df: dfW, p: tTwoTailedP(diff / seW, dfW), meanDiff: diff, se: seW },
  };
}

/** Hedges' g (Cohen's d with the small-sample correction), as reported by SPSS 27+. */
export function hedgesG(a: number[], b: number[]): number {
  const [na, nb] = [a.length, b.length];
  const sp = Math.sqrt(((na - 1) * sd(a) ** 2 + (nb - 1) * sd(b) ** 2) / (na + nb - 2));
  const d = (mean(a) - mean(b)) / sp;
  return d * (1 - 3 / (4 * (na + nb) - 9));
}

export function pairedT(a: number[], b: number[]): TResult {
  return oneSampleT(
    a.map((x, i) => x - b[i]),
    0,
  );
}
