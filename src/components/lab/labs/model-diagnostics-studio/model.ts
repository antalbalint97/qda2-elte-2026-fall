// Model Diagnostics Studio model: four seeded Anscombe-like scenarios (as the prototype) plus a collinear pair,
// point edits, an optional second predictor correlated with x, and the diagnostics of engine ols(): leverage,
// studentised residuals, Cook's D, HC3 and VIF, with the Koenker (studentised) Breusch–Pagan test added here.
import { chi2Sf } from "@/lib/engine/distributions";
import { ols, type OlsResult } from "@/lib/engine/regression";
import { sum } from "@/lib/engine/numeric";
import { gaussian, mulberry32 } from "@/lib/engine/rng";

export type Scenario = "linear" | "curved" | "outlier" | "fan" | "collinear";
export const SCENARIOS: Scenario[] = ["linear", "curved", "outlier", "fan", "collinear"];
export interface Pt {
  x: number;
  y: number;
}
/** Points per scenario (the spec allows up to 40). */
export const N = 40;
/** A moved point: [index, x, y]. */
export type Move = [number, number, number];

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * N points; x spread evenly over [1, 13.5] with seeded jitter (over [1, 10] in the outlier scenario, so the
 * planted point at x = 14 has high leverage), on a half-unit grid; y rounded and clamped to [0, 100].
 */
export function genPoints(seed: number, sc: Scenario): Pt[] {
  const z = gaussian(mulberry32(seed));
  const hi = sc === "outlier" ? 10 : 13.5;
  const pts: Pt[] = [];
  for (let i = 0; i < N; i++) {
    const x = clamp(Math.round((1 + ((hi - 1) * (i + 0.5)) / N + 0.4 * z()) * 2) / 2, 0, 14);
    const e = z();
    const y = sc === "curved" ? 10 + 14 * x - 0.9 * x * x + 4 * e : sc === "outlier" ? 25 + 3.5 * x + 4 * e : sc === "fan" ? 12 + 3.5 * x + (0.3 + 1.4 * x) * e : 20 + 4 * x + 7 * e;
    pts.push({ x, y: Math.round(clamp(y, 0, 100)) });
  }
  if (sc === "outlier") pts[0] = { x: 14, y: 18 };
  return pts;
}
export function applyMoves(pts: readonly Pt[], moves: readonly Move[]): Pt[] {
  const out = pts.map((p) => ({ ...p }));
  for (const [i, x, y] of moves) if (Number.isInteger(i) && i >= 0 && i < out.length) out[i] = { x: clamp(Math.round(x * 2) / 2, 0, 14), y: clamp(Math.round(y), 0, 100) };
  return out;
}

/** x₂ = ρ(x − 7) + √(1 − ρ²)·3.5·z + 7, seeded: corr(x, x₂) ≈ ρ when sd(x) ≈ 3.5. */
export function makeX2(xs: readonly number[], rho: number, seed: number): number[] {
  const z = gaussian(mulberry32(seed + 77));
  return xs.map((x) => rho * (x - 7) + Math.sqrt(1 - rho * rho) * 3.5 * z() + 7);
}

export interface BreuschPagan {
  lm: number;
  df: number;
  p: number;
}
/** Koenker's studentised Breusch–Pagan test: n·R² of e² regressed on the predictors (statsmodels default). */
export function breuschPagan(X: readonly (readonly number[])[], resid: readonly number[]): BreuschPagan | null {
  const e2 = resid.map((e) => e * e);
  const aux = ols(X, e2, undefined, { vif: false });
  if (aux.coef === null || aux.r2 === null) return null;
  const df = X[0].length;
  const lm = resid.length * aux.r2;
  return { lm, df, p: chi2Sf(lm, df) };
}

export interface Diagnosis {
  fit: OlsResult;
  X: number[][];
  bp: BreuschPagan | null;
  /** Leverage cut-off 2k/n and Cook's D cut-off 4/n (conventions). */
  hCut: number;
  dCut: number;
  /** Running mean of the residuals ordered by fitted value (window 7), a stand-in for LOWESS. */
  smooth: { f: number; e: number }[];
}
export function diagnose(pts: readonly Pt[], withX2: boolean, x2: readonly number[]): Diagnosis | { reason: string } {
  const X = pts.map((p, i) => (withX2 ? [p.x, x2[i]] : [p.x]));
  const fit = ols(
    X,
    pts.map((p) => p.y),
  );
  if (fit.coef === null) return { reason: fit.reason };
  const order = fit.fitted.map((_, i) => i).sort((a, b) => fit.fitted[a] - fit.fitted[b]);
  const smooth = order.map((_, j) => {
    const w = order.slice(Math.max(0, j - 3), Math.min(order.length, j + 4));
    return { f: fit.fitted[order[j]], e: sum(w.map((i) => fit.resid[i])) / w.length };
  });
  return { fit, X, bp: breuschPagan(X, fit.resid), hCut: (2 * fit.k) / fit.n, dCut: 4 / fit.n, smooth };
}
