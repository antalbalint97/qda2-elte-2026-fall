// Probability distributions. The normal, t, F and χ² core (log-gamma, incomplete beta and gamma)
// is the SciPy-validated code in src/lib/stats.ts; this module adds quantiles, discrete families,
// the noncentral t (power) and the studentised range (Tukey / Games–Howell).
import {
  chiSquareP,
  fP,
  gammaP,
  incompleteBeta,
  logGamma,
  normalCdf,
  normalPdf,
  tCdf,
  tCritical,
  tPdf,
  tTwoTailedP,
} from "../stats";
import { bisect } from "./numeric";

export { chiSquareP, fP, incompleteBeta, logGamma, normalCdf, normalPdf, tCdf, tCritical, tPdf, tTwoTailedP };

/** Standard normal quantile (Acklam's rational approximation, relative error < 1.2e-9). */
export function normalQuantile(p: number): number {
  const a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2, -3.066479806614716e1, 2.506628277459239];
  const b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1];
  const c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416];
  if (!(p > 0)) return -Infinity;
  if (!(p < 1)) return Infinity;
  if (p < 0.02425) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (p > 1 - 0.02425) {
    const q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  const q = p - 0.5;
  const r = q * q;
  return ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

// ── χ² and F ────────────────────────────────────────────────────────────────
export const chi2Cdf = (x: number, k: number): number => (x <= 0 ? 0 : gammaP(k / 2, x / 2));
export const chi2Sf = (x: number, k: number): number => (x <= 0 ? 1 : chiSquareP(x, k));
export function chi2Pdf(x: number, k: number): number {
  if (x < 0) return 0;
  if (x === 0) return k === 2 ? 0.5 : k < 2 ? Infinity : 0;
  return Math.exp((k / 2 - 1) * Math.log(x) - x / 2 - (k / 2) * Math.LN2 - logGamma(k / 2));
}
export const chi2Quantile = (p: number, k: number): number => bisect((x) => chi2Cdf(x, k), p, 0, Math.max(100, 20 * k), 200);

export function fPdf(x: number, d1: number, d2: number): number {
  if (x <= 0) return 0;
  const lb = logGamma((d1 + d2) / 2) - logGamma(d1 / 2) - logGamma(d2 / 2);
  return Math.exp(lb + (d1 / 2) * Math.log(d1 / d2) + (d1 / 2 - 1) * Math.log(x) - ((d1 + d2) / 2) * Math.log(1 + (d1 * x) / d2));
}
export const fCdf = (x: number, d1: number, d2: number): number => (x <= 0 ? 0 : 1 - fP(x, d1, d2));
export const fQuantile = (p: number, d1: number, d2: number): number => bisect((x) => fCdf(x, d1, d2), p, 0, 5000, 200);

/** Quantile of the t distribution (bisection on the CDF). */
export function tQuantile(p: number, df: number): number {
  if (!(p > 0 && p < 1) || !(df > 0)) return NaN;
  if (p === 0.5) return 0;
  return p < 0.5 ? -bisect((x) => tCdf(x, df), 1 - p, 0, 1e4, 200) : bisect((x) => tCdf(x, df), p, 0, 1e4, 200);
}

// ── discrete families ───────────────────────────────────────────────────────
const logChoose = (n: number, k: number) => logGamma(n + 1) - logGamma(k + 1) - logGamma(n - k + 1);
export { logChoose };

export function binomPmf(k: number, n: number, p: number): number {
  if (!Number.isInteger(k) || k < 0 || k > n) return 0;
  if (p === 0) return k === 0 ? 1 : 0;
  if (p === 1) return k === n ? 1 : 0;
  return Math.exp(logChoose(n, k) + k * Math.log(p) + (n - k) * Math.log(1 - p));
}
export function binomCdf(k: number, n: number, p: number): number {
  let s = 0;
  for (let i = 0; i <= Math.min(Math.floor(k), n); i++) s += binomPmf(i, n, p);
  return Math.min(1, s);
}
export function poisPmf(k: number, lambda: number): number {
  if (!Number.isInteger(k) || k < 0) return 0;
  if (lambda === 0) return k === 0 ? 1 : 0;
  return Math.exp(k * Math.log(lambda) - lambda - logGamma(k + 1));
}
export function poisCdf(k: number, lambda: number): number {
  let s = 0;
  for (let i = 0; i <= Math.floor(k); i++) s += poisPmf(i, lambda);
  return Math.min(1, s);
}
export const unifPdf = (x: number, a: number, b: number): number => (x < a || x > b ? 0 : 1 / (b - a));
export const unifCdf = (x: number, a: number, b: number): number => (x <= a ? 0 : x >= b ? 1 : (x - a) / (b - a));

export type FamilyName = "normal" | "t" | "chi2" | "F" | "uniform" | "binomial" | "poisson";
export interface FamilyParams {
  mu?: number;
  sigma?: number;
  df?: number;
  d1?: number;
  d2?: number;
  a?: number;
  b?: number;
  n?: number;
  p?: number;
  lambda?: number;
}
export interface Family {
  name: FamilyName;
  discrete: boolean;
  /** Density (continuous) or probability mass (discrete). */
  density: (x: number) => number;
  cdf: (x: number) => number;
  quantile: (p: number) => number;
  mean: number | null;
  sd: number | null;
  support: [number, number];
}

/** Checks parameter domains. Returns an error message, or null when the parameters are valid. */
export function familyParamError(name: FamilyName, th: FamilyParams): string | null {
  const pos = (v: number | undefined) => typeof v === "number" && Number.isFinite(v) && v > 0;
  switch (name) {
    case "normal":
      return Number.isFinite(th.mu) && pos(th.sigma) ? null : "σ must be positive";
    case "t":
    case "chi2":
      return pos(th.df) ? null : "df must be positive";
    case "F":
      return pos(th.d1) && pos(th.d2) ? null : "both df must be positive";
    case "uniform":
      return Number.isFinite(th.a) && Number.isFinite(th.b) && (th.b as number) > (th.a as number) ? null : "need a < b";
    case "binomial":
      return Number.isInteger(th.n) && (th.n as number) >= 1 && (th.p as number) >= 0 && (th.p as number) <= 1 ? null : "need integer n ≥ 1 and 0 ≤ p ≤ 1";
    case "poisson":
      return typeof th.lambda === "number" && th.lambda >= 0 && Number.isFinite(th.lambda) ? null : "λ must be ≥ 0";
  }
}

/** Named distribution facade. Returns null for invalid parameters instead of a broken curve. */
export function family(name: FamilyName, th: FamilyParams): Family | null {
  if (familyParamError(name, th)) return null;
  switch (name) {
    case "normal": {
      const mu = th.mu as number;
      const s = th.sigma as number;
      return { name, discrete: false, density: (x) => normalPdf(x, mu, s), cdf: (x) => normalCdf(x, mu, s), quantile: (p) => mu + s * normalQuantile(p), mean: mu, sd: s, support: [mu - 4.5 * s, mu + 4.5 * s] };
    }
    case "t": {
      const df = th.df as number;
      return { name, discrete: false, density: (x) => tPdf(x, df), cdf: (x) => tCdf(x, df), quantile: (p) => tQuantile(p, df), mean: df > 1 ? 0 : null, sd: df > 2 ? Math.sqrt(df / (df - 2)) : null, support: [-5, 5] };
    }
    case "chi2": {
      const df = th.df as number;
      return { name, discrete: false, density: (x) => chi2Pdf(x, df), cdf: (x) => chi2Cdf(x, df), quantile: (p) => chi2Quantile(p, df), mean: df, sd: Math.sqrt(2 * df), support: [0, Math.max(8, df + 5 * Math.sqrt(2 * df))] };
    }
    case "F": {
      const d1 = th.d1 as number;
      const d2 = th.d2 as number;
      const sd = d2 > 4 ? Math.sqrt((2 * d2 * d2 * (d1 + d2 - 2)) / (d1 * (d2 - 2) ** 2 * (d2 - 4))) : null;
      return { name, discrete: false, density: (x) => fPdf(x, d1, d2), cdf: (x) => fCdf(x, d1, d2), quantile: (p) => fQuantile(p, d1, d2), mean: d2 > 2 ? d2 / (d2 - 2) : null, sd, support: [0, 6] };
    }
    case "uniform": {
      const a = th.a as number;
      const b = th.b as number;
      return { name, discrete: false, density: (x) => unifPdf(x, a, b), cdf: (x) => unifCdf(x, a, b), quantile: (p) => a + p * (b - a), mean: (a + b) / 2, sd: (b - a) / Math.sqrt(12), support: [a - 0.1 * (b - a), b + 0.1 * (b - a)] };
    }
    case "binomial": {
      const n = th.n as number;
      const p = th.p as number;
      return {
        name,
        discrete: true,
        density: (k) => binomPmf(k, n, p),
        cdf: (k) => binomCdf(k, n, p),
        quantile: (q) => {
          let k = 0;
          while (k < n && binomCdf(k, n, p) < q) k++;
          return k;
        },
        mean: n * p,
        sd: Math.sqrt(n * p * (1 - p)),
        support: [0, n],
      };
    }
    case "poisson": {
      const l = th.lambda as number;
      return {
        name,
        discrete: true,
        density: (k) => poisPmf(k, l),
        cdf: (k) => poisCdf(k, l),
        quantile: (q) => {
          let k = 0;
          while (k < 1000 && poisCdf(k, l) < q) k++;
          return k;
        },
        mean: l,
        sd: Math.sqrt(l),
        support: [0, Math.max(10, Math.ceil(l + 5 * Math.sqrt(l)))],
      };
    }
  }
}

/** P(a < X ≤ b): F(b) − F(a) for continuous families, Σ pmf over integers in (a, b] for discrete ones. */
export function intervalProbability(f: Family, a: number, b: number): number {
  if (b <= a) return 0;
  return Math.max(0, Math.min(1, f.cdf(b) - f.cdf(a)));
}

// ── noncentral t (power) ───────────────────────────────────────────────────
/**
 * CDF of the noncentral t distribution, P(T ≤ t | df, δ). Lenth's algorithm AS 243 as used by R's pnt():
 * a series in incomplete-beta terms; accurate to ~1e-7 here (limited by the normal CDF).
 */
export function nctCdf(t: number, df: number, ncp: number): number | null {
  if (!(df > 0) || !Number.isFinite(t) || !Number.isFinite(ncp)) return null;
  if (ncp === 0) return tCdf(t, df);
  let negdel = false;
  let tt = t;
  let del = ncp;
  if (t < 0) {
    if (ncp > 40) return 0;
    negdel = true;
    tt = -t;
    del = -ncp;
  }
  if (df > 4e5 || del * del > 2 * Math.LN2 * 1021) {
    // Abramowitz–Stegun 26.7.10 normal approximation for extreme arguments
    const s = 1 / (4 * df);
    const v = normalCdf(tt * (1 - s), del, Math.sqrt(1 + tt * tt * 2 * s));
    return negdel ? 1 - v : v;
  }
  const x = (t * t) / (t * t + df);
  let tnc = 0;
  if (x > 0) {
    const lambda = del * del;
    let p = 0.5 * Math.exp(-0.5 * lambda);
    if (p === 0) return negdel ? 1 : 0;
    let q = Math.sqrt(2 / Math.PI) * p * del;
    let s = 0.5 - p;
    if (s < 1e-7) s = -0.5 * Math.expm1(-0.5 * lambda);
    let a = 0.5;
    const b = 0.5 * df;
    const rxb = Math.pow(1 - x, b);
    const albeta = 0.5 * Math.log(Math.PI) + logGamma(b) - logGamma(0.5 + b);
    let xodd = incompleteBeta(x, a, b);
    let godd = 2 * rxb * Math.exp(a * Math.log(x) - albeta);
    const bx = b * x;
    let xeven = bx < Number.EPSILON ? bx : 1 - rxb;
    let geven = bx * rxb;
    tnc = p * xodd + q * xeven;
    for (let it = 1; it <= 1000; it++) {
      a += 1;
      xodd -= godd;
      xeven -= geven;
      godd *= (x * (a + b - 1)) / a;
      geven *= (x * (a + b - 0.5)) / (a + 0.5);
      p *= lambda / (2 * it);
      q *= lambda / (2 * it + 1);
      tnc += p * xodd + q * xeven;
      s -= p;
      if (s < -1e-10) break;
      if (s <= 0 && it > 1) break;
      const errbd = 2 * s * (xodd - godd);
      if (Math.abs(errbd) < 1e-12) break;
    }
  }
  tnc += normalCdf(-del);
  const v = Math.min(1, Math.max(0, tnc));
  return negdel ? 1 - v : v;
}

export const nctSf = (q: number, df: number, ncp: number): number | null => {
  const c = nctCdf(q, df, ncp);
  return c === null ? null : 1 - c;
};

export type TTestDesign = "one" | "two" | "paired";
export interface PowerResult {
  power: number | null;
  ncp: number | null;
  df: number | null;
  crit: number | null;
  method: string;
  reason?: string;
}

/**
 * Power of a t-test (as pwr::pwr.t.test with strict = TRUE: both rejection tails counted for two-sided tests).
 * d = standardised effect; n = sample size (per group for "two").
 */
export function tPower(d: number, n: number, alpha = 0.05, sided: 1 | 2 = 2, type: TTestDesign = "one"): PowerResult {
  if (!(n >= 2) || !(alpha > 0 && alpha < 1) || !Number.isFinite(d)) return { power: null, ncp: null, df: null, crit: null, method: "noncentral t", reason: "n < 2, α outside (0, 1) or invalid effect" };
  const df = type === "two" ? 2 * n - 2 : n - 1;
  const ncp = type === "two" ? d * Math.sqrt(n / 2) : d * Math.sqrt(n);
  const crit = sided === 2 ? tCritical(df, alpha) : tQuantile(1 - alpha, df);
  const upper = nctSf(crit, df, ncp);
  const lower = nctCdf(-crit, df, ncp);
  if (upper === null || lower === null) return { power: null, ncp, df, crit, method: "noncentral t", reason: "numerical failure" };
  const power = sided === 2 ? upper + lower : upper;
  return { power: Math.min(1, power), ncp, df, crit, method: "noncentral t (Lenth AS 243), both tails for two-sided tests" };
}

/** Family-wise error rate of m independent tests at level α. */
export const fwer = (alpha: number, m: number): number => 1 - (1 - alpha) ** m;

// ── studentised range (Tukey HSD, Games–Howell) ──────────────────────────────
// Port of R's ptukey.c (Copenhaver & Holland 1988, AS 190 lineage): Gauss–Legendre quadrature
// over the range distribution (wprob) and over the χ-distributed denominator.
const XLEG = [0.98156063424671925069, 0.904117256370474856678, 0.769902674194304687037, 0.587317954286617447297, 0.367831498998180193753, 0.125233408511468915472];
const ALEG = [0.047175336386511827195, 0.106939325995318430960, 0.160078328543346226335, 0.203167426723065921749, 0.233492536538354808761, 0.249147045813402785001];

function wprob(w: number, rr: number, cc: number): number {
  const nleg = 12;
  const ihalf = 6;
  const C1 = -30;
  const C2 = -50;
  const C3 = 60;
  const bb = 8;
  const wlar = 3;
  const qsqz = w * 0.5;
  if (qsqz >= bb) return 1;
  let prW = 2 * normalCdf(qsqz) - 1;
  prW = prW >= Math.exp(C2 / cc) ? Math.pow(prW, cc) : 0;
  const wincr = w > wlar ? 2 : 3;
  let blb = qsqz;
  const binc = (bb - qsqz) / wincr;
  let bub = blb + binc;
  let einsum = 0;
  const cc1 = cc - 1;
  for (let wi = 1; wi <= wincr; wi++) {
    let elsum = 0;
    const a = 0.5 * (bub + blb);
    const b = 0.5 * (bub - blb);
    for (let jj = 1; jj <= nleg; jj++) {
      let j: number;
      let xx: number;
      if (ihalf < jj) {
        j = nleg - jj + 1;
        xx = XLEG[j - 1];
      } else {
        j = jj;
        xx = -XLEG[j - 1];
      }
      const c = b * xx;
      const ac = a + c;
      const qexpo = ac * ac;
      if (qexpo > C3) break;
      const pplus = 2 * normalCdf(ac);
      const pminus = 2 * normalCdf(ac - w);
      let rinsum = pplus * 0.5 - pminus * 0.5;
      if (rinsum >= Math.exp(C1 / cc1)) {
        rinsum = ALEG[j - 1] * Math.exp(-(0.5 * qexpo)) * Math.pow(rinsum, cc1);
        elsum += rinsum;
      }
    }
    elsum *= (2 * b * cc) / Math.sqrt(2 * Math.PI);
    einsum += elsum;
    blb = bub;
    bub += binc;
  }
  prW += einsum;
  if (prW <= Math.exp(C1 / rr)) return 0;
  prW = Math.pow(prW, rr);
  return prW >= 1 ? 1 : prW;
}

const XLEGQ = [0.989400934991649932596, 0.944575023073232576078, 0.865631202387831743880, 0.755404408355003033895, 0.617876244402643748447, 0.458016777657227386342, 0.281603550779258913230, 0.0950125098376374401853];
const ALEGQ = [0.0271524594117540948518, 0.0622535239386478928628, 0.0951585116824927848099, 0.124628971255533872052, 0.149595988816576732082, 0.169156519395002538189, 0.182603415044923588867, 0.189450610455068496285];

/** P(Q ≤ q) for the studentised range of `nmeans` means with `df` error degrees of freedom (R ptukey, nranges = 1). */
export function ptukey(q: number, nmeans: number, df: number): number | null {
  if (!(nmeans >= 2) || !(df >= 2)) return null;
  if (q <= 0) return 0;
  if (!Number.isFinite(q)) return 1;
  const rr = 1;
  const cc = nmeans;
  if (df > 25000) return wprob(q, rr, cc);
  const f2 = df * 0.5;
  let f2lf = f2 * Math.log(df) - df * Math.LN2 - logGamma(f2);
  const f21 = f2 - 1;
  const ff4 = df * 0.25;
  const ulen = df <= 100 ? 1 : df <= 800 ? 0.5 : df <= 5000 ? 0.25 : 0.125;
  f2lf += Math.log(ulen);
  let ans = 0;
  let otsum = 0;
  for (let i = 1; i <= 50; i++) {
    otsum = 0;
    const twa1 = (2 * i - 1) * ulen;
    for (let jj = 1; jj <= 16; jj++) {
      let j: number;
      let t1: number;
      if (8 < jj) {
        j = jj - 8 - 1;
        t1 = f2lf + f21 * Math.log(twa1 + XLEGQ[j] * ulen) - (XLEGQ[j] * ulen + twa1) * ff4;
      } else {
        j = jj - 1;
        t1 = f2lf + f21 * Math.log(twa1 - XLEGQ[j] * ulen) + (XLEGQ[j] * ulen - twa1) * ff4;
      }
      if (t1 >= -30) {
        const qsqz = 8 < jj ? q * Math.sqrt((XLEGQ[j] * ulen + twa1) * 0.5) : q * Math.sqrt((-(XLEGQ[j] * ulen) + twa1) * 0.5);
        const wprb = wprob(qsqz, rr, cc);
        otsum += wprb * ALEGQ[j] * Math.exp(t1);
      }
    }
    if (i * ulen >= 1 && otsum <= 1e-14) break;
    ans += otsum;
  }
  return Math.min(1, ans);
}

/** Quantile of the studentised range (bisection on ptukey to 1e-10). */
export function qtukey(p: number, nmeans: number, df: number): number | null {
  if (!(p > 0 && p < 1)) return null;
  if (ptukey(1, nmeans, df) === null) return null;
  let lo = 0;
  let hi = 1;
  while ((ptukey(hi, nmeans, df) as number) < p && hi < 200) hi *= 2;
  for (let i = 0; i < 80 && hi - lo > 1e-10; i++) {
    const m = (lo + hi) / 2;
    if ((ptukey(m, nmeans, df) as number) < p) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
}
