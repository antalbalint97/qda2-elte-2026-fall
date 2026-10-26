// Constructed (synthetic) teaching data for module 09. None of these numbers come from a survey.
// The small datasets are checked against SciPy in tests/unit (scripts/validation/reference.py).
import { gaussian, linearFit, mulberry32 } from "@/lib/stats";

export interface TrustGroup {
  id: string;
  label: string;
  /** Plain-language description of the shape, used in text alternatives. */
  shape: string;
  values: number[];
}

/** Four groups of 20 respondents rating trust in parliament (0–10). All have mean 5 and median 5. */
export const TRUST_GROUPS: TrustGroup[] = [
  {
    id: "consensus",
    label: "Group A: consensus",
    shape: "almost everyone answers 4, 5 or 6",
    values: [3, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 7],
  },
  {
    id: "spread",
    label: "Group B: spread out",
    shape: "answers are spread fairly evenly across the whole scale",
    values: [0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 5, 5, 6, 6, 7, 7, 8, 9, 9, 10],
  },
  {
    id: "polarised",
    label: "Group C: polarised",
    shape: "two camps, one near 0 and one near 10, with almost nobody in the middle",
    values: [0, 0, 0, 1, 1, 1, 1, 2, 2, 5, 5, 8, 8, 9, 9, 9, 9, 10, 10, 10],
  },
  {
    id: "tail",
    label: "Group D: long right tail",
    shape: "most answers are 3 to 6, with two respondents far above at 9 and 10",
    values: [3, 3, 4, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 6, 6, 9, 10],
  },
];

/** Monthly net income (thousand HUF) of eight people; a ninth person's income is set by a slider. */
export const INCOMES = [280, 310, 340, 360, 390, 420, 450, 480];
export const NINTH_INCOME = { min: 500, max: 5000, step: 50, start: 520 };

/** Books read last year by six respondents (the variance-as-squares chart starts here). */
export const BOOKS = [2, 4, 5, 7, 9, 15];
export const BOOK_LABELS = ["A", "B", "C", "D", "E", "F"];
export const BOOK_RANGE = { min: 0, max: 20 };

/** Weekly hours of news use (X) and a political knowledge score 0–100 (Y) for eight respondents. */
export const NEWS = {
  x: [1, 2, 3, 5, 6, 8, 10, 12],
  y: [28, 45, 33, 52, 47, 60, 74, 66],
};

/** Population model of the simulations: knowledge = 30 + 3 × hours + error. */
export const POP = { intercept: 30, slope: 3, xMax: 14 };

/** Sample size and seed of the spread-pattern (heteroscedasticity) demo. */
export const SPREAD_N = 150;
export const SPREAD_SEED = 8;

export type SpreadPattern = "constant" | "grows" | "shrinks";

/** Error SD at a given x for each pattern. All three have the same average error SD (10) across 0–14. */
export function errorSd(pattern: SpreadPattern, x: number, sigma = 10): number {
  const k = x / POP.xMax; // 0 … 1
  if (pattern === "grows") return sigma * (0.15 + 1.7 * k);
  if (pattern === "shrinks") return sigma * (1.85 - 1.7 * k);
  return sigma;
}

/** One synthetic sample from the population model, reproducible from its seed. */
export function simulateSample(n: number, sigma: number, seed: number, pattern: SpreadPattern = "constant") {
  const rand = mulberry32(seed);
  const z = gaussian(mulberry32(seed ^ 0x9e3779b9));
  const x: number[] = [];
  const y: number[] = [];
  for (let i = 0; i < n; i++) {
    const xi = rand() * POP.xMax;
    x.push(xi);
    y.push(POP.intercept + POP.slope * xi + errorSd(pattern, xi, sigma) * z());
  }
  return { x, y };
}

/** Number of repeated samples the error-term demo draws to show how much the fitted line wobbles. */
export const REPEATS = 25;

/** The samples behind one view of the error-term demo (error SD sigma, sample size n, seed). */
export function errorDanceSamples(n: number, sigma: number, seed: number) {
  return Array.from({ length: REPEATS }, (_, k) => {
    const s = simulateSample(n, sigma, seed * 1000 + k + 1);
    return { ...s, fit: linearFit(s.x, s.y) };
  });
}

/** Typical residual size (root mean square) within each third of the X range (low, middle, high). */
export function spreadByThird(x: number[], residuals: number[]): [number, number, number] {
  const bins: number[][] = [[], [], []];
  x.forEach((xi, i) => bins[Math.min(2, Math.floor((xi / POP.xMax) * 3))].push(residuals[i]));
  return bins.map((b) => Math.sqrt(b.reduce((a, e) => a + e * e, 0) / Math.max(1, b.length))) as [number, number, number];
}

export function fmt(v: number, d = 1): string {
  return v.toFixed(d);
}
