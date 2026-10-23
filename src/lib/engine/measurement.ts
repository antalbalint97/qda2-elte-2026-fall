// Reliability of summated scales. The alpha formula is the one already validated in src/lib/reliability.ts
// (module 09); this module adds reverse-coding, α-if-deleted and the standardised α for the lab.
import { describe } from "./descriptives";
import { pearson } from "./inference";
import { mean, sum } from "./numeric";

export interface ItemRow {
  item: number;
  mean: number | null;
  sd: number | null;
  /** Corrected item-total correlation (item vs sum of the other items). */
  corrected: number | null;
  alphaIfDeleted: number | null;
}
export interface Cronbach {
  alpha: number | null;
  k: number;
  n: number;
  itemVariances: (number | null)[];
  totalVariance: number | null;
  itemTotal: ItemRow[];
  avgInterItemR: number | null;
  standardized: number | null;
  total: number[];
  method: string;
  reason?: string;
}

/** Reverse-codes an item on a [min, max] scale: x → min + max − x. */
export const reverseItem = (x: readonly number[], scaleMin: number, scaleMax: number): number[] => x.map((v) => scaleMin + scaleMax - v);

/**
 * Cronbach's α for items given as columns (same n, listwise complete). reverse[j] reverse-codes item j first.
 * α = k/(k−1)·(1 − Σs²ᵢ/s²_total); can be negative.
 */
export function cronbach(items: readonly (readonly number[])[], reverse?: readonly boolean[], scaleMin = 1, scaleMax = 5, withItemStats = true): Cronbach {
  const k = items.length;
  const method = "α = k/(k−1)(1 − Σs²ᵢ/s²ₜ); corrected item-total r; α-if-deleted";
  const it = items.map((x, j) => (reverse && reverse[j] ? reverseItem(x, scaleMin, scaleMax) : [...x]));
  const n = it[0]?.length ?? 0;
  const empty: Cronbach = { alpha: null, k, n, itemVariances: [], totalVariance: null, itemTotal: [], avgInterItemR: null, standardized: null, total: [], method };
  if (k < 2) return { ...empty, reason: "need at least 2 items" };
  if (it.some((x) => x.length !== n) || n < 2) return { ...empty, reason: "items need the same n ≥ 2" };
  const total = Array.from({ length: n }, (_, i) => sum(it.map((x) => x[i])));
  const vT = describe(total).variance;
  const vI = it.map((x) => describe(x).variance);
  if (!vT) return { ...empty, total, itemVariances: vI, totalVariance: vT, reason: "the total score has zero variance" };
  const alpha = (k / (k - 1)) * (1 - sum(vI as number[]) / vT);
  const itemTotal: ItemRow[] = withItemStats
    ? it.map((x, j) => {
        const rest = total.map((tv, i) => tv - x[i]);
        const sub = it.filter((_, m) => m !== j);
        return { item: j, mean: mean(x), sd: vI[j] === null ? null : Math.sqrt(vI[j] as number), corrected: pearson(x, rest).r, alphaIfDeleted: sub.length > 1 ? cronbach(sub, undefined, scaleMin, scaleMax, false).alpha : null };
      })
    : [];
  let s = 0;
  let c = 0;
  for (let a = 0; a < k; a++)
    for (let b = a + 1; b < k; b++) {
      const r = pearson(it[a], it[b]).r;
      if (r !== null) {
        s += r;
        c++;
      }
    }
  const avgR = c ? s / c : null;
  return { alpha, k, n, itemVariances: vI, totalVariance: vT, itemTotal, avgInterItemR: avgR, standardized: avgR === null ? null : (k * avgR) / (1 + (k - 1) * avgR), total, method };
}

/** Upper bound of an observed correlation given two reliabilities: √(r_xx · r_yy). */
export const attenuation = (rxx: number, ryy: number): number | null => (rxx >= 0 && ryy >= 0 ? Math.sqrt(rxx * ryy) : null);

/** Correlation corrected for attenuation: r_xy / √(r_xx · r_yy). */
export const disattenuate = (rxy: number, rxx: number, ryy: number): number | null => (rxx > 0 && ryy > 0 ? rxy / Math.sqrt(rxx * ryy) : null);
