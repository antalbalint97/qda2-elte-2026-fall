// Survey design: synthetic finite populations, selection mechanisms (SRS, stratified, cluster, two-stage),
// response mechanisms and allocation arithmetic. Pure and seeded.
import { clamp, mean, sum } from "./numeric";
import { gaussian, mulberry32, sampleIndices, type Rand } from "./rng";

export interface PopGroup {
  id: string;
  label: string;
  share: number;
  mu: number;
  sd: number;
}
export interface PopulationSpec {
  N: number;
  groups: PopGroup[];
  /** Number of PSUs (clusters). */
  clusters?: number;
  /** Intra-cluster correlation of the outcome within groups, in [0, 1). */
  icc?: number;
  /** Frame coverage per group id (share of the group listed in the frame). */
  frame?: Record<string, number>;
  seed: number;
}
export interface Unit {
  id: number;
  g: string;
  gi: number;
  /** Cluster (PSU) index. */
  c: number;
  /** Binary auxiliary variable (e.g. gender) used for raking. */
  x: 0 | 1;
  y: number;
  inFrame: boolean;
}
export interface Population {
  spec: PopulationSpec;
  units: Unit[];
  N: number;
  K: number;
  truth: number;
  frame: Unit[];
  frameN: number;
  frameMean: number | null;
  groupN: Record<string, number>;
  groupMean: Record<string, number>;
  xN: [number, number];
}

export function makePopulation(spec: PopulationSpec): Population {
  const rand = mulberry32(spec.seed);
  const z = gaussian(rand);
  const N = spec.N;
  const K = spec.clusters || 20;
  const icc = clamp(spec.icc || 0, 0, 0.95);
  const units: Unit[] = [];
  const cEff = Array.from({ length: K }, () => z());
  let id = 0;
  spec.groups.forEach((gr, gi) => {
    const ng = Math.round(N * gr.share);
    for (let k = 0; k < ng; k++) {
      const c = Math.floor(rand() * K);
      const sdC = gr.sd * Math.sqrt(icc);
      const sdE = gr.sd * Math.sqrt(1 - icc);
      const y = clamp(gr.mu + sdC * cEff[c] + sdE * z(), 0, 100);
      const cov = spec.frame && spec.frame[gr.id] !== undefined ? spec.frame[gr.id] : 1;
      units.push({ id: id++, g: gr.id, gi, c, x: rand() < 0.5 ? 0 : 1, y: Math.round(y * 10) / 10, inFrame: rand() < cov });
    }
  });
  while (units.length > N) units.pop();
  const frame = units.filter((u) => u.inFrame);
  const byG: Record<string, Unit[]> = {};
  units.forEach((u) => (byG[u.g] = byG[u.g] || []).push(u));
  return {
    spec,
    units,
    N: units.length,
    K,
    truth: mean(units.map((u) => u.y)) as number,
    frame,
    frameN: frame.length,
    frameMean: mean(frame.map((u) => u.y)),
    groupN: Object.fromEntries(Object.entries(byG).map(([k, v]) => [k, v.length])),
    groupMean: Object.fromEntries(Object.entries(byG).map(([k, v]) => [k, mean(v.map((u) => u.y)) as number])),
    xN: [units.filter((u) => u.x === 0).length, units.filter((u) => u.x === 1).length],
  };
}

export type DesignType = "srs" | "strat" | "cluster" | "twostage";
export interface Design {
  type: DesignType;
  n: number;
  allocation?: "prop" | "equal" | "custom";
  nh?: Record<string, number>;
  /** Number of PSUs selected (cluster / two-stage). */
  a?: number;
  /** Units per selected PSU (two-stage). */
  m?: number;
}
export interface Selected {
  unit: Unit;
  id: number;
  y: number;
  g: string;
  x: 0 | 1;
  pi: number;
  d: number;
  stratum: string;
  psu: number;
}
export interface Selection {
  sample: Selected[];
  info: {
    frameN: number;
    method: string;
    pi?: number;
    Nh?: Record<string, number>;
    nh?: Record<string, number>;
    A?: number;
    a?: number;
    psus?: number[];
  };
  design: Design;
}

/** Draws one sample from the frame. Inclusion probabilities are exact for every supported design. */
export function select(pop: Population, design: Design, rand: Rand): Selection {
  const frame = pop.frame;
  const out: Omit<Selected, "d" | "id" | "y" | "g" | "x">[] = [];
  const info: Selection["info"] = { frameN: frame.length, method: "" };
  if (design.type === "srs") {
    const n = Math.min(design.n, frame.length);
    sampleIndices(frame.length, n, rand).forEach((i) => out.push({ unit: frame[i], pi: n / frame.length, stratum: "all", psu: frame[i].id }));
    info.pi = n / frame.length;
    info.method = "SRSWOR, π = n/N_frame";
  } else if (design.type === "strat") {
    const byG: Record<string, Unit[]> = {};
    frame.forEach((u) => (byG[u.g] = byG[u.g] || []).push(u));
    const gs = Object.keys(byG);
    const Nh = Object.fromEntries(gs.map((k) => [k, byG[k].length]));
    const nh: Record<string, number> = {};
    if (design.allocation === "equal") gs.forEach((k) => (nh[k] = Math.round(design.n / gs.length)));
    else if (design.allocation === "custom" && design.nh) gs.forEach((k) => (nh[k] = design.nh?.[k] || 0));
    else gs.forEach((k) => (nh[k] = Math.round((design.n * Nh[k]) / frame.length)));
    gs.forEach((k) => {
      nh[k] = Math.max(0, Math.min(nh[k], Nh[k]));
      sampleIndices(Nh[k], nh[k], rand).forEach((i) => out.push({ unit: byG[k][i], pi: nh[k] / Nh[k], stratum: k, psu: byG[k][i].id }));
    });
    info.Nh = Nh;
    info.nh = nh;
    info.method = "stratified SRSWOR, π_h = n_h/N_h";
  } else {
    const byC: Record<number, Unit[]> = {};
    frame.forEach((u) => (byC[u.c] = byC[u.c] || []).push(u));
    const cs = Object.keys(byC).map(Number);
    const A = cs.length;
    const a = Math.min(design.a || 6, A);
    const pick = sampleIndices(A, a, rand).map((i) => cs[i]);
    pick.forEach((c) => {
      const us = byC[c];
      const M = us.length;
      if (design.type === "cluster") us.forEach((u) => out.push({ unit: u, pi: a / A, stratum: "all", psu: c }));
      else {
        const m = Math.min(design.m || 10, M);
        sampleIndices(M, m, rand).forEach((i) => out.push({ unit: us[i], pi: (a / A) * (m / M), stratum: "all", psu: c }));
      }
    });
    info.A = A;
    info.a = a;
    info.psus = pick;
    info.method = design.type === "cluster" ? "one-stage cluster SRS of PSUs, π = a/A" : "two-stage: SRS of a PSUs, then m of M_i units, π = (a/A)(m/M_i)";
  }
  const sample = out.map((s) => ({ ...s, d: 1 / s.pi, id: s.unit.id, y: s.unit.y, g: s.unit.g, x: s.unit.x }));
  return { sample, info, design };
}

export type ResponseType = "none" | "mcar" | "group" | "outcome";
export interface ResponseMechanism {
  type: ResponseType;
  rate: number;
  groupRates?: Record<string, number>;
  slope?: number;
}
export type Responded = Selected & { r: boolean; pResp: number };

/** Applies a response mechanism: MCAR, group-dependent (MAR given group) or outcome-dependent (MNAR). */
export function respond(sample: readonly Selected[], mech: ResponseMechanism, rand: Rand): Responded[] {
  return sample.map((s) => {
    let p = 1;
    if (mech.type === "mcar") p = mech.rate;
    else if (mech.type === "group") p = mech.groupRates?.[s.g] ?? mech.rate;
    else if (mech.type === "outcome") {
      const z = (s.y - 50) / 25;
      const rate = clamp(mech.rate, 1e-6, 1 - 1e-6);
      p = 1 / (1 + Math.exp(-(Math.log(rate / (1 - rate)) + (mech.slope ?? 1) * z)));
    }
    return { ...s, r: rand() < p, pResp: p };
  });
}

// ── allocation arithmetic (Survey Design Studio) ────────────────────────────
/** Neyman allocation n_h ∝ N_h S_h (unrounded). */
export function neyman(Nh: readonly number[], Sh: readonly number[], n: number): number[] {
  const num = Nh.map((N, h) => N * Sh[h]);
  const D = sum(num);
  return num.map((v) => (D ? (n * v) / D : n / Nh.length));
}
/** Proportional allocation n_h = n N_h / N (unrounded). */
export const proportional = (Nh: readonly number[], n: number): number[] => {
  const N = sum(Nh);
  return Nh.map((v) => (n * v) / N);
};
/** Var(ȳ_st) = Σ (N_h/N)² (1 − n_h/N_h) S_h²/n_h; strata with n_h = 0 make the variance undefined. */
export function stratMeanVar(Nh: readonly number[], Sh: readonly number[], nh: readonly number[]): number | null {
  const N = sum(Nh);
  if (nh.some((v) => !(v > 0))) return null;
  return sum(Nh.map((Nhh, h) => (Nhh / N) ** 2 * (1 - nh[h] / Nhh) * (Sh[h] ** 2 / nh[h])));
}
/** Largest-remainder rounding of allocations to integers that sum to round(Σ). */
export function roundAllocation(x: readonly number[]): number[] {
  const target = Math.round(sum(x));
  const fl = x.map(Math.floor);
  let rest = target - sum(fl);
  const order = x.map((v, i) => [v - Math.floor(v), i] as const).sort((a, b) => b[0] - a[0]);
  for (const [, i] of order) {
    if (rest <= 0) break;
    fl[i]++;
    rest--;
  }
  return fl;
}

/**
 * Inclusion probabilities π_k = n x_k/Σx for PPS without replacement, with units at π ≥ 1 set to 1 and the
 * rest recomputed iteratively (R sampling::inclusionprobabilities).
 */
export function ppsInclusion(x: readonly number[], n: number): number[] | null {
  if (x.some((v) => !(v >= 0)) || !(sum(x) > 0) || n > x.filter((v) => v > 0).length) return null;
  let pik = x.map((v) => (n * v) / sum(x));
  for (let it = 0; it < 100; it++) {
    const over = pik.map((p) => p >= 1);
    if (!over.some(Boolean)) break;
    const nOver = over.filter(Boolean).length;
    const S = sum(x.map((v, i) => (over[i] ? 0 : v)));
    pik = pik.map((p, i) => (over[i] ? 1 : ((n - nOver) * x[i]) / S));
  }
  return pik.map((p) => Math.min(1, p));
}

/**
 * Systematic PPS selection (Madow) with given inclusion probabilities: a random start in [0, 1) and unit
 * steps through the cumulated π. Units with π = 1 are always selected.
 */
export function systematicPps(pik: readonly number[], rand: Rand): number[] {
  const u = rand();
  const out: number[] = [];
  let cum = 0;
  for (let k = 0; k < pik.length; k++) {
    const prev = cum;
    cum += pik[k];
    // selected when an integer + u falls into (prev, cum]
    if (Math.floor(cum - u) > Math.floor(prev - u) || pik[k] >= 1 - 1e-12) out.push(k);
  }
  return [...new Set(out)];
}
