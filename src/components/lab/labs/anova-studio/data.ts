// Seeded synthetic scores for the ANOVA Studio (ported from the V3 prototype, plus repeated-measures and
// interaction presets). Groups are arrays of 7 integer scores on 0…100; for the repeated-measures design
// group j holds condition j and index i is the same subject in every condition.
import { gaussian, mulberry32 } from "@/lib/engine/rng";

export type AnovaPreset = "base" | "null" | "unequal" | "interaction";
export type AnovaDesign = "oneway" | "twoway" | "rm";
export const N_PER_GROUP = 7;
const clamp = (v: number) => Math.round(Math.max(0, Math.min(100, v)));

export function generateGroups(seed: number, k: number, preset: AnovaPreset, design: AnovaDesign): number[][] {
  const z = gaussian(mulberry32(seed));
  const kk = design === "twoway" ? 4 : k;
  // two-way cells in order A1B1, A1B2, A2B1, A2B2
  const mus =
    design === "twoway"
      ? preset === "interaction"
        ? [45, 60, 60, 45]
        : preset === "null"
          ? [55, 55, 55, 55]
          : [45, 52, 58, 65]
      : preset === "null"
        ? [55, 55, 55, 55, 55]
        : preset === "unequal"
          ? [45, 52, 60, 66, 72]
          : [42, 50, 58, 63, 70];
  const sds = preset === "unequal" && design !== "twoway" ? [5, 8, 12, 16, 20] : [10, 10, 10, 10, 10];
  if (design === "rm") {
    // subject effects are shared across conditions; within-subject noise is smaller than between-subject spread
    const subj = Array.from({ length: N_PER_GROUP }, () => 12 * z());
    return Array.from({ length: kk }, (_, j) => subj.map((s) => clamp(mus[j] + s + (sds[j] / 2) * z())));
  }
  return Array.from({ length: kk }, (_, j) => Array.from({ length: N_PER_GROUP }, () => clamp(mus[j] + sds[j] * z())));
}

/** Moves group means apart (sep, in points from the centre group) and scales within-group spread. */
export function transformGroups(groups: readonly (readonly number[])[], sep: number, spread: number): number[][] {
  const k = groups.length;
  return groups.map((g, j) => {
    const m = g.reduce((a, b) => a + b, 0) / (g.length || 1);
    const shift = ((j - (k - 1) / 2) * sep) / Math.max(1, (k - 1) / 2);
    return g.map((v) => clamp(m + (v - m) * spread + shift));
  });
}
