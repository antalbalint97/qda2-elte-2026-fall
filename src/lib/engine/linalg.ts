// Small dense linear algebra for teaching-sized problems (p ≤ ~20). Singular input → null.
import { covariance, describe, zscores } from "./descriptives";
import { mean, sum } from "./numeric";
import { rng } from "./rng";

export type Matrix = number[][];
export type Vector = number[];

export const transpose = (A: Matrix): Matrix => (A.length ? A[0].map((_, j) => A.map((r) => r[j])) : []);
export const matmul = (A: Matrix, B: Matrix): Matrix => A.map((r) => B[0].map((_, j) => r.reduce((s, v, k) => s + v * B[k][j], 0)));
export const identity = (n: number): Matrix => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (__, j) => (i === j ? 1 : 0)));

/** Gauss–Jordan inverse with partial pivoting; null when (numerically) singular. */
export function inverse(A: Matrix, tol = 1e-12): Matrix | null {
  const n = A.length;
  if (!n || A.some((r) => r.length !== n)) return null;
  const scale = Math.max(1, ...A.flat().map(Math.abs));
  const M = A.map((r, i) => [...r, ...identity(n)[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    if (Math.abs(M[p][c]) < tol * scale) return null;
    [M[c], M[p]] = [M[p], M[c]];
    const d = M[c][c];
    for (let j = 0; j < 2 * n; j++) M[c][j] /= d;
    for (let r = 0; r < n; r++)
      if (r !== c) {
        const f = M[r][c];
        if (f !== 0) for (let j = 0; j < 2 * n; j++) M[r][j] -= f * M[c][j];
      }
  }
  return M.map((r) => r.slice(n));
}

/** Determinant by LU elimination. */
export function determinant(A: Matrix): number {
  const n = A.length;
  const M = A.map((r) => r.slice());
  let det = 1;
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    if (M[p][c] === 0) return 0;
    if (p !== c) {
      [M[c], M[p]] = [M[p], M[c]];
      det = -det;
    }
    det *= M[c][c];
    for (let r = c + 1; r < n; r++) {
      const f = M[r][c] / M[c][c];
      for (let j = c; j < n; j++) M[r][j] -= f * M[c][j];
    }
  }
  return det;
}

export const dot = (a: Vector, b: Vector): number => sum(a.map((v, i) => v * b[i]));
export const norm = (a: Vector): number => Math.sqrt(dot(a, a));
/** Orthogonal projection of a onto b; null when b = 0. */
export const project = (a: Vector, b: Vector): Vector | null => {
  const nb = dot(b, b);
  return nb ? b.map((v) => (v * dot(a, b)) / nb) : null;
};
export const applyMatrix = (M: Matrix, v: Vector): Vector => M.map((r) => dot(r, v));

export interface Eigen {
  values: number[];
  /** Unit eigenvectors, one array per eigenvalue (same order), sign fixed so the largest |component| is positive. */
  vectors: Vector[];
  converged: boolean;
  method: string;
}

/** Cyclic Jacobi eigen-decomposition of a symmetric matrix; eigenvalues in decreasing order. */
export function eigenSym(Ain: Matrix): Eigen {
  const n = Ain.length;
  const A = Ain.map((r) => r.slice());
  const V = identity(n);
  let converged = false;
  for (let sweep = 0; sweep < 100; sweep++) {
    let off = 0;
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) off += A[p][q] ** 2;
    if (off < 1e-24) {
      converged = true;
      break;
    }
    for (let p = 0; p < n; p++)
      for (let q = p + 1; q < n; q++) {
        if (Math.abs(A[p][q]) < 1e-300) continue;
        const th = (A[q][q] - A[p][p]) / (2 * A[p][q]);
        const t = Math.sign(th || 1) / (Math.abs(th) + Math.sqrt(th * th + 1));
        const c = 1 / Math.sqrt(t * t + 1);
        const s = t * c;
        for (let k = 0; k < n; k++) {
          const akp = A[k][p];
          const akq = A[k][q];
          A[k][p] = c * akp - s * akq;
          A[k][q] = s * akp + c * akq;
        }
        for (let k = 0; k < n; k++) {
          const apk = A[p][k];
          const aqk = A[q][k];
          A[p][k] = c * apk - s * aqk;
          A[q][k] = s * apk + c * aqk;
        }
        for (let k = 0; k < n; k++) {
          const vkp = V[k][p];
          const vkq = V[k][q];
          V[k][p] = c * vkp - s * vkq;
          V[k][q] = s * vkp + c * vkq;
        }
      }
  }
  const order = A.map((_, i) => i).sort((a, b) => A[b][b] - A[a][a]);
  const vectors = order.map((i) => V.map((r) => r[i])).map((v) => {
    let big = 0;
    for (let k = 1; k < v.length; k++) if (Math.abs(v[k]) > Math.abs(v[big]) + 1e-12) big = k;
    return v[big] < 0 ? v.map((x) => -x) : v;
  });
  return { values: order.map((i) => A[i][i]), vectors, converged, method: "cyclic Jacobi rotations" };
}

/** Covariance (or, with standardize, correlation) matrix of variables given as columns. */
export function covMatrix(cols: number[][], standardize: boolean): { X: number[][]; S: Matrix } | null {
  const X = standardize ? cols.map((c) => zscores(c)) : cols;
  if (X.some((c) => c === null)) return null;
  const Xs = X as number[][];
  const S = Xs.map((a) => Xs.map((b) => covariance(a, b) as number));
  return { X: Xs, S };
}

export interface Pca {
  eigenvalues: number[];
  vectors: Vector[];
  /** Loadings = eigenvector · √eigenvalue (correlations of variables with components when standardised). */
  loadings: Vector[];
  explained: number[];
  cumulative: number[];
  /** Component scores, one row per observation. */
  scores: number[][];
  S: Matrix;
  method: string;
}

/** Principal components of variables given as columns (centred; standardised to the correlation matrix by default). */
export function pca(cols: number[][], standardize = true): Pca | null {
  if (cols.length < 2 || cols[0].length < 3) return null;
  const cm = covMatrix(standardize ? cols : cols.map((c) => {
    const m = mean(c) as number;
    return c.map((v) => v - m);
  }), standardize);
  if (!cm) return null;
  const { X, S } = cm;
  const e = eigenSym(S);
  const tot = sum(e.values);
  if (!(tot > 0)) return null;
  const n = X[0].length;
  const scores = Array.from({ length: n }, (_, i) => e.vectors.map((v) => sum(v.map((l, j) => l * X[j][i]))));
  return {
    eigenvalues: e.values,
    vectors: e.vectors,
    loadings: e.vectors.map((v, k) => v.map((l) => l * Math.sqrt(Math.max(0, e.values[k])))),
    explained: e.values.map((v) => v / tot),
    cumulative: e.values.map((_, k) => sum(e.values.slice(0, k + 1)) / tot),
    scores,
    S,
    method: standardize ? "PCA on the correlation matrix (Jacobi eigen)" : "PCA on the covariance matrix (Jacobi eigen)",
  };
}

/** Sample variance of the projections of (x, y) onto the unit vector at angle θ. */
export function varianceAlongAngle(xs: number[], ys: number[], theta: number): number | null {
  const u = [Math.cos(theta), Math.sin(theta)];
  return describe(xs.map((x, i) => x * u[0] + ys[i] * u[1])).variance;
}

export interface KMeans {
  centroids: number[][];
  assign: number[];
  sswHistory: number[];
  /** Every Lloyd step: the centroids used for the assignment, the assignment and its SSW. */
  steps: { centroids: number[][]; assign: number[]; ssw: number }[];
  /** True when some step left a cluster without members (its centroid is then kept, not re-seeded). */
  emptyCluster: boolean;
  ssw: number;
  iterations: number;
  converged: boolean;
}
/** Lloyd's k-means with seeded k-means++-free random initialisation (distinct points). */
export function kmeans(points: number[][], k: number, seed: number, maxIt = 50): KMeans | null {
  if (k < 1 || points.length < k) return null;
  const r = rng(seed);
  const pickIdx: number[] = [];
  while (pickIdx.length < k) {
    const i = Math.floor(r() * points.length);
    if (!pickIdx.includes(i)) pickIdx.push(i);
  }
  let cent = pickIdx.map((i) => points[i].slice());
  let assign: number[] = [];
  const hist: number[] = [];
  const steps: KMeans["steps"] = [];
  let emptyCluster = false;
  let converged = false;
  let it = 0;
  for (; it < maxIt; it++) {
    assign = points.map((p) => {
      let best = 0;
      let bd = Infinity;
      cent.forEach((c, j) => {
        const d = sum(p.map((v, m) => (v - c[m]) ** 2));
        if (d < bd) {
          bd = d;
          best = j;
        }
      });
      return best;
    });
    hist.push(sum(points.map((p, i) => sum(p.map((v, m) => (v - cent[assign[i]][m]) ** 2)))));
    steps.push({ centroids: cent.map((c) => c.slice()), assign: assign.slice(), ssw: hist[hist.length - 1] });
    const nc = cent.map((c, j) => {
      const mem = points.filter((_, i) => assign[i] === j);
      if (!mem.length) emptyCluster = true;
      return mem.length ? c.map((_, m) => mean(mem.map((p) => p[m])) as number) : c;
    });
    const same = nc.every((c, j) => c.every((v, m) => Math.abs(v - cent[j][m]) < 1e-12));
    cent = nc;
    if (same) {
      converged = true;
      break;
    }
  }
  return { centroids: cent, assign, sswHistory: hist, steps, emptyCluster, ssw: hist[hist.length - 1], iterations: it + 1, converged };
}

export interface Paf {
  /** Loadings, one array per factor (unrotated), sign fixed so the largest |loading| is positive. */
  loadings: Vector[];
  communalities: number[];
  uniqueness: number[];
  /** Eigenvalues of the final reduced correlation matrix (communalities on the diagonal). */
  reducedEigenvalues: number[];
  iterations: number;
  converged: boolean;
  /** A communality reached 1 or more (Heywood case): the solution is not admissible. */
  heywood: boolean;
  method: string;
}
/**
 * Principal-axis factoring of a correlation matrix: start from squared multiple correlations, put the
 * communalities on the diagonal, take the first `nf` eigenpairs, recompute the communalities and repeat
 * until they change by less than `tol` (at most `maxIt` iterations). No rotation. Null when p < 2 or nf ≥ p.
 */
export function paf(R: Matrix, nf: number, maxIt = 100, tol = 1e-6): Paf | null {
  const p = R.length;
  if (p < 2 || nf < 1 || nf >= p) return null;
  const inv = inverse(R);
  let h = R.map((r, i) => (inv ? 1 - 1 / inv[i][i] : Math.max(...r.filter((_, j) => j !== i).map(Math.abs))));
  let e = eigenSym(R);
  let converged = false;
  let it = 0;
  while (it < maxIt) {
    it++;
    e = eigenSym(R.map((r, i) => r.map((v, j) => (i === j ? h[i] : v))));
    const L = e.vectors.slice(0, nf).map((v, k) => v.map((x) => x * Math.sqrt(Math.max(0, e.values[k]))));
    const hn = R.map((_, i) => sum(L.map((l) => l[i] ** 2)));
    const d = Math.max(...hn.map((v, i) => Math.abs(v - h[i])));
    h = hn;
    if (d < tol) {
      converged = true;
      break;
    }
  }
  const reduced = eigenSym(R.map((r, i) => r.map((v, j) => (i === j ? h[i] : v))));
  const loadings = reduced.vectors.slice(0, nf).map((v, k) => v.map((x) => x * Math.sqrt(Math.max(0, reduced.values[k]))));
  const comm = R.map((_, i) => sum(loadings.map((l) => l[i] ** 2)));
  return {
    loadings,
    communalities: comm,
    uniqueness: comm.map((c) => 1 - c),
    reducedEigenvalues: reduced.values,
    iterations: it,
    converged,
    heywood: comm.some((c) => c >= 1),
    method: "principal-axis factoring (iterated communalities from SMC, unrotated)",
  };
}
