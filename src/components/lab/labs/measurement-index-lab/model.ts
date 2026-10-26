// Measurement & Index Lab model: the two course item sets (ds.index-120, the module 02 trust-in-science
// responses, and ds.efficacy-120), Cronbach's α with item statistics (engine measurement.ts), the summated
// index with absolute / tercile / quartile cuts, and an attenuation simulation: random error added to every
// item lowers the index's correlation with a fixed criterion by √(reliability of the noisy index).
import { quantile } from "@/lib/engine/descriptives";
import { pearson } from "@/lib/engine/inference";
import { cronbach } from "@/lib/engine/measurement";
import { mean, sum } from "@/lib/engine/numeric";
import { gaussian, mulberry32 } from "@/lib/engine/rng";
import { datasetById } from "@/content/curriculum/datasets";

export type ItemSet = "trust" | "efficacy";
export type CutRule = "absolute" | "relative" | "percentile";
export type Scoring = "mean" | "sum";
const DS: Record<ItemSet, string> = { trust: "ds.index-120", efficacy: "ds.efficacy-120" };

export interface Items {
  names: string[];
  labels: string[];
  data: number[][];
  /** Items worded in the opposite direction (reverse-code them before summing). */
  negative: string[];
}
export function itemSet(set: ItemSet): Items {
  const ds = datasetById(DS[set]);
  if (!ds) throw new Error(`dataset ${DS[set]} missing`);
  const cols = ds.columns.slice(1);
  return {
    names: cols.map((c) => c.name),
    labels: cols.map((c) => c.label),
    data: cols.map((_, j) => ds.rows.map((r) => Number(r[j + 1]))),
    negative: set === "trust" ? ["T3", "T5"] : ["eff4_rev"],
  };
}

/** Included items, reverse-coded where asked (x → 6 − x on the 1–5 scale). */
export function keyed(it: Items, include: readonly string[], reverse: readonly string[]) {
  const idx = it.names.map((_, i) => i).filter((i) => include.includes(it.names[i]));
  return { idx, cols: idx.map((i) => (reverse.includes(it.names[i]) ? it.data[i].map((v) => 6 - v) : it.data[i])) };
}

export function alphaOf(it: Items, include: readonly string[], reverse: readonly string[]) {
  const { idx, cols } = keyed(it, include, reverse);
  return { idx, cols, cr: cronbach(cols) };
}

export function indexScores(cols: readonly number[][], scoring: Scoring): number[] {
  const n = cols[0]?.length ?? 0;
  return Array.from({ length: n }, (_, i) => {
    const s = sum(cols.map((c) => c[i]));
    return scoring === "mean" ? s / cols.length : s;
  });
}

/** Thresholds c₁ < c₂: absolute (scale points, given on the 1–5 mean scale), terciles or the outer quartiles. */
export function thresholds(index: readonly number[], rule: CutRule, abs: readonly [number, number], k: number, scoring: Scoring): [number, number] {
  if (rule === "absolute") {
    const c = abs.map((v) => (scoring === "mean" ? v : v * k)).sort((a, b) => a - b);
    return [c[0], c[1]];
  }
  const p = rule === "relative" ? [1 / 3, 2 / 3] : [0.25, 0.75];
  return [quantile(index, p[0]) as number, quantile(index, p[1]) as number];
}
/** Low: x < c₁; mid: c₁ ≤ x < c₂; high: x ≥ c₂. */
export const categorize = (index: readonly number[], c: readonly [number, number]) => [0, 1, 2].map((k) => index.filter((v) => (v < c[0] ? 0 : v < c[1] ? 1 : 2) === k).length);

const sd = (xs: readonly number[]) => {
  const m = mean(xs) as number;
  return Math.sqrt(sum(xs.map((x) => (x - m) ** 2)) / (xs.length - 1));
};

/** Error-free criterion Y = 0.6·z(clean index) + 0.8·noise (seeded), so r(clean index, Y) ≈ 0.6 by construction. */
export function criterion(clean: readonly number[], seed: number): number[] {
  const z = gaussian(mulberry32(seed + 101));
  const m = mean(clean) as number;
  const s = sd(clean) || 1;
  return clean.map((v) => (0.6 * (v - m)) / s + 0.8 * z());
}

/** Adds N(0, σ²) error to every item response (seeded) and rebuilds the index. */
export function noisyIndex(cols: readonly number[][], errorSD: number, seed: number, scoring: Scoring) {
  const z = gaussian(mulberry32(seed + 202));
  const noisy = cols.map((c) => c.map((v) => v + errorSD * z()));
  return { noisy, index: indexScores(noisy, scoring) };
}

export interface Attenuation {
  rTrue: number | null;
  rObs: number | null;
  /** var(clean)/var(noisy): the reliability of the noisy index relative to the clean one (ρ_xx, ρ_yy = 1). */
  rho: number;
  predicted: number | null;
  alphaClean: number | null;
  alphaNoisy: number | null;
  index: number[];
  y: number[];
}
export function attenuationOf(cols: readonly number[][], errorSD: number, seed: number, scoring: Scoring): Attenuation {
  const clean = indexScores(cols, scoring);
  const y = criterion(clean, seed);
  const { noisy, index } = noisyIndex(cols, errorSD, seed, scoring);
  const rTrue = pearson(clean, y).r;
  const rObs = pearson(index, y).r;
  const rho = sd(clean) ** 2 / sd(index) ** 2;
  return { rTrue, rObs, rho, predicted: rTrue === null ? null : rTrue * Math.sqrt(rho), alphaClean: cronbach(cols).alpha, alphaNoisy: cronbach(noisy).alpha, index, y };
}
