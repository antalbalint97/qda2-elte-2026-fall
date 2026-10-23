// Discrete probability: two-event Bayes, discrete random variables and seeded simulation.
import { rng } from "./rng";
import { sum } from "./numeric";

export interface Bayes {
  pA: number;
  pB: number;
  pAB: number;
  pAnB: number;
  /** P(B | A) */
  pBgA: number | null;
  /** P(B | ¬A) */
  pBgnA: number | null;
  independent: boolean;
}

/** Two binary events from P(B), P(A|B), P(A|¬B): joint, marginal and inverted conditionals. */
export function bayes(pB: number, pAgB: number, pAgnB: number): Bayes | null {
  if ([pB, pAgB, pAgnB].some((p) => !(p >= 0 && p <= 1))) return null;
  const pAB = pB * pAgB;
  const pAnB = (1 - pB) * pAgnB;
  const pA = pAB + pAnB;
  return {
    pA,
    pB,
    pAB,
    pAnB,
    pBgA: pA > 0 ? pAB / pA : null,
    pBgnA: 1 - pA > 0 ? (pB * (1 - pAgB)) / (1 - pA) : null,
    independent: Math.abs(pAgB - pAgnB) < 1e-12,
  };
}

/** Natural-frequency version of a Bayes tree for N people (rounded counts for display). */
export function naturalFrequencies(b: Bayes, N: number) {
  return { N, B: Math.round(N * b.pB), AandB: Math.round(N * b.pAB), AandNotB: Math.round(N * b.pAnB), notB: N - Math.round(N * b.pB) };
}

export interface Outcome {
  x: number;
  p: number;
}
export interface DiscreteRV {
  E: number | null;
  Var: number | null;
  SD: number | null;
  normalised: boolean;
  outcomes: Outcome[];
  reason?: string;
}

/** E, Var, SD of a discrete distribution; probabilities that do not sum to 1 are normalised (and flagged). */
export function discreteRV(out: readonly Outcome[]): DiscreteRV {
  if (out.some((o) => !(o.p >= 0) || !Number.isFinite(o.x))) return { E: null, Var: null, SD: null, normalised: false, outcomes: [], reason: "probabilities must be ≥ 0 and outcomes finite" };
  const P = sum(out.map((o) => o.p));
  if (!(P > 0)) return { E: null, Var: null, SD: null, normalised: false, outcomes: [], reason: "probabilities sum to 0" };
  const o = out.map((d) => ({ x: d.x, p: d.p / P }));
  const E = sum(o.map((d) => d.x * d.p));
  const V = sum(o.map((d) => d.p * (d.x - E) ** 2));
  return { E, Var: V, SD: Math.sqrt(V), normalised: Math.abs(P - 1) > 1e-9, outcomes: o };
}

/** n seeded draws from a discrete distribution with the running mean after each draw. */
export function sampleDiscrete(out: readonly Outcome[], n: number, seed: number) {
  const rv = discreteRV(out);
  const r = rng(seed);
  const cdf: number[] = [];
  let c = 0;
  rv.outcomes.forEach((o) => {
    c += o.p;
    cdf.push(c);
  });
  const draws: number[] = [];
  const index: number[] = [];
  const running: number[] = [];
  let s = 0;
  for (let i = 0; i < n && rv.outcomes.length; i++) {
    const u = r();
    let k = cdf.findIndex((v) => u <= v);
    if (k < 0) k = cdf.length - 1;
    const x = rv.outcomes[k].x;
    draws.push(x);
    index.push(k);
    s += x;
    running.push(s / (i + 1));
  }
  return { draws, index, running, mean: draws.length ? s / draws.length : null, rv };
}

/** Exact distribution of the sum of m fair k-sided dice. */
export function diceSum(m: number, k: number): Outcome[] {
  let dist = new Map<number, number>([[0, 1]]);
  for (let i = 0; i < m; i++) {
    const nd = new Map<number, number>();
    dist.forEach((p, s) => {
      for (let f = 1; f <= k; f++) nd.set(s + f, (nd.get(s + f) ?? 0) + p / k);
    });
    dist = nd;
  }
  return [...dist.entries()].map(([x, p]) => ({ x, p })).sort((a, b) => a.x - b.x);
}

/** Joint probability table of two events from P(A), P(B) and P(A∩B); null when impossible. */
export function jointTable(pA: number, pB: number, pAB: number) {
  const lo = Math.max(0, pA + pB - 1);
  const hi = Math.min(pA, pB);
  if (!(pA >= 0 && pA <= 1 && pB >= 0 && pB <= 1) || pAB < lo - 1e-12 || pAB > hi + 1e-12) return null;
  return {
    cells: [
      [pAB, pA - pAB],
      [pB - pAB, 1 - pA - pB + pAB],
    ],
    union: pA + pB - pAB,
    pAgB: pB > 0 ? pAB / pB : null,
    pBgA: pA > 0 ? pAB / pA : null,
    independent: Math.abs(pAB - pA * pB) < 1e-9,
    feasible: [lo, hi] as [number, number],
  };
}
