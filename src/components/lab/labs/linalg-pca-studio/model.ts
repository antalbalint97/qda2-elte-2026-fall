// Linear Algebra & PCA Studio model: a seeded 2-D cloud for the probe axis (variance of the projections as a
// function of the angle; its maximum is the first eigenvector of the covariance/correlation matrix), PCA and
// principal-axis factoring of the course item sets, a 2×2 matrix acting on vectors and on the cloud, and
// seeded k-means on three blobs. All linear algebra is in src/lib/engine/linalg.ts.
import { covMatrix, eigenSym, kmeans, paf, pca, varianceAlongAngle, type Matrix } from "@/lib/engine/linalg";
import { sum } from "@/lib/engine/numeric";
import { gaussian, mulberry32 } from "@/lib/engine/rng";
import { itemSet, keyed, type ItemSet } from "../measurement-index-lab/model";

export const DEG = Math.PI / 180;

/** n = 60 points, x = 1.3·a, y = 0.8·(ρa + √(1−ρ²)b) with a, b ~ N(0, 1) (as the prototype). */
export function makeCloud(seed: number, rho: number, n = 60): { xs: number[]; ys: number[] } {
  const z = gaussian(mulberry32(seed));
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = 0; i < n; i++) {
    const a = z();
    const b = z();
    xs.push(a * 1.3);
    ys.push((rho * a + Math.sqrt(1 - rho * rho) * b) * 0.8);
  }
  return { xs, ys };
}

export interface Probe {
  /** The analysed (centred or standardised) coordinates. */
  xs: number[];
  ys: number[];
  S: Matrix;
  values: number[];
  vectors: number[][];
  /** Angle of PC1 in [0°, 180°). */
  pc1Deg: number;
  varAlong: number;
  /** Projections onto the probe direction. */
  proj: number[];
  /** Covariance of the PC1 and PC2 scores (0 up to rounding). */
  covScores: number;
}
const axisDeg = (v: readonly number[]) => (((Math.atan2(v[1], v[0]) / DEG) % 180) + 180) % 180;

export function probe(cloud: { xs: number[]; ys: number[] }, standardize: boolean, thetaDeg: number): Probe | null {
  const mx = sum(cloud.xs) / cloud.xs.length;
  const my = sum(cloud.ys) / cloud.ys.length;
  const cm = covMatrix(standardize ? [cloud.xs, cloud.ys] : [cloud.xs.map((v) => v - mx), cloud.ys.map((v) => v - my)], standardize);
  if (!cm) return null;
  const [xs, ys] = cm.X;
  const e = eigenSym(cm.S);
  const u = [Math.cos(thetaDeg * DEG), Math.sin(thetaDeg * DEG)];
  const proj = xs.map((x, i) => x * u[0] + ys[i] * u[1]);
  const s1 = xs.map((x, i) => x * e.vectors[0][0] + ys[i] * e.vectors[0][1]);
  const s2 = xs.map((x, i) => x * e.vectors[1][0] + ys[i] * e.vectors[1][1]);
  const covScores = sum(s1.map((v, i) => v * s2[i])) / (xs.length - 1);
  return { xs, ys, S: cm.S, values: e.values, vectors: e.vectors, pc1Deg: axisDeg(e.vectors[0]), varAlong: varianceAlongAngle(xs, ys, thetaDeg * DEG) ?? 0, proj, covScores };
}

/** Variance along the probe for θ = 0°, 2°, …, 180°. */
export const varianceCurve = (xs: number[], ys: number[]) => Array.from({ length: 91 }, (_, i) => ({ deg: 2 * i, v: varianceAlongAngle(xs, ys, 2 * i * DEG) ?? 0 }));

/** Smallest angular distance between two axis directions (mod 180°). */
export function axisGap(a: number, b: number): number {
  const d = Math.abs((((a - b) % 180) + 180) % 180);
  return Math.min(d, 180 - d);
}

/** The item matrix for the items view: all items of the set, optionally reverse-keyed. */
export function itemCols(set: ItemSet, reverseKeyed: boolean) {
  const it = itemSet(set);
  const { cols } = keyed(it, it.names, reverseKeyed ? it.negative : []);
  return { names: it.names, labels: it.labels, negative: it.negative, cols };
}

export function itemAnalysis(set: ItemSet, reverseKeyed: boolean, standardize: boolean, nf: number) {
  const ic = itemCols(set, reverseKeyed);
  const pc = pca(ic.cols, standardize);
  const R = covMatrix(ic.cols, true)?.S ?? null;
  const fa = R ? paf(R, Math.min(nf, ic.cols.length - 1)) : null;
  return { ...ic, pc, R, fa };
}

export type Mat2 = [[number, number], [number, number]];
export interface Mat2Info {
  det: number;
  trace: number;
  /** Real eigenpairs (empty when the eigenvalues are complex). */
  eig: { value: number; vector: [number, number] }[];
  symmetric: boolean;
}
/** Eigen-analysis of a general 2×2 matrix: λ = tr/2 ± √(tr²/4 − det). */
export function mat2Info(A: Mat2): Mat2Info {
  const [[a, b], [c, d]] = A;
  const tr = a + d;
  const det = a * d - b * c;
  const disc = (tr * tr) / 4 - det;
  const eig: Mat2Info["eig"] = [];
  if (Math.abs(b) < 1e-12 && Math.abs(c) < 1e-12) {
    // diagonal: the axes are eigenvectors
    const pairs: Mat2Info["eig"] = [
      { value: a, vector: [1, 0] },
      { value: d, vector: [0, 1] },
    ];
    eig.push(...pairs.sort((p, q) => q.value - p.value));
  } else if (disc >= -1e-12) {
    const s = Math.sqrt(Math.max(0, disc));
    for (const l of s > 1e-9 ? [tr / 2 + s, tr / 2 - s] : [tr / 2]) {
      let v: [number, number] = Math.abs(b) > 1e-12 ? [b, l - a] : [l - d, c];
      const nv = Math.hypot(v[0], v[1]);
      v = [v[0] / nv, v[1] / nv];
      if (v[0] < 0 || (v[0] === 0 && v[1] < 0)) v = [-v[0], -v[1]];
      eig.push({ value: l, vector: v });
    }
  }
  return { det, trace: tr, eig, symmetric: Math.abs(b - c) < 1e-12 };
}
export const apply2 = (A: Mat2, v: readonly number[]): [number, number] => [A[0][0] * v[0] + A[0][1] * v[1], A[1][0] * v[0] + A[1][1] * v[1]];

/** Three seeded Gaussian blobs (30 points each) for k-means. */
export function makeBlobs(seed: number): number[][] {
  const z = gaussian(mulberry32(seed + 7));
  const centres = [
    [-1.6, -0.8],
    [1.4, -1.1],
    [0.2, 1.5],
  ];
  return centres.flatMap((c) => Array.from({ length: 30 }, () => [c[0] + 0.55 * z(), c[1] + 0.55 * z()]));
}
export const runKmeans = (points: number[][], k: number, seed: number) => kmeans(points, k, seed, 100);
