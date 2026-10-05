import { gaussian, mulberry32 } from "@/lib/stats";

export function linearSample(seed: number, n: number, slope: number, noise: number) {
  const g = gaussian(mulberry32(seed));
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = 0; i < n; i++) {
    const x = g();
    xs.push(x);
    ys.push(slope * x + noise * g());
  }
  return { xs, ys };
}

/** Sample whose population correlation is exactly rho (standard bivariate normal). */
export function rhoSample(seed: number, n: number, rho: number) {
  return linearSample(seed, n, rho, Math.sqrt(1 - rho * rho));
}

export function uShapeSample(seed: number, n: number) {
  const rand = mulberry32(seed);
  const g = gaussian(mulberry32(seed + 1));
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = 0; i < n; i++) {
    const age = 18 + rand() * 62; // 18–80
    xs.push(age);
    // inverted U: hours peak in middle age
    ys.push(Math.max(0, 40 - 0.045 * (age - 49) ** 2 + 4 * g()));
  }
  return { xs, ys };
}

export function monotonicSample(seed: number, n: number) {
  const rand = mulberry32(seed);
  const g = gaussian(mulberry32(seed + 7));
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = 0; i < n; i++) {
    const x = rand() * 10;
    xs.push(x);
    ys.push(Math.exp(0.45 * x) * Math.exp(0.25 * g()));
  }
  return { xs, ys };
}
