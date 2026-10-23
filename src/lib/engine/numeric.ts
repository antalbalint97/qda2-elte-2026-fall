// Small numerical utilities shared by the engine modules. Results that are not finite become null.

export const sum = (xs: readonly number[]): number => {
  let s = 0;
  for (const x of xs) s += x;
  return s;
};

export const mean = (xs: readonly number[]): number | null => (xs.length ? sum(xs) / xs.length : null);

/** Finite number or null. */
export const fin = (x: number): number | null => (Number.isFinite(x) ? x : null);

export const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/** Composite Simpson's rule with n (even) panels. */
export function simpson(f: (x: number) => number, a: number, b: number, n = 400): number {
  if (n % 2) n++;
  const h = (b - a) / n;
  let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2);
  return (s * h) / 3;
}

/** x in [lo, hi] with f(x) = target for an increasing f (bisection). */
export function bisect(f: (x: number) => number, target: number, lo: number, hi: number, iterations = 100): number {
  for (let i = 0; i < iterations; i++) {
    const m = (lo + hi) / 2;
    if (f(m) < target) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
}

/** Sum of squared deviations around c. */
export const ssAround = (xs: readonly number[], c: number): number => {
  let s = 0;
  for (const x of xs) s += (x - c) * (x - c);
  return s;
};

/** True when every entry is a finite number. */
export const allFinite = (xs: readonly unknown[]): xs is number[] => xs.every((x) => typeof x === "number" && Number.isFinite(x));
