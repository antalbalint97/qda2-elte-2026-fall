// Calibration estimators (Weighting & Calibration Lab): generalised raking / linear calibration with optional
// bounds on g = w/d (a port of survey:::grake, the algorithm behind survey::calibrate), and the calibration
// variance of a Hájek mean (survey:::svyrecvar for "greg_calibration": influence values are replaced by
// their residuals from a d-weighted regression on the calibration variables). Checked against R survey in
// tests/unit/calibration.test.ts.
import { eigenSym, type Matrix } from "./linalg";
import { sum } from "./numeric";
import { svyTotalVar, type SurveyObs } from "./survey-estimators";

export type CalFun = "linear" | "raking";
export interface CalibrationResult {
  /** Calibrated weights w = d·g (null when the system cannot be solved). */
  w: number[] | null;
  g: number[] | null;
  iterations: number;
  converged: boolean;
  /** Largest |T − Σwx| / (1 + |T|) after every Newton step. */
  log: number[];
  achieved: number;
  negative: number;
  method: string;
}

/** Moore–Penrose inverse of a symmetric matrix (eigenvalues below 256·ε·max|λ| dropped), as MASS::ginv. */
export function ginvSym(A: Matrix): Matrix {
  const e = eigenSym(A);
  const max = Math.max(...e.values.map(Math.abs), 0);
  const tol = 256 * Number.EPSILON * max;
  const n = A.length;
  const out = Array.from({ length: n }, () => new Array<number>(n).fill(0));
  e.values.forEach((l, k) => {
    if (Math.abs(l) <= tol) return;
    const v = e.vectors[k];
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) out[i][j] += (v[i] * v[j]) / l;
  });
  return out;
}

const Fm1 = (cf: CalFun, u: number, L: number, U: number) => (cf === "linear" ? Math.min(Math.max(u, L - 1), U - 1) : Math.min(Math.max(Math.exp(u), L), U) - 1);
const dF = (cf: CalFun, u: number, L: number, U: number) => (u < U - 1 && u > L - 1 ? (cf === "linear" ? 1 : Math.exp(u)) : 0);

/**
 * Calibrates design weights d to population totals T of the model-matrix columns X (include an intercept
 * column for the population size). Newton iterations on g = 1 + F⁻¹(x'η) as survey:::grake, with bounds
 * L ≤ g ≤ U, step halving on non-finite g and the convergence rule max |misfit|/(1 + |T|) < ε.
 */
export function calibrate(d: readonly number[], X: readonly (readonly number[])[], T: readonly number[], opt: { calfun?: CalFun; bounds?: [number, number]; maxIt?: number; eps?: number } = {}): CalibrationResult {
  const cf = opt.calfun ?? "linear";
  const [L, U] = opt.bounds ?? [-Infinity, Infinity];
  const maxIt = opt.maxIt ?? 50;
  const eps = opt.eps ?? 1e-7;
  const q = T.length;
  const n = d.length;
  const sampleTotal = new Array<number>(q).fill(0);
  X.forEach((x, i) => x.forEach((v, a) => (sampleTotal[a] += d[i] * v)));
  let eta = new Array<number>(q).fill(0);
  const xeta = () => X.map((x) => sum(x.map((v, a) => v * eta[a])));
  let u = xeta();
  const misfitOf = (uu: number[]) => T.map((t, a) => t - sampleTotal[a] - sum(X.map((x, i) => x[a] * d[i] * Fm1(cf, uu[i], L, U))));
  const rel = (m: number[]) => Math.max(...m.map((v, a) => Math.abs(v) / (1 + Math.abs(T[a]))));
  const log: number[] = [];
  let iter = 1;
  let converged = false;
  for (;;) {
    const deriv = u.map((v) => dF(cf, v, L, U));
    const Tm = Array.from({ length: q }, () => new Array<number>(q).fill(0));
    for (let i = 0; i < n; i++) for (let a = 0; a < q; a++) for (let b = 0; b < q; b++) Tm[a][b] += X[i][a] * d[i] * deriv[i] * X[i][b];
    const mis = misfitOf(u);
    const Gi = ginvSym(Tm);
    let deta = Gi.map((r) => sum(r.map((v, b) => v * mis[b])));
    eta = eta.map((e, a) => e + deta[a]);
    u = xeta();
    const bad = () => u.some((v) => !Number.isFinite(Fm1(cf, v, L, U)) || !Number.isFinite(dF(cf, v, L, U)));
    while (iter < maxIt && bad()) {
      iter++;
      deta = deta.map((v) => v / 2);
      eta = eta.map((e, a) => e - deta[a]);
      u = xeta();
    }
    const m2 = misfitOf(u);
    const r = rel(m2);
    log.push(r);
    if (r < eps) {
      converged = true;
      break;
    }
    iter++;
    if (iter > maxIt) break;
  }
  const g = u.map((v) => 1 + Fm1(cf, v, L, U));
  const w = g.map((gi, i) => gi * d[i]);
  const ok = w.every(Number.isFinite);
  const bounded = Number.isFinite(L) || Number.isFinite(U);
  return {
    w: ok ? w : null,
    g: ok ? g : null,
    iterations: log.length,
    converged,
    log,
    achieved: log[log.length - 1] ?? NaN,
    negative: ok ? w.filter((v) => v < 0).length : 0,
    method: `${cf === "linear" ? "linear (GREG)" : "raking"} calibration${bounded ? ` with bounds ${L} ≤ w/d ≤ ${U}` : ""}, survey::calibrate(calfun = "${cf}")`,
  };
}

/**
 * Hájek mean of y with calibrated weights w and its linearised SE, as svymean on a survey::calibrate design:
 * the influence values w(y − ȳ)/Σw are replaced by w·e/Σw, where e are the residuals of a d-weighted least
 * squares regression of y − ȳ on the calibration columns X (d = weights before calibration).
 */
export function calibratedMean(obs: readonly (SurveyObs & { d: number })[], X: readonly (readonly number[])[], opt: { fpc?: boolean } = {}) {
  const W = sum(obs.map((o) => o.w));
  const est = sum(obs.map((o) => o.w * o.y)) / W;
  const q = X[0]?.length ?? 0;
  const M = Array.from({ length: q }, () => new Array<number>(q).fill(0));
  const b = new Array<number>(q).fill(0);
  obs.forEach((o, i) => {
    for (let a = 0; a < q; a++) {
      b[a] += o.d * X[i][a] * (o.y - est);
      for (let c = 0; c < q; c++) M[a][c] += o.d * X[i][a] * X[i][c];
    }
  });
  const beta = ginvSym(M).map((r) => sum(r.map((v, c) => v * b[c])));
  const z = obs.map((o, i) => ({ ...o, y: (o.y - est - sum(X[i].map((v, a) => v * beta[a]))) / W }));
  const v = svyTotalVar(z, opt);
  return { est, se: v.se, variance: v.variance, beta, method: "Hájek mean; calibration variance from d-weighted regression residuals (survey::calibrate design); " + v.method };
}
