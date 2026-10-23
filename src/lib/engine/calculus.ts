// Numerical calculus helpers for the Math Studio. Pure functions; no symbolic algebra.
import { simpson } from "./numeric";

export const derivative = (f: (x: number) => number, x: number, h = 1e-5): number => (f(x + h) - f(x - h)) / (2 * h);
export const integral = (f: (x: number) => number, a: number, b: number, n = 400): number => simpson(f, a, b, n);

export type RiemannKind = "left" | "right" | "mid";
export function riemann(f: (x: number) => number, a: number, b: number, n: number, kind: RiemannKind = "left"): number {
  const h = (b - a) / n;
  let s = 0;
  for (let i = 0; i < n; i++) {
    const x = kind === "left" ? a + i * h : kind === "right" ? a + (i + 1) * h : a + (i + 0.5) * h;
    s += f(x) * h;
  }
  return s;
}

/** Central-difference gradient with a step scaled to the coordinate's magnitude. */
export const gradient = (f: (v: number[]) => number, v: number[], h = 1e-5): number[] =>
  v.map((_, i) => {
    const step = h * Math.max(1, Math.abs(v[i]));
    const a = v.slice();
    const b = v.slice();
    a[i] += step;
    b[i] -= step;
    return (f(a) - f(b)) / (2 * step);
  });

export interface Descent {
  x: number[];
  path: number[][];
  f: number;
  diverged: boolean;
}
/** Fixed-step gradient descent; stops (diverged) when the objective stops being finite. */
export function gradientDescent(f: (v: number[]) => number, x0: number[], lr = 0.01, steps = 100): Descent {
  let x = x0.slice();
  const path = [x.slice()];
  const f0 = Math.abs(f(x0));
  for (let i = 0; i < steps; i++) {
    const gr = gradient(f, x);
    x = x.map((v, j) => v - lr * gr[j]);
    path.push(x.slice());
    const fx = f(x);
    if (!Number.isFinite(fx) || Math.abs(fx) > 1e6 * (f0 + 1) || x.some((v) => !Number.isFinite(v) || Math.abs(v) > 1e12)) return { x, path, f: fx, diverged: true };
  }
  return { x, path, f: f(x), diverged: false };
}

/** Bernoulli log-likelihood of p for k successes in n trials. */
export const bernoulliLogLik = (p: number, k: number, n: number): number => (p <= 0 || p >= 1 ? -Infinity : k * Math.log(p) + (n - k) * Math.log(1 - p));
/** Normal log-likelihood of (μ, σ) for a sample. */
export const normalLogLik = (mu: number, sigma: number, xs: readonly number[]): number =>
  sigma <= 0 ? -Infinity : xs.reduce((s, x) => s - 0.5 * Math.log(2 * Math.PI * sigma * sigma) - (x - mu) ** 2 / (2 * sigma * sigma), 0);

/** Taylor polynomial of order m of e^x, sin x or ln(1+x) at 0 (used for approximation demos). */
export function taylor(fn: "exp" | "sin" | "log1p", x: number, m: number): number {
  let s = 0;
  for (let k = 0; k <= m; k++) {
    if (fn === "exp") s += x ** k / factorial(k);
    else if (fn === "sin") {
      if (k % 2 === 1) s += ((k % 4 === 1 ? 1 : -1) * x ** k) / factorial(k);
    } else if (k >= 1) s += ((k % 2 === 1 ? 1 : -1) * x ** k) / k;
  }
  return s;
}
function factorial(k: number): number {
  let f = 1;
  for (let i = 2; i <= k; i++) f *= i;
  return f;
}
