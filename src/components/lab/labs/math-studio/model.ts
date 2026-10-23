// Mathematical Foundations Studio model: transformed preset functions g(x) = a·f(b·x + c) + d with analytic
// derivatives and antiderivatives (to check the numeric ones), Riemann sums, the Σ expansion of a sum of
// squares, the SSE(a, b) bowl of the VRA data with its exact elliptical contours, and the binomial likelihood.
// Numeric work uses src/lib/engine/calculus.ts; the bowl minimum is checked against engine fit().
import { bernoulliLogLik, derivative, integral, riemann, type RiemannKind } from "@/lib/engine/calculus";
import { eigenSym } from "@/lib/engine/linalg";
import { normalCdf, normalPdf } from "@/lib/engine/distributions";
import { fit, sseLine } from "@/lib/engine/regression";
import { sum } from "@/lib/engine/numeric";
import { datasetById } from "@/content/curriculum/datasets";

export type Fn = "quad" | "exp" | "log" | "sin" | "abs" | "normal";
export const FNS: Fn[] = ["quad", "exp", "log", "sin", "abs", "normal"];
export interface Transform {
  a: number;
  b: number;
  c: number;
  d: number;
}

interface Base {
  f: (u: number) => number;
  /** f′(u); NaN where it does not exist. */
  df: (u: number) => number;
  /** An antiderivative F(u); NaN outside the domain. */
  F: (u: number) => number;
  /** Points where f′ does not exist (kinks). */
  kinks: number[];
  /** Domain u > 0. */
  positive?: boolean;
}
const BASE: Record<Fn, Base> = {
  quad: { f: (u) => u * u, df: (u) => 2 * u, F: (u) => u ** 3 / 3, kinks: [] },
  exp: { f: Math.exp, df: Math.exp, F: Math.exp, kinks: [] },
  log: { f: (u) => (u > 0 ? Math.log(u) : NaN), df: (u) => (u > 0 ? 1 / u : NaN), F: (u) => (u > 0 ? u * Math.log(u) - u : u === 0 ? 0 : NaN), kinks: [], positive: true },
  sin: { f: Math.sin, df: Math.cos, F: (u) => -Math.cos(u), kinks: [] },
  abs: { f: Math.abs, df: (u) => (u === 0 ? NaN : Math.sign(u)), F: (u) => (u * Math.abs(u)) / 2, kinks: [0] },
  normal: { f: normalPdf, df: (u) => -u * normalPdf(u), F: normalCdf, kinks: [] },
};

export const g = (fn: Fn, t: Transform) => (x: number) => t.a * BASE[fn].f(t.b * x + t.c) + t.d;
export const gPrime = (fn: Fn, t: Transform, x: number) => t.a * t.b * BASE[fn].df(t.b * x + t.c);

export interface Slope {
  value: number | null;
  /** Why the derivative is not reported. */
  reason: "kink" | "domain" | null;
  numeric: number | null;
  analytic: number | null;
}
/** Central-difference derivative (h = 1e-5) next to the analytic one; null at a kink or outside the domain. */
export function slopeAt(fn: Fn, t: Transform, x: number, h = 1e-5): Slope {
  const u = t.b * x + t.c;
  const B = BASE[fn];
  if (B.positive && (u <= 0 || t.b * (x - h) + t.c <= 0)) return { value: null, reason: "domain", numeric: null, analytic: null };
  if (B.kinks.some((k) => Math.abs(u - k) <= Math.abs(t.b) * h + 1e-12)) return { value: null, reason: "kink", numeric: null, analytic: null };
  const numeric = derivative(g(fn, t), x, h);
  const analytic = gPrime(fn, t, x);
  return { value: numeric, reason: null, numeric, analytic: Number.isFinite(analytic) ? analytic : null };
}
/** The symmetric secant slope over [x − h, x + h] for the "shrink h" demonstration. */
export const secantSlope = (fn: Fn, t: Transform, x: number, h: number) => (g(fn, t)(x + h) - g(fn, t)(x - h)) / (2 * h);

export interface Area {
  simpson: number | null;
  riemann: number | null;
  exact: number | null;
  reason: "domain" | null;
}
/** ∫_lo^hi g by Simpson (400 panels), by an n-rectangle Riemann sum, and exactly from the antiderivative. */
export function areaOf(fn: Fn, t: Transform, lo: number, hi: number, n: number, rule: RiemannKind): Area {
  const B = BASE[fn];
  if (B.positive && Math.min(t.b * lo + t.c, t.b * hi + t.c) <= 0) return { simpson: null, riemann: null, exact: null, reason: "domain" };
  const G = g(fn, t);
  const exact = t.b === 0 ? (t.a * B.f(t.c) + t.d) * (hi - lo) : (t.a / t.b) * (B.F(t.b * hi + t.c) - B.F(t.b * lo + t.c)) + t.d * (hi - lo);
  return { simpson: integral(G, lo, hi, 400), riemann: riemann(G, lo, hi, n, rule), exact: Number.isFinite(exact) ? exact : null, reason: null };
}

/** The VRA base data (ds.news-knowledge): x = weekly news hours, y = political knowledge. */
export function vraData(): { x: number[]; y: number[] } {
  const ds = datasetById("ds.news-knowledge");
  if (!ds) throw new Error("ds.news-knowledge missing");
  return { x: ds.rows.map((r) => Number(r[1])), y: ds.rows.map((r) => Number(r[2])) };
}

export interface SumExpansion {
  xs: number[];
  mean: number;
  terms: { x: number; dev: number; sq: number }[];
  sumDev: number;
  ss: number;
}
export function expandSum(xs: readonly number[]): SumExpansion {
  const m = sum(xs) / xs.length;
  const terms = xs.map((x) => ({ x, dev: x - m, sq: (x - m) ** 2 }));
  return { xs: [...xs], mean: m, terms, sumDev: sum(terms.map((t) => t.dev)), ss: sum(terms.map((t) => t.sq)) };
}
/** Σ(xᵢ − c)² as a function of c: minimised at c = x̄. */
export const ssAround = (xs: readonly number[], c: number) => sum(xs.map((x) => (x - c) ** 2));

export interface Bowl {
  a: number;
  b: number;
  sse: number;
  /** Analytic gradient ∂SSE/∂a = −2Σe, ∂SSE/∂b = −2Σxe. */
  grad: [number, number];
  ols: { a: number; b: number; sse: number };
  /** XᵀX: SSE(a, b) = SSE_min + Δᵀ XᵀX Δ. */
  XtX: [[number, number], [number, number]];
}
export function bowlAt(x: readonly number[], y: readonly number[], a: number, b: number): Bowl {
  const f = fit(x, y);
  const e = y.map((v, i) => v - a - b * x[i]);
  const n = x.length;
  const sx = sum(x as number[]);
  const sxx = sum(x.map((v) => v * v));
  return {
    a,
    b,
    sse: sseLine(x, y, a, b),
    grad: [-2 * sum(e), -2 * sum(e.map((v, i) => v * x[i]))],
    ols: { a: f.intercept as number, b: f.slope as number, sse: f.sse as number },
    XtX: [
      [n, sx],
      [sx, sxx],
    ],
  };
}
/** Points on the contour SSE(a, b) = level (an ellipse around the OLS point); empty below the minimum. */
export function contour(bw: Bowl, level: number, m = 96): [number, number][] {
  const extra = level - bw.ols.sse;
  if (!(extra > 0)) return [];
  const e = eigenSym(bw.XtX);
  return Array.from({ length: m + 1 }, (_, i) => {
    const th = (2 * Math.PI * i) / m;
    const r = [Math.cos(th) * Math.sqrt(extra / e.values[0]), Math.sin(th) * Math.sqrt(extra / e.values[1])];
    return [bw.ols.a + r[0] * e.vectors[0][0] + r[1] * e.vectors[1][0], bw.ols.b + r[0] * e.vectors[0][1] + r[1] * e.vectors[1][1]];
  });
}
/** One gradient-descent step with the exact line search for a quadratic (step = gᵀg / 2gᵀXᵀXg). */
export function descentStep(bw: Bowl): [number, number] {
  const [ga, gb] = bw.grad;
  const H = bw.XtX;
  const gHg = ga * (H[0][0] * ga + H[0][1] * gb) + gb * (H[1][0] * ga + H[1][1] * gb);
  if (!(gHg > 0)) return [bw.a, bw.b];
  const s = (ga * ga + gb * gb) / (2 * gHg);
  return [bw.a - s * ga, bw.b - s * gb];
}
/** SSE on a 61 × 61 grid; returns the grid minimum (the spec's surface contract). */
export function gridMinimum(x: readonly number[], y: readonly number[], aLo: number, aHi: number, bLo: number, bHi: number, m = 61) {
  let best = { a: aLo, b: bLo, sse: Infinity };
  for (let i = 0; i < m; i++)
    for (let j = 0; j < m; j++) {
      const a = aLo + ((aHi - aLo) * i) / (m - 1);
      const b = bLo + ((bHi - bLo) * j) / (m - 1);
      const s = sseLine(x, y, a, b);
      if (s < best.sse) best = { a, b, sse: s };
    }
  return best;
}

export interface Likelihood {
  L: number;
  logL: number;
  pHat: number;
  /** Score ℓ′(p), numeric, and observed information −ℓ″(p̂), numeric and exact n/(p̂(1−p̂)). */
  score: number;
  infoNumeric: number | null;
  infoExact: number | null;
  se: number | null;
}
const logChoose = (n: number, k: number) => {
  let s = 0;
  for (let i = 1; i <= k; i++) s += Math.log(n - k + i) - Math.log(i);
  return s;
};
export function likelihoodAt(k: number, n: number, p: number): Likelihood {
  const ll = (q: number) => bernoulliLogLik(q, k, n);
  const pHat = k / n;
  const interior = pHat > 0 && pHat < 1;
  const h = 1e-4;
  const infoNumeric = interior ? -(ll(pHat + h) - 2 * ll(pHat) + ll(pHat - h)) / (h * h) : null;
  const infoExact = interior ? n / (pHat * (1 - pHat)) : null;
  const logL = ll(p);
  return { L: Math.exp(logChoose(n, k) + logL), logL, pHat, score: derivative(ll, p, 1e-6), infoNumeric, infoExact, se: infoExact ? 1 / Math.sqrt(infoExact) : null };
}
