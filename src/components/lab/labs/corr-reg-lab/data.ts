// Seeded synthetic scatter data for the Correlation & Regression Lab (ported from the V3 prototype).
import { gaussian, mulberry32 } from "@/lib/engine/rng";

export type CrPreset = "linear" | "weak" | "outlier" | "curve" | "groups";
/** [x, y, group]: x on 0…14 in steps of 0.5, y on 0…100 (integer), group 0/1. */
export type Pt = [number, number, number];

export function generatePoints(seed: number, preset: CrPreset): Pt[] {
  const r = mulberry32(seed);
  const z = gaussian(r);
  const n = preset === "groups" ? 24 : 20;
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const x = Math.round((1 + 13 * r()) * 2) / 2;
    const g = i % 2;
    const y =
      preset === "linear"
        ? 25 + 4.5 * x + 9 * z()
        : preset === "weak"
          ? 50 + 1.2 * x + 16 * z()
          : preset === "outlier"
            ? 30 + 3.5 * x + 6 * z()
            : preset === "curve"
              ? 20 + 16 * x - 1.05 * x * x + 6 * z()
              : 22 + 3.2 * x + 18 * g + 7 * z();
    pts.push([x, Math.round(Math.max(0, Math.min(100, y))), g]);
  }
  if (preset === "outlier") pts[0] = [13.5, 12, 0];
  return pts;
}

export const clampPt = (x: number, y: number, g: number): Pt => [Math.min(14, Math.max(0, Math.round(x * 2) / 2)), Math.min(100, Math.max(0, Math.round(y))), g ? 1 : 0];
