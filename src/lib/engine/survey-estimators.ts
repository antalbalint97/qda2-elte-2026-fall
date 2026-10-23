// Design-based survey estimation: Horvitz–Thompson and Hájek estimators, weight adjustment
// (post-stratification, raking, linear calibration), Taylor-linearised and replicate variances,
// domain estimation, design effects and Rao–Scott. Every result names its method; undefined → null.
//
// Validation (tests/unit/survey.test.ts, scripts/validation/survey_reference.R): HT/Hájek means,
// linearised variances with and without FPC, JKn, domain variance, post-stratification and GREG
// reproduce R `survey` on fixtures F1–F10 and on a stratified cluster survey (domain means, JKn/JK1,
// Rao–Scott, svyglm, raking and GREG weight vectors); see SURVEY_VALIDATION for what is NOT validated.
import { chiSquare } from "./inference";
import { describe } from "./descriptives";
import { chi2Sf, fP } from "./distributions";
import { inverse, matmul, transpose } from "./linalg";
import { ols, type OlsResult } from "./regression";
import { mean, sum } from "./numeric";
import { mulberry32 } from "./rng";
import { respond, select, type Design, type Population, type Responded, type ResponseMechanism, type Selection } from "./survey-design";

// ── closed forms ────────────────────────────────────────────────────────────
export function weightedMean(ys: readonly number[], ws: readonly number[]): number | null {
  const W = sum(ws);
  return W > 0 ? sum(ys.map((y, i) => y * ws[i])) / W : null;
}
/** SRSWOR: Var(ȳ) = (1 − n/N) s²/n. */
export function srsVarMean(ys: readonly number[], N: number): number | null {
  const v = describe(ys).variance;
  return v === null ? null : ((1 - ys.length / N) * v) / ys.length;
}
/** Stratified SRSWOR: Σ (N_h/N)² (1 − n_h/N_h) s_h²/n_h. */
export function stratVarMean(strata: readonly { ys: readonly number[]; Nh: number }[], N: number): number | null {
  let v = 0;
  for (const h of strata) {
    const s2 = describe(h.ys).variance;
    if (s2 === null) return null;
    v += (h.Nh / N) ** 2 * (1 - h.ys.length / h.Nh) * (s2 / h.ys.length);
  }
  return v;
}
/** One-stage cluster ratio mean: (1 − a/A) s²_e/(a m̄²) with e_i = t_i − ȳ m_i. */
export function clusterVarMean(clusters: readonly { ys: readonly number[] }[], A: number): number | null {
  const a = clusters.length;
  if (a < 2) return null;
  const ms = clusters.map((c) => c.ys.length);
  const ts = clusters.map((c) => sum(c.ys));
  const mbar = mean(ms) as number;
  const ybar = sum(ts) / sum(ms);
  const e = ts.map((t, i) => t - ybar * ms[i]);
  const s2 = describe(e).variance as number;
  return ((1 - a / A) * s2) / (a * mbar * mbar);
}
/** Kish design effect of unequal weights: n Σw²/(Σw)². */
export function kishDeff(ws: readonly number[]): number | null {
  const W = sum(ws);
  return W > 0 ? (ws.length * sum(ws.map((w) => w * w))) / (W * W) : null;
}
/** Kish effective sample size (Σw)²/Σw². */
export function kishNeffW(ws: readonly number[]): number | null {
  const W = sum(ws);
  const W2 = sum(ws.map((w) => w * w));
  return W2 > 0 ? (W * W) / W2 : null;
}
/** Post-stratification of a weight vector: Σw over each class = known population count. */
export function postStratifyWeights(ws: readonly number[], cls: readonly string[], popCounts: Record<string, number>): number[] {
  const tot: Record<string, number> = {};
  ws.forEach((w, i) => (tot[cls[i]] = (tot[cls[i]] || 0) + w));
  return ws.map((w, i) => (tot[cls[i]] > 0 ? (w * popCounts[cls[i]]) / tot[cls[i]] : 0));
}

// ── respondent-level pipeline (Survey Weighting Studio) ──────────────────────
export type WeightedResp = Responded & { w: number };

export function postStratify(resp: readonly WeightedResp[], popCounts: Record<string, number>, key: "g" | "x"): WeightedResp[] {
  const tot: Record<string, number> = {};
  resp.forEach((s) => (tot[String(s[key])] = (tot[String(s[key])] || 0) + s.w));
  return resp.map((s) => ({ ...s, w: tot[String(s[key])] > 0 ? (s.w * popCounts[String(s[key])]) / tot[String(s[key])] : 0 }));
}

export interface RakeResult {
  resp: WeightedResp[];
  iterations: number;
  converged: boolean;
  maxDev: number;
  trace: number[];
}
/** Raking (iterative proportional fitting) to marginal counts. */
export function rake(resp: readonly WeightedResp[], margins: { key: "g" | "x"; counts: Record<string, number> }[], maxIter = 50, tol = 1e-7): RakeResult {
  let cur = resp.map((s) => ({ ...s }));
  let it = 0;
  let maxDev = Infinity;
  const trace: number[] = [];
  while (it < maxIter && maxDev > tol) {
    maxDev = 0;
    for (const m of margins) {
      const tot: Record<string, number> = {};
      cur.forEach((s) => (tot[String(s[m.key])] = (tot[String(s[m.key])] || 0) + s.w));
      cur = cur.map((s) => ({ ...s, w: tot[String(s[m.key])] > 0 ? (s.w * m.counts[String(s[m.key])]) / tot[String(s[m.key])] : 0 }));
    }
    for (const m of margins) {
      const tot: Record<string, number> = {};
      cur.forEach((s) => (tot[String(s[m.key])] = (tot[String(s[m.key])] || 0) + s.w));
      Object.keys(m.counts).forEach((l) => (maxDev = Math.max(maxDev, Math.abs((tot[l] || 0) - m.counts[l]))));
    }
    trace.push(maxDev);
    it++;
  }
  return { resp: cur, iterations: it, converged: maxDev <= tol, maxDev, trace };
}

export interface Estimates {
  n: number;
  unweighted: number | null;
  htTotal: number | null;
  ht: number | null;
  hajek: number | null;
  sumW: number | null;
  N: number;
}
/** Unweighted mean, HT total and mean (÷N) and Hájek mean (÷Σw) of the respondents. */
export function estimates(resp: readonly WeightedResp[], N: number): Estimates {
  const r = resp.filter((s) => s.r !== false);
  const n = r.length;
  if (!n) return { n: 0, unweighted: null, htTotal: null, ht: null, hajek: null, sumW: null, N };
  const W = sum(r.map((s) => s.w));
  const Ty = sum(r.map((s) => s.w * s.y));
  return { n, unweighted: mean(r.map((s) => s.y)), htTotal: Ty, ht: N ? Ty / N : null, hajek: W > 0 ? Ty / W : null, sumW: W, N };
}

export interface VarianceEstimate {
  v: number | null;
  se: number | null;
  method: string;
  degenerate?: boolean;
}
/** Taylor-linearised Hájek mean, with-replacement PSU approximation; = R svymean without fpc. */
export function linearizedVarMean(resp: readonly { y: number; w: number; stratum: string; psu: number | string; r?: boolean }[]): VarianceEstimate {
  const r = resp.filter((s) => s.r !== false);
  const W = sum(r.map((s) => s.w));
  const method = "Taylor-linearised Hájek mean, with-replacement PSU approximation (svydesign without fpc)";
  if (!r.length || W <= 0) return { v: null, se: null, method };
  const yb = sum(r.map((s) => s.w * s.y)) / W;
  const byH: Record<string, Record<string, number>> = {};
  r.forEach((s) => {
    const h = (byH[s.stratum] = byH[s.stratum] || {});
    h[String(s.psu)] = (h[String(s.psu)] || 0) + (s.w * (s.y - yb)) / W;
  });
  let v = 0;
  let degenerate = false;
  for (const h of Object.values(byH)) {
    const U = Object.values(h);
    const a = U.length;
    if (a < 2) {
      degenerate = true;
      continue;
    }
    const ub = mean(U) as number;
    v += (a / (a - 1)) * sum(U.map((x) => (x - ub) ** 2));
  }
  return { v, se: Math.sqrt(v), method, degenerate };
}
/** Naive s²/n that ignores weights, strata and clusters (shown for contrast only). */
export function naiveVar(resp: readonly { y: number; r?: boolean }[]): VarianceEstimate {
  const r = resp.filter((s) => s.r !== false);
  const v = describe(r.map((s) => s.y)).variance;
  return { v: v === null ? null : v / r.length, se: v === null ? null : Math.sqrt(v / r.length), method: "naive s²/n — ignores weights, strata and clusters" };
}
/**
 * Closed-form variance of the mean for the design that produced `sel` (with fpc, on the respondents):
 * SRSWOR (1 − n/N)s²/n, stratified Σ(N_h/N)²(1 − f_h)s_h²/n_h, one-stage cluster (1 − a/A)s²_e/(a m̄²).
 * Two-stage has no closed form here (null). Each equals svymean with a first-stage fpc for that design.
 */
export function closedFormVar(resp: readonly { y: number; stratum: string; psu: number | string; r?: boolean }[], sel: Selection, frameN: number): VarianceEstimate {
  const r = resp.filter((s) => s.r !== false);
  const out = (v: number | null, method: string): VarianceEstimate => ({ v, se: v === null ? null : Math.sqrt(v), method });
  const type = sel.design.type;
  if (type === "srs") return out(r.length > 1 ? srsVarMean(r.map((s) => s.y), frameN) : null, "SRSWOR closed form (1 − n/N)s²/n");
  if (type === "strat" && sel.info.Nh) {
    const Nh = sel.info.Nh;
    const strata = Object.keys(Nh).map((k) => ({ ys: r.filter((s) => s.stratum === k).map((s) => s.y), Nh: Nh[k] }));
    const ok = strata.every((h) => h.ys.length > 1);
    return out(ok ? stratVarMean(strata, frameN) : null, "stratified closed form Σ(N_h/N)²(1 − f_h)s_h²/n_h");
  }
  if (type === "cluster" && sel.info.A) {
    const byC = new Map<string, number[]>();
    r.forEach((s) => {
      const k = String(s.psu);
      const arr = byC.get(k);
      if (arr) arr.push(s.y);
      else byC.set(k, [s.y]);
    });
    return out(clusterVarMean([...byC.values()].map((ys) => ({ ys })), sel.info.A), "one-stage cluster ratio-mean variance (1 − a/A)s²_e/(a·m̄²)");
  }
  return out(null, "no closed form for two-stage; see the linearised estimate");
}

/**
 * Design effect of the Hájek mean as R `svymean(..., deff = )` computes it: V_design / V_SRS with
 * S²_w = n/(n − 1)·Σw(y − ȳ_w)²/Σw (R `svyvar`), N̂ = Σw and
 *   replace = true  (R deff = "replace"): V_SRS = S²_w/n — pairs with the with-replacement (no-fpc) V_design;
 *   replace = false (R deff = TRUE):      V_SRS = (1 − n/N̂)·S²_w/n — pairs with a V_design that has an fpc.
 */
export function designEffect(resp: readonly { y: number; w: number; r?: boolean }[], vDesign: number | null, replace = true): number | null {
  const r = resp.filter((s) => s.r !== false);
  const n = r.length;
  if (n < 2 || vDesign === null) return null;
  const W = sum(r.map((s) => s.w));
  if (!(W > 0)) return null;
  const yb = sum(r.map((s) => s.w * s.y)) / W;
  const S2 = ((sum(r.map((s) => s.w * (s.y - yb) ** 2)) / W) * n) / (n - 1);
  const vsrs = replace ? S2 / n : (S2 * (W - n)) / (W * n);
  return vsrs > 0 ? vDesign / vsrs : null;
}
export const kishNeff = (resp: readonly { w: number; r?: boolean }[]): number | null => kishNeffW(resp.filter((s) => s.r !== false).map((s) => s.w));

export type Adjustment = { type: "none" | "poststrat" | "raking" };
export function applyAdjust(resp: readonly WeightedResp[], adjust: Adjustment | undefined, pop: Population): WeightedResp[] {
  const rr = resp.filter((s) => s.r !== false);
  if (!adjust || adjust.type === "none") return rr;
  if (adjust.type === "poststrat") return postStratify(rr, pop.groupN, "g");
  return rake(rr, [
    { key: "g", counts: pop.groupN },
    { key: "x", counts: { 0: pop.xN[0], 1: pop.xN[1] } },
  ]).resp;
}

export interface RepeatSummary {
  reps: number;
  hajek: ReturnType<typeof describe>;
  unweighted: ReturnType<typeof describe>;
  ht: ReturnType<typeof describe>;
  meanSeLin: number | null;
  values: number[];
  unweightedValues: number[];
  biasHajek: number | null;
  biasUnw: number | null;
  method: string;
}
/** Repeats the whole design → response → adjustment pipeline (Monte-Carlo estimate of the sampling distribution). */
export function repeat(pop: Population, design: Design, mech: ResponseMechanism, adjust: Adjustment, reps: number, seed: number): RepeatSummary {
  const rand = mulberry32(seed);
  const haj: number[] = [];
  const unw: number[] = [];
  const ht: number[] = [];
  const seLin: number[] = [];
  for (let i = 0; i < reps; i++) {
    const sel = select(pop, design, rand);
    let resp: WeightedResp[] = respond(sel.sample, mech, rand).map((s) => ({ ...s, w: s.d }));
    resp = applyAdjust(resp, adjust, pop);
    const e = estimates(resp, pop.N);
    if (e.hajek !== null) {
      haj.push(e.hajek);
      unw.push(e.unweighted as number);
      if (e.ht !== null) ht.push(e.ht);
      const lv = linearizedVarMean(resp);
      if (lv.se !== null && Number.isFinite(lv.se)) seLin.push(lv.se);
    }
  }
  return {
    reps: haj.length,
    hajek: describe(haj),
    unweighted: describe(unw),
    ht: describe(ht),
    meanSeLin: mean(seLin),
    values: haj,
    unweightedValues: unw,
    biasHajek: haj.length ? (mean(haj) as number) - pop.truth : null,
    biasUnw: unw.length ? (mean(unw) as number) - pop.truth : null,
    method: `Monte-Carlo over ${reps} independent samples from the fixed design (simulation estimate, not an analytical value)`,
  };
}

// ── general design-based inference (Complex Survey Lab) ─────────────────────
export interface SurveyObs {
  y: number;
  w: number;
  stratum?: string | number;
  psu: string | number;
  /** Number of PSUs in the stratum (for the first-stage finite population correction). */
  fpc?: number;
}
export interface TotalVar {
  variance: number;
  se: number;
  nPSU: number;
  nStrata: number;
  lonely: number;
  method: string;
}

/** Variance of the HT total Σwy under the stratified ultimate-cluster (with-replacement) approximation; R survey default. */
export function svyTotalVar(obs: readonly SurveyObs[], opt: { fpc?: boolean } = {}): TotalVar {
  const byH = new Map<string, Map<string, SurveyObs[]>>();
  obs.forEach((o) => {
    const hk = String(o.stratum ?? "all");
    if (!byH.has(hk)) byH.set(hk, new Map());
    const h = byH.get(hk) as Map<string, SurveyObs[]>;
    const pk = String(o.psu);
    if (!h.has(pk)) h.set(pk, []);
    (h.get(pk) as SurveyObs[]).push(o);
  });
  let v = 0;
  let nPSU = 0;
  let lonely = 0;
  for (const h of byH.values()) {
    const psus = [...h.values()];
    const nh = psus.length;
    nPSU += nh;
    if (nh < 2) {
      lonely++;
      continue;
    }
    const tot = psus.map((u) => sum(u.map((o) => o.w * o.y)));
    const tbar = mean(tot) as number;
    let f = 1;
    if (opt.fpc) {
      const Nh = psus[0][0].fpc;
      if (Nh) f = 1 - nh / Nh;
    }
    v += f * (nh / (nh - 1)) * sum(tot.map((t) => (t - tbar) ** 2));
  }
  return {
    variance: v,
    se: Math.sqrt(v),
    nPSU,
    nStrata: byH.size,
    lonely,
    method: (opt.fpc ? "stratified ultimate-cluster with FPC (1−n_h/N_h) at the PSU stage" : "stratified ultimate-cluster, with-replacement approximation") + (lonely ? `; ${lonely} single-PSU stratum/strata contribute 0 (R would stop: lonely PSU)` : ""),
  };
}

export interface SvyMean {
  est: number | null;
  se: number | null;
  variance: number | null;
  df: number | null;
  deff: number | null;
  kishNeff: number | null;
  lonely: number;
  nPSU: number;
  nStrata: number;
  method: string;
}
/** Hájek mean with a Taylor-linearised variance: z_i = w_i(y_i − ȳ_w)/Σw treated as a total. */
export function svyMean(obs: readonly SurveyObs[], opt: { fpc?: boolean } = {}): SvyMean {
  const W = sum(obs.map((o) => o.w));
  if (!(W > 0)) return { est: null, se: null, variance: null, df: null, deff: null, kishNeff: null, lonely: 0, nPSU: 0, nStrata: 0, method: "no positive weights" };
  const est = sum(obs.map((o) => o.w * o.y)) / W;
  const v = svyTotalVar(obs.map((o) => ({ ...o, y: (o.y - est) / W })), opt);
  const neffD = kishDeff(obs.map((o) => o.w));
  return {
    est,
    se: v.se,
    variance: v.variance,
    df: v.nPSU - v.nStrata,
    deff: designEffect(obs, v.variance, false),
    kishNeff: neffD ? obs.length / neffD : null,
    lonely: v.lonely,
    nPSU: v.nPSU,
    nStrata: v.nStrata,
    method: "Hájek mean; Taylor linearisation; " + v.method + "; deff as svymean(deff = TRUE)",
  };
}

/** Domain mean: the full design is kept and units outside the domain get zero scores (not subsetting). */
export function svyDomainMean<T extends SurveyObs>(obs: readonly T[], inDomain: (o: T) => boolean, opt: { fpc?: boolean } = {}) {
  const dom = obs.filter(inDomain);
  const W = sum(dom.map((o) => o.w));
  if (!(W > 0)) return { est: null, se: null, n: 0, method: "empty domain", reason: "empty domain" };
  const est = sum(dom.map((o) => o.w * o.y)) / W;
  const v = svyTotalVar(obs.map((o) => ({ ...o, y: inDomain(o) ? (o.y - est) / W : 0 })), opt);
  return { est, se: v.se, n: dom.length, method: "domain mean via zero-outside-domain linearisation; " + v.method };
}

export interface ReplicateWeights {
  replicates: number[][];
  scales: number[];
  method: string;
}
/**
 * Jackknife replicate weights. JK1: delete one PSU at a time ignoring strata, factor n/(n−1), scale (n−1)/n.
 * JKn: delete one PSU within stratum h, factor n_h/(n_h−1) in that stratum only, scale (n_h−1)/n_h.
 */
export function replicateWeights(obs: readonly SurveyObs[], method: "jk1" | "jkn" = "jkn"): ReplicateWeights {
  const sKey = (o: SurveyObs) => (method === "jk1" ? "all" : String(o.stratum ?? "all"));
  const pKey = (o: SurveyObs) => String(o.stratum ?? "all") + "|" + String(o.psu);
  const strata = new Map<string, Set<string>>();
  obs.forEach((o) => {
    if (!strata.has(sKey(o))) strata.set(sKey(o), new Set());
    (strata.get(sKey(o)) as Set<string>).add(pKey(o));
  });
  const replicates: number[][] = [];
  const scales: number[] = [];
  for (const [h, set] of strata) {
    const psus = [...set];
    const nh = psus.length;
    if (nh < 2) continue;
    psus.forEach((dropped) => {
      replicates.push(obs.map((o) => (sKey(o) === h ? (pKey(o) === dropped ? 0 : o.w * (nh / (nh - 1))) : o.w)));
      scales.push((nh - 1) / nh);
    });
  }
  return { replicates, scales, method: method === "jk1" ? "JK1 (delete-one-PSU, no strata)" : "JKn (stratified delete-one-PSU)" };
}
/**
 * Replicate variance Σ_r scale_r (θ_r − c)². As R survey (options survey.replicates.mse = FALSE, the default)
 * the centre c is the mean of the replicate estimates; `mse: true` centres on the full-sample estimate.
 */
export function replicateVar(obs: readonly SurveyObs[], estimator: (w: number[]) => number | null, rw: ReplicateWeights, opt: { mse?: boolean } = {}) {
  const full = estimator(obs.map((o) => o.w));
  if (full === null || !rw.replicates.length) return { est: full, variance: null, se: null, method: rw.method };
  const reps: number[] = [];
  for (const w of rw.replicates) {
    const e = estimator(w);
    if (e === null) return { est: full, variance: null, se: null, method: rw.method + " (a replicate estimate is undefined)" };
    reps.push(e);
  }
  const c = opt.mse ? full : (mean(reps) as number);
  const v = sum(reps.map((e, r) => rw.scales[r] * (e - c) ** 2));
  return { est: full, variance: v, se: Math.sqrt(v), method: rw.method + (opt.mse ? ", centred on the full-sample estimate" : ", centred on the replicate mean (R default)") };
}

/**
 * Covariance matrix of the HT totals of several variables (Y[i] = vector for observation i) under the
 * stratified ultimate-cluster approximation: Σ_h n_h/(n_h−1) Σ_i (t_hi − t̄_h)(t_hi − t̄_h)'.
 */
export function svyTotalCov(obs: readonly SurveyObs[], Y: readonly (readonly number[])[], opt: { fpc?: boolean } = {}): number[][] {
  const q = Y[0]?.length ?? 0;
  const V = Array.from({ length: q }, () => new Array<number>(q).fill(0));
  const byH = new Map<string, Map<string, number[]>>();
  const fpcOf = new Map<string, number | undefined>();
  obs.forEach((o, i) => {
    const hk = String(o.stratum ?? "all");
    if (!byH.has(hk)) byH.set(hk, new Map());
    fpcOf.set(hk, o.fpc);
    const h = byH.get(hk) as Map<string, number[]>;
    const pk = String(o.psu);
    if (!h.has(pk)) h.set(pk, new Array<number>(q).fill(0));
    const t = h.get(pk) as number[];
    for (let a = 0; a < q; a++) t[a] += o.w * Y[i][a];
  });
  for (const [hk, h] of byH) {
    const tots = [...h.values()];
    const nh = tots.length;
    if (nh < 2) continue;
    const tbar = Array.from({ length: q }, (_, a) => sum(tots.map((t) => t[a])) / nh);
    const Nh = fpcOf.get(hk);
    const f = opt.fpc && Nh ? 1 - nh / Nh : 1;
    for (const t of tots) for (let a = 0; a < q; a++) for (let b = 0; b < q; b++) V[a][b] += (f * nh * (t[a] - tbar[a]) * (t[b] - tbar[b])) / (nh - 1);
  }
  return V;
}

/**
 * Rao–Scott tests of independence for a two-way table, following R survey::svychisq exactly:
 * Pearson X² on the weighted table rescaled to n; first-order: p from X²/mean(diag Δ) on (r−1)(c−1) df
 * (statistic = "Chisq"); second-order: F = X²/trace(Δ) on (d₀, d₀·ν) df (statistic = "F", R's default).
 */
export function raoScott<T extends SurveyObs>(obs: readonly T[], rowOf: (o: T) => string, colOf: (o: T) => string, opt: { fpc?: boolean } = {}) {
  const rl = [...new Set(obs.map(rowOf))].sort();
  const cl = [...new Set(obs.map(colOf))].sort();
  const nr = rl.length;
  const nc = cl.length;
  const N = obs.length;
  const method = "Rao–Scott (R survey::svychisq conventions): first-order X²/δ̄ and second-order F";
  if (nr < 2 || nc < 2) return { pearson: null, df: 0, meanDelta: null, chisqP: null, F: null, ndf: null, ddf: null, Fp: null, method, reason: "need at least two levels of each variable" };
  // cell index with rows varying fastest (R interaction() order)
  const cell = (o: T) => rl.indexOf(rowOf(o)) + nr * cl.indexOf(colOf(o));
  const K = nr * nc;
  const W = sum(obs.map((o) => o.w));
  const ind = obs.map((o) => {
    const v = new Array<number>(K).fill(0);
    v[cell(o)] = 1;
    return v;
  });
  const p = Array.from({ length: K }, (_, c) => sum(obs.map((o, i) => o.w * ind[i][c])) / W);
  // weighted table scaled to n, then Pearson X²
  const tab = Array.from({ length: nr }, (_, r) => Array.from({ length: nc }, (__, c) => p[r + nr * c] * N));
  const pear = chiSquare(tab);
  if (pear.chi2 === null) return { pearson: null, df: 0, meanDelta: null, chisqP: null, F: null, ndf: null, ddf: null, Fp: null, method, reason: pear.reason };
  // covariance of the linearised cell proportions
  const lin = obs.map((o, i) => ind[i].map((v, c) => (v - p[c]) / W));
  const V = svyTotalCov(obs, lin, opt);
  // contrast matrix: interaction columns residualised on the main-effects design over the cell grid
  const grid = Array.from({ length: K }, (_, c) => ({ r: c % nr, c: Math.floor(c / nr) }));
  const X1 = grid.map((g) => [1, ...Array.from({ length: nr - 1 }, (_, i) => (g.r === i + 1 ? 1 : 0)), ...Array.from({ length: nc - 1 }, (_, j) => (g.c === j + 1 ? 1 : 0))]);
  const Xint = grid.map((g) => {
    const v: number[] = [];
    for (let j = 1; j < nc; j++) for (let i = 1; i < nr; i++) v.push(g.r === i && g.c === j ? 1 : 0);
    return v;
  });
  const X1t = transpose(X1);
  const P1 = inverse(matmul(X1t, X1));
  if (!P1) return { pearson: pear.chi2, df: pear.df, meanDelta: null, chisqP: null, F: null, ndf: null, ddf: null, Fp: null, method, reason: "singular design over cells" };
  const proj = matmul(X1, matmul(P1, matmul(X1t, Xint)));
  const Cm = Xint.map((r, i) => r.map((v, j) => v - proj[i][j]));
  const iD = p.map((v) => (v === 0 ? 0 : 1 / v));
  const Ct = transpose(Cm);
  const denom = Ct.map((r) => Cm[0].map((_, b) => sum(r.map((v, i) => (v * iD[i] * Cm[i][b]) / N))));
  const DV = V.map((r, i) => r.map((v, j) => iD[i] * v * iD[j]));
  const numr = matmul(matmul(Ct, DV), Cm);
  const dInv = inverse(denom);
  if (!dInv) return { pearson: pear.chi2, df: pear.df, meanDelta: null, chisqP: null, F: null, ndf: null, ddf: null, Fp: null, method, reason: "singular contrast matrix (empty cells)" };
  const Delta = matmul(dInv, numr);
  const tr = sum(Delta.map((r, i) => r[i]));
  const tr2 = sum(matmul(Delta, Delta).map((r, i) => r[i]));
  const df = Delta.length;
  const meanDelta = tr / df;
  const strata = new Set(obs.map((o) => String(o.stratum ?? "all"))).size;
  const psus = new Set(obs.map((o) => String(o.psu))).size;
  const nu = psus - strata;
  const d0 = (tr * tr) / tr2;
  const F = pear.chi2 / tr;
  return { pearson: pear.chi2, df, meanDelta, chisqP: chi2Sf(pear.chi2 / meanDelta, df), F, ndf: d0, ddf: d0 * nu, Fp: nu > 0 ? fP(F, d0, d0 * nu) : null, method };
}

/** Weighted least squares with a design-based sandwich SE (linearised score totals, ultimate-cluster). */
export function svyGlm<T extends SurveyObs>(obs: readonly T[], xOf: (o: T) => number[]): (OlsResult & { seDesign: number[]; tDesign: number[] }) | { coef: null; reason: string } {
  const X = obs.map(xOf);
  const y = obs.map((o) => o.y);
  const w = obs.map((o) => o.w);
  const f = ols(X, y, w, { vif: false });
  if (f.coef === null) return f;
  const Xd = X.map((r) => [1, ...r]);
  const XtW = transpose(Xd).map((col) => col.map((v, i) => v * w[i]));
  const bread = inverse(matmul(XtW, Xd));
  if (!bread) return { coef: null, reason: "singular design" };
  const k = f.coef.length;
  const scores = (a: number) => obs.map((o, i) => ({ ...o, y: Xd[i][a] * f.resid[i] }));
  const V = Array.from({ length: k }, () => new Array<number>(k).fill(0));
  for (let a = 0; a < k; a++)
    for (let b = a; b < k; b++) {
      if (a === b) V[a][a] = svyTotalVar(scores(a)).variance;
      else {
        const plus = svyTotalVar(obs.map((o, i) => ({ ...o, y: (Xd[i][a] + Xd[i][b]) * f.resid[i] }))).variance;
        V[a][b] = V[b][a] = (plus - svyTotalVar(scores(a)).variance - svyTotalVar(scores(b)).variance) / 2;
      }
    }
  const cov = matmul(matmul(bread, V), bread);
  const seDesign = cov.map((r, j) => Math.sqrt(Math.max(0, r[j])));
  return { ...f, seDesign, tDesign: f.coef.map((b, j) => b / seDesign[j]), method: "weighted OLS; design-based sandwich SE (linearised score totals, ultimate-cluster)" };
}

/** Linear (GREG) calibration: w = d(1 + x'λ), λ = (Σ d x x')⁻¹(T − Σ d x). */
export function calibrateLinear(d: readonly number[], xs: readonly (readonly number[])[], T: readonly number[]) {
  const q = T.length;
  const M = Array.from({ length: q }, () => new Array<number>(q).fill(0));
  const tx = new Array<number>(q).fill(0);
  xs.forEach((x, i) => {
    for (let a = 0; a < q; a++) {
      tx[a] += d[i] * x[a];
      for (let b = 0; b < q; b++) M[a][b] += d[i] * x[a] * x[b];
    }
  });
  const inv = inverse(M);
  if (!inv) return { w: null, lambda: null, negative: 0, method: "linear calibration", reason: "singular calibration matrix (collinear auxiliaries)" };
  const lam = inv.map((r) => sum(r.map((v, b) => v * (T[b] - tx[b]))));
  const w = d.map((di, i) => di * (1 + sum(xs[i].map((v, a) => v * lam[a]))));
  return { w, lambda: lam, negative: w.filter((v) => v < 0).length, method: "linear (GREG) calibration, survey::calibrate(calfun = 'linear')" };
}

/**
 * Raking (IPF) to categorical margins with optional truncation of w/d to [lower, upper] after every step.
 * Truncation is NOT the same algorithm as survey::calibrate(bounds =, calfun = "raking"): flagged as unvalidated.
 */
export function rakeBounded(d: readonly number[], cats: readonly Record<string, string | number>[], margins: Record<string, Record<string, number>>, opt: { lower?: number; upper?: number; maxIt?: number; tol?: number } = {}) {
  const L = opt.lower ?? 0;
  const U = opt.upper ?? Infinity;
  const maxIt = opt.maxIt ?? 50;
  const tol = opt.tol ?? 1e-6;
  let w = d.slice();
  const log: number[] = [];
  const dims = Object.keys(margins);
  const bounded = U < Infinity || L > 0;
  for (let it = 0; it < maxIt; it++) {
    for (const dim of dims) {
      const tot: Record<string, number> = {};
      w.forEach((wi, i) => (tot[String(cats[i][dim])] = (tot[String(cats[i][dim])] || 0) + wi));
      w = w.map((wi, i) => {
        const c = String(cats[i][dim]);
        const f = tot[c] ? margins[dim][c] / tot[c] : 1;
        return Math.min(d[i] * U, Math.max(d[i] * L, wi * f));
      });
    }
    let maxDev = 0;
    for (const dim of dims) {
      const tot: Record<string, number> = {};
      w.forEach((wi, i) => (tot[String(cats[i][dim])] = (tot[String(cats[i][dim])] || 0) + wi));
      Object.keys(margins[dim]).forEach((c) => (maxDev = Math.max(maxDev, Math.abs((tot[c] || 0) - margins[dim][c]) / Math.max(1, margins[dim][c]))));
    }
    log.push(maxDev);
    if (maxDev < tol) return { w, iterations: it + 1, converged: true, infeasible: false, log, method: "iterative proportional fitting" + (bounded ? " with truncation bounds" : "") };
  }
  return { w, iterations: maxIt, converged: false, infeasible: bounded, log, method: "raking did not converge within the iteration limit" + (bounded ? " (bounds may make the margins infeasible)" : "") };
}

// ── validation registry (shown in the UI next to each method) ────────────────
export type ValidationState = "validated" | "provisional" | "unvalidated";
export const SURVEY_VALIDATION: Record<string, { state: ValidationState; reference: string; note: string }> = {
  hajekMean: { state: "validated", reference: "R survey svymean (F1a, F2a, F3a)", note: "point estimate" },
  linearizedVar: { state: "validated", reference: "R survey svymean SE without fpc (F1c, F2c, F3b)", note: "with-replacement ultimate-cluster" },
  fpcVar: { state: "validated", reference: "R survey svydesign(fpc =) (F1b, F2b, F3c)", note: "first-stage FPC" },
  jkn: { state: "validated", reference: "R as.svrepdesign(type = 'JKn') (F2e)", note: "linear estimators" },
  domain: { state: "validated", reference: "R svyby (F8)", note: "domain mean SE with fpc" },
  postStratify: { state: "validated", reference: "R postStratify (F5)", note: "weights reproduce class counts" },
  greg: { state: "validated", reference: "R calibrate(calfun = 'linear') (F7, weight vector in survey.test.ts)", note: "linear calibration" },
  raking: { state: "validated", reference: "R rake() run to convergence (weight vector)", note: "unbounded raking" },
  rakingBounded: { state: "unvalidated", reference: "R calibrate(bounds =)", note: "rakeBounded() truncation algorithm differs from survey::calibrate; use calibration.ts calibrate()" },
  calibrateGrake: { state: "validated", reference: "R calibrate(calfun = 'linear' / 'raking', bounds =) on the Weighting & Calibration Lab samples (calibration-reference.json)", note: "calibration.ts calibrate(): port of survey:::grake" },
  calibrationVariance: { state: "validated", reference: "R svymean on postStratify() / calibrate() designs (calibration-reference.json)", note: "calibration.ts calibratedMean(): residual projection, with-replacement SRS of respondents" },
  deff: { state: "validated", reference: "R svymean(deff = \"replace\" / TRUE) on studio samples (studio-reference.json)", note: "designEffect(); with-replacement SRS comparison pairs with the no-fpc SE" },
  closedForms: { state: "validated", reference: "R svymean with first-stage fpc on studio samples", note: "SRSWOR, stratified and one-stage cluster closed forms" },
  adjustedVariance: { state: "unvalidated", reference: "R postStratify() / rake() designs", note: "after post-stratification or raking the SE treats the adjusted weights as fixed design weights; the calibration step is ignored" },
  raoScott: { state: "validated", reference: "R svychisq(statistic = 'Chisq' and 'F')", note: "first- and second-order Rao–Scott" },
  replicate: { state: "validated", reference: "R as.svrepdesign(type = 'JK1' / 'JKn')", note: "Hájek mean, replicate-mean centring" },
  twoStage: { state: "unvalidated", reference: "R svydesign(ids = ~psu + id, fpc = ~A + M)", note: "two-stage variance shown with the ultimate-cluster approximation" },
  svyGlm: { state: "validated", reference: "R svyglm (gaussian)", note: "coefficients and design-based SEs" },
  ppsInclusion: { state: "validated", reference: "sampling::inclusionprobabilities (F10)", note: "inclusion probabilities" },
  ppsVariance: { state: "unvalidated", reference: "—", note: "PPS-WOR design variance (joint π) is not implemented" },
};
