// Reliability statistics for summated indices, as in SPSS Analyze → Scale → Reliability Analysis.
// Matrices are respondents × items; every respondent must have a value on every item (listwise).
import { mean, pearson } from "./stats";

/** Sample variance (n − 1). */
function variance(xs: number[]): number {
  const m = mean(xs);
  return xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1);
}

const column = (m: number[][], j: number) => m.map((row) => row[j]);
const rowSums = (m: number[][]) => m.map((row) => row.reduce((a, b) => a + b, 0));

/** The variances of the items and of their sum: the two ingredients of Cronbach's alpha. */
export function alphaParts(m: number[][]) {
  const k = m[0].length;
  const itemVariances = Array.from({ length: k }, (_, j) => variance(column(m, j)));
  return { k, itemVariances, sumOfItemVariances: itemVariances.reduce((a, b) => a + b, 0), totalVariance: variance(rowSums(m)) };
}

/** Cronbach's alpha: k/(k − 1) · (1 − Σ item variances / variance of the sum). Can be negative. */
export function cronbachAlpha(m: number[][]): number {
  const { k, sumOfItemVariances, totalVariance } = alphaParts(m);
  return (k / (k - 1)) * (1 - sumOfItemVariances / totalVariance);
}

export interface ItemTotalRow {
  /** Mean and variance of the summed score of the other items. */
  scaleMeanIfDeleted: number;
  scaleVarianceIfDeleted: number;
  /** Corrected item-total correlation: the item against the sum of all OTHER items. */
  itemTotal: number;
  /** Cronbach's alpha of the remaining items if this one is deleted (NaN when only one would remain). */
  alphaIfDeleted: number;
}

/** SPSS "Item-Total Statistics" for every column of the matrix. */
export function itemTotalStatistics(m: number[][]): ItemTotalRow[] {
  const k = m[0].length;
  const totals = rowSums(m);
  return Array.from({ length: k }, (_, j) => {
    const item = column(m, j);
    const rest = totals.map((t, i) => t - item[i]);
    const without = m.map((row) => row.filter((_, c) => c !== j));
    return {
      scaleMeanIfDeleted: mean(rest),
      scaleVarianceIfDeleted: variance(rest),
      itemTotal: pearson(item, rest),
      alphaIfDeleted: k > 2 ? cronbachAlpha(without) : NaN,
    };
  });
}

/** Rule-of-thumb label for alpha, as used in the course. */
export function alphaBand(a: number): { label: string; ok: boolean } {
  if (a >= 0.9) return { label: "excellent, but check for redundant items", ok: true };
  if (a >= 0.8) return { label: "good", ok: true };
  if (a >= 0.7) return { label: "acceptable", ok: true };
  if (a >= 0.6) return { label: "questionable", ok: false };
  if (a >= 0.5) return { label: "weak", ok: false };
  if (a >= 0) return { label: "unacceptable", ok: false };
  return { label: "negative: items point in opposite directions", ok: false };
}
