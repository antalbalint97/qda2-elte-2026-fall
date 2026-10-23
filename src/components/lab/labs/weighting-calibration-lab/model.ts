// Weighting & Calibration Lab model: a seeded population with three auxiliaries (education, region, age) and
// three outcomes that depend on them to different degrees, an SRS of 400 with nonresponse that depends on
// education, region and age (and optionally on the outcome), and four adjustments that are all
// survey::calibrate / postStratify in R: post-stratification on the cells of the categorical auxiliaries
// (age in three groups), raking and linear (GREG) calibration on education, region and age in years, and
// raking with bounds on g = w/d. Variances use calibratedMean (residual projection, as R).
import { calibrate, calibratedMean, ginvSym, type CalibrationResult } from "@/lib/engine/calibration";
import { mean, sum } from "@/lib/engine/numeric";
import { gaussian, mulberry32, sampleIndices, type Rand } from "@/lib/engine/rng";
import { svyMean } from "@/lib/engine/survey-estimators";

export const EDU = ["prim", "sec", "ter"] as const;
export const REG = ["west", "east"] as const;
export const AGEG = ["18-34", "35-54", "55+"] as const;
export const OUTCOMES = ["trust", "online", "life"] as const;
export type Outcome = (typeof OUTCOMES)[number];
export const AUX = ["edu", "region", "age"] as const;
export type Aux = (typeof AUX)[number];
export type Method = "poststrat" | "raking" | "linear" | "bounded";
export const N_POP = 3000;
export const N_SAMPLE = 400;

export interface Person {
  id: number;
  edu: number;
  reg: number;
  age: number;
  ageG: number;
  y: Record<Outcome, number>;
}
export interface CalPopulation {
  people: Person[];
  truth: Record<Outcome, number>;
  eduN: number[];
  regN: number[];
  ageGN: number[];
  ageTotal: number;
}

const r1 = (v: number) => Math.round(v * 10) / 10;
export const ageGroup = (age: number) => (age < 35 ? 0 : age < 55 ? 1 : 2);

/**
 * Education shares .3/.5/.2; P(east) .6/.45/.3 by education; age ~ N(47, 16) in 18…85. Trust depends on
 * education (and a little on region), online hours on age and region, life satisfaction on none of them.
 */
export function makeCalPopulation(seed: number): CalPopulation {
  const rand = mulberry32(seed);
  const z = gaussian(rand);
  const people: Person[] = [];
  for (let i = 0; i < N_POP; i++) {
    const a = rand();
    const edu = a < 0.3 ? 0 : a < 0.8 ? 1 : 2;
    const reg = rand() < [0.6, 0.45, 0.3][edu] ? 1 : 0;
    const age = Math.round(Math.min(85, Math.max(18, 47 - 4 * (edu - 1) + 16 * z())));
    const trust = Math.min(100, Math.max(0, [40, 52, 66][edu] - 3 * reg + 12 * z()));
    const online = Math.max(0, 20 - 0.25 * (age - 47) + edu - 4 * reg + 4 * z());
    const life = Math.min(10, Math.max(0, 6.5 + 0.1 * edu + 1.6 * z()));
    people.push({ id: i, edu, reg, age, ageG: ageGroup(age), y: { trust: r1(trust), online: r1(online), life: r1(life) } });
  }
  const truth = Object.fromEntries(OUTCOMES.map((k) => [k, mean(people.map((p) => p.y[k])) as number])) as Record<Outcome, number>;
  return {
    people,
    truth,
    eduN: [0, 1, 2].map((e) => people.filter((p) => p.edu === e).length),
    regN: [0, 1].map((r) => people.filter((p) => p.reg === r).length),
    ageGN: [0, 1, 2].map((g) => people.filter((p) => p.ageG === g).length),
    ageTotal: sum(people.map((p) => p.age)),
  };
}

export interface Nonresponse {
  /** Response rate by education. */
  rr: readonly number[];
  /** Multiplier of the response rate in the east. */
  east: number;
  /** Response also rises with trust (missing not at random). */
  mnar: boolean;
}
/** Response probability: education rate × east multiplier × an age gradient (0.75 at 18 to 1.25 at 80), clamped to [0.05, 1]. */
export const respProb = (p: Person, nr: Nonresponse) => {
  let pr = nr.rr[p.edu] * (p.reg === 1 ? nr.east : 1) * (0.75 + (0.5 * (p.age - 18)) / 62);
  if (nr.mnar) pr += 0.4 * ((p.y.trust - 50) / 50);
  return Math.min(1, Math.max(0.05, pr));
};

/** SRS of 400 and its respondents; base weight d = N/r (design weight with a uniform nonresponse adjustment). */
export function drawRespondents(pop: CalPopulation, nr: Nonresponse, rand: Rand) {
  const sample = sampleIndices(pop.people.length, N_SAMPLE, rand).map((i) => pop.people[i]);
  const resp = sample.filter((p) => rand() < respProb(p, nr));
  return { sample, resp, d: resp.length ? N_POP / resp.length : 0 };
}

/** Post-stratification cells: all combinations of the chosen categorical auxiliaries (age in three groups). */
export function cellsOf(aux: readonly Aux[]) {
  const dims: { key: "edu" | "reg" | "ageG"; n: number }[] = [];
  if (aux.includes("edu")) dims.push({ key: "edu", n: 3 });
  if (aux.includes("region")) dims.push({ key: "reg", n: 2 });
  if (aux.includes("age")) dims.push({ key: "ageG", n: 3 });
  let cells: number[][] = [[]];
  dims.forEach((dm) => (cells = cells.flatMap((c) => Array.from({ length: dm.n }, (_, v) => [...c, v]))));
  return { dims, cells, of: (p: Person) => cells.findIndex((c) => c.every((v, j) => p[dims[j].key] === v)) };
}

/**
 * Model matrix and population totals: cell dummies (post-stratification) or intercept + education dummies +
 * east + age in years (raking, linear, bounded), as R's model.matrix(~edu + region + age).
 */
export function design(pop: CalPopulation, resp: readonly Person[], aux: readonly Aux[], method: Method) {
  if (method === "poststrat") {
    const { cells, of } = cellsOf(aux);
    const T = cells.map((_, c) => pop.people.filter((p) => of(p) === c).length);
    const X = resp.map((p) => {
      const k = of(p);
      return cells.map((_, c) => (c === k ? 1 : 0));
    });
    return { X, T };
  }
  const useE = aux.includes("edu");
  const useR = aux.includes("region");
  const useA = aux.includes("age");
  const X = resp.map((p) => [1, ...(useE ? [p.edu === 1 ? 1 : 0, p.edu === 2 ? 1 : 0] : []), ...(useR ? [p.reg] : []), ...(useA ? [p.age] : [])]);
  const T = [N_POP, ...(useE ? [pop.eduN[1], pop.eduN[2]] : []), ...(useR ? [pop.regN[1]] : []), ...(useA ? [pop.ageTotal] : [])];
  return { X, T };
}

export interface Adjusted {
  w: number[];
  ok: boolean;
  reason?: "empty" | "singular" | "none";
  iterations: number;
  converged: boolean;
  /** Largest relative margin misfit after each Newton step. */
  log: number[];
  negative: number;
  method: string;
}

/** Applies the adjustment; `step` stops raking / bounded raking after that many Newton steps (null: to convergence, at most 100). */
export function adjust(pop: CalPopulation, resp: readonly Person[], d: number, aux: readonly Aux[], method: Method, bounds: [number, number], step: number | null = null): Adjusted {
  const dv = resp.map(() => d);
  if (!aux.length || !resp.length) return { w: dv, ok: true, reason: "none", iterations: 0, converged: true, log: [], negative: 0, method: "base weights d = N/r (no auxiliaries)" };
  const { X, T } = design(pop, resp, aux, method);
  if (method === "poststrat" && T.some((t, c) => t > 0 && !X.some((x) => x[c] === 1)))
    return { w: dv, ok: false, reason: "empty", iterations: 0, converged: false, log: [], negative: 0, method: "post-stratification impossible: a cell has no respondent" };
  const iterative = method === "raking" || method === "bounded";
  const r: CalibrationResult = calibrate(dv, X, T, {
    calfun: iterative ? "raking" : "linear",
    bounds: method === "bounded" ? bounds : undefined,
    maxIt: iterative && step !== null ? Math.max(1, step) : 100,
    eps: 1e-9,
  });
  return {
    w: r.w ?? dv,
    ok: !!r.w,
    reason: r.w ? undefined : "singular",
    iterations: r.iterations,
    converged: r.converged,
    log: r.log,
    negative: r.negative,
    method: method === "poststrat" ? "post-stratification (survey::postStratify; linear calibration on the cell dummies)" : r.method,
  };
}

export interface OutcomeRow {
  outcome: Outcome;
  truth: number;
  unweighted: number;
  calibrated: number | null;
  model: number | null;
  /** SE treating the final weights as fixed design weights (calibration ignored). */
  seNaive: number | null;
  /** SE of the calibration estimator (residual projection), only after convergence. */
  seCal: number | null;
}

/** Model-based prediction estimator: unweighted OLS of y on X among respondents, applied to the population totals T. */
export function modelBased(X: readonly (readonly number[])[], y: readonly number[], T: readonly number[], N: number) {
  const q = T.length;
  const M = Array.from({ length: q }, () => new Array<number>(q).fill(0));
  const b = new Array<number>(q).fill(0);
  X.forEach((x, i) => {
    for (let a = 0; a < q; a++) {
      b[a] += x[a] * y[i];
      for (let c = 0; c < q; c++) M[a][c] += x[a] * x[c];
    }
  });
  const beta = ginvSym(M).map((r) => sum(r.map((v, c) => v * b[c])));
  return sum(T.map((t, a) => t * beta[a])) / N;
}

export function outcomeRows(pop: CalPopulation, resp: readonly Person[], d: number, aux: readonly Aux[], method: Method, adj: Adjusted): OutcomeRow[] {
  const { X, T } = design(pop, resp, aux, method);
  return OUTCOMES.map((k) => {
    const ys = resp.map((p) => p.y[k]);
    const obs = resp.map((p, i) => ({ y: p.y[k], w: adj.w[i], d, psu: p.id }));
    const naive = adj.ok && resp.length > 1 ? svyMean(obs) : null;
    const cal = adj.ok && adj.converged && aux.length && resp.length > 1 ? calibratedMean(obs, X) : null;
    return {
      outcome: k,
      truth: pop.truth[k],
      unweighted: mean(ys) ?? NaN,
      calibrated: naive?.est ?? null,
      model: aux.length && resp.length ? modelBased(X, ys, T, N_POP) : null,
      seNaive: naive?.se ?? null,
      seCal: cal ? cal.se : !aux.length ? (naive?.se ?? null) : null,
    };
  });
}

/** Repeated samples with the same nonresponse: mean error (bias) and SD of the unweighted and calibrated means per outcome. */
export function biasSim(pop: CalPopulation, nr: Nonresponse, aux: readonly Aux[], method: Method, bounds: [number, number], reps: number, seed: number) {
  const rand = mulberry32(seed);
  const acc = OUTCOMES.map(() => ({ u: [] as number[], c: [] as number[] }));
  let failed = 0;
  for (let r = 0; r < reps; r++) {
    const { resp, d } = drawRespondents(pop, nr, rand);
    const a = adjust(pop, resp, d, aux, method, bounds);
    const ok = a.ok && a.converged;
    if (!ok) failed++;
    OUTCOMES.forEach((k, j) => {
      const ys = resp.map((p) => p.y[k]);
      acc[j].u.push(mean(ys) as number);
      if (ok) acc[j].c.push(sum(ys.map((y, i) => y * a.w[i])) / sum(a.w));
    });
  }
  const sd = (xs: number[]) => {
    const m = mean(xs) as number;
    return xs.length > 1 ? Math.sqrt(sum(xs.map((x) => (x - m) ** 2)) / (xs.length - 1)) : null;
  };
  return {
    reps,
    failed,
    rows: OUTCOMES.map((k, j) => ({
      outcome: k,
      biasU: (mean(acc[j].u) as number) - pop.truth[k],
      biasC: acc[j].c.length ? (mean(acc[j].c) as number) - pop.truth[k] : null,
      sdU: sd(acc[j].u),
      sdC: sd(acc[j].c),
    })),
  };
}
