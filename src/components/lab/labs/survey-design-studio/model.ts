// Survey Sampling Design Studio model: a seeded population of 40 settlements (PSUs) in three settlement
// types, a frame with per-type coverage, and one- or two-stage designs with optional stratification and PPS
// selection of PSUs. Every frame unit gets its exact inclusion probability π_k; samples are drawn with the
// shared engine (sampleIndices, ppsInclusion, systematicPps) and analysed with svyMean / svyDomainMean.
import { mean, sum } from "@/lib/engine/numeric";
import { gaussian, mulberry32, sampleIndices, type Rand } from "@/lib/engine/rng";
import { neyman, ppsInclusion, proportional, roundAllocation, stratMeanVar, systematicPps } from "@/lib/engine/survey-design";
import { svyDomainMean, svyMean, type SurveyObs } from "@/lib/engine/survey-estimators";

export const STRATA = ["bp", "town", "village"] as const;
export type StratumId = (typeof STRATA)[number];
export type Allocation = "proportional" | "neyman" | "equal" | "custom";

interface StratumSpec {
  id: StratumId;
  psus: number;
  /** PSU size range (units). */
  size: [number, number];
  mu: number;
  sd: number;
}
const SPEC: StratumSpec[] = [
  { id: "bp", psus: 6, size: [90, 150], mu: 62, sd: 14 },
  { id: "town", psus: 14, size: [35, 85], mu: 54, sd: 16 },
  { id: "village", psus: 20, size: [10, 40], mu: 46, sd: 13 },
];
export const ICC = 0.15;

export interface DsUnit {
  id: number;
  psu: number;
  h: number;
  y: number;
  /** Uniform draw fixed per unit: the unit is in the frame when u < coverage of its stratum. */
  u: number;
}
export interface DsPsu {
  id: number;
  h: number;
  units: DsUnit[];
}
export interface DsPopulation {
  psus: DsPsu[];
  units: DsUnit[];
  N: number;
  truth: number;
}

/** Population of 40 settlements; y = μ_h + σ_h(√ICC·z_PSU + √(1 − ICC)·z), clamped to 0…100. */
export function makeDsPopulation(seed: number): DsPopulation {
  const rand = mulberry32(seed);
  const z = gaussian(rand);
  const psus: DsPsu[] = [];
  const units: DsUnit[] = [];
  SPEC.forEach((s, h) => {
    for (let j = 0; j < s.psus; j++) {
      const M = s.size[0] + Math.floor(rand() * (s.size[1] - s.size[0] + 1));
      const eff = z();
      const p: DsPsu = { id: psus.length, h, units: [] };
      for (let k = 0; k < M; k++) {
        const y = s.mu + s.sd * (Math.sqrt(ICC) * eff + Math.sqrt(1 - ICC) * z());
        const unit = { id: units.length, psu: p.id, h, y: Math.round(Math.min(100, Math.max(0, y)) * 10) / 10, u: rand() };
        p.units.push(unit);
        units.push(unit);
      }
      psus.push(p);
    }
  });
  return { psus, units, N: units.length, truth: mean(units.map((u) => u.y)) as number };
}

export interface DesignSpec {
  strata: 1 | 3;
  stages: 1 | 2;
  pps: boolean;
  allocation: Allocation;
  /** Target sample size (units). */
  n: number;
  /** Units taken per selected PSU (two-stage). */
  m: number;
  /** Frame coverage per settlement type, in [0.2, 1]. */
  coverage: readonly number[];
  /** Custom n_h (units), one per settlement type. */
  nh: readonly number[];
}

export interface FrameStratum {
  h: number;
  /** Frame units, all and per PSU (PSUs with no frame unit are not in the frame). */
  units: DsUnit[];
  psus: { psu: DsPsu; units: DsUnit[] }[];
  N: number;
  S: number;
  /** Units in the population of this type (coverage denominator). */
  Npop: number;
}

export interface Plan {
  frame: FrameStratum[];
  frameN: number;
  frameMean: number;
  frameS: number;
  /** Strata used by the design: one (all frame units) or the three settlement types. */
  groups: { hs: number[]; N: number; S: number; psus: { psu: DsPsu; units: DsUnit[] }[]; units: DsUnit[] }[];
  /** Units allocated per design stratum (before PSU rounding). */
  nh: number[];
  /** PSUs selected per design stratum (two-stage). */
  ah: number[];
  /** First-stage π per PSU id (two-stage), and π_k per frame unit id. */
  pi1: Map<number, number>;
  pik: Map<number, number>;
  /** Σ π_k over the frame = expected sample size. */
  sumPi: number;
}

const sd = (ys: readonly number[]) => {
  if (ys.length < 2) return 0;
  const m = mean(ys) as number;
  return Math.sqrt(sum(ys.map((y) => (y - m) ** 2)) / (ys.length - 1));
};

export function frameOf(pop: DsPopulation, coverage: readonly number[]): FrameStratum[] {
  return SPEC.map((_, h) => {
    const psus = pop.psus.filter((p) => p.h === h).map((psu) => ({ psu, units: psu.units.filter((u) => u.u < coverage[h]) })).filter((p) => p.units.length > 0);
    const units = psus.flatMap((p) => p.units);
    return { h, units, psus, N: units.length, S: sd(units.map((u) => u.y)), Npop: pop.units.filter((u) => u.h === h).length };
  });
}

/** Allocates n across design strata: proportional, Neyman (n_h ∝ N_h S_h with the frame S_h), equal or custom; each n_h in [2, N_h]. */
export function allocate(Nh: readonly number[], Sh: readonly number[], n: number, how: Allocation, custom: readonly number[]): number[] {
  const raw = how === "neyman" ? neyman(Nh, Sh, n) : how === "equal" ? Nh.map(() => n / Nh.length) : how === "custom" ? Nh.map((_, h) => custom[h] ?? n / Nh.length) : proportional(Nh, n);
  return roundAllocation(raw).map((v, h) => Math.max(Math.min(2, Nh[h]), Math.min(v, Nh[h])));
}

/** Builds the design: allocation, PSU counts and the exact inclusion probability of every frame unit. */
export function plan(pop: DsPopulation, d: DesignSpec): Plan {
  const frame = frameOf(pop, d.coverage);
  const all = frame.flatMap((f) => f.units);
  const groups =
    d.strata === 3
      ? frame.map((f) => ({ hs: [f.h], N: f.N, S: f.S, psus: f.psus, units: f.units }))
      : [{ hs: [0, 1, 2], N: all.length, S: sd(all.map((u) => u.y)), psus: frame.flatMap((f) => f.psus), units: all }];
  const nh = groups.length === 1 ? [Math.max(2, Math.min(d.n, all.length))] : allocate(groups.map((g) => g.N), groups.map((g) => g.S), d.n, d.allocation, d.nh);
  const pi1 = new Map<number, number>();
  const pik = new Map<number, number>();
  const ah: number[] = [];
  groups.forEach((g, gi) => {
    if (d.stages === 1) {
      g.units.forEach((u) => pik.set(u.id, nh[gi] / g.N));
      ah.push(0);
      return;
    }
    const A = g.psus.length;
    const a = Math.max(Math.min(2, A), Math.min(A, Math.round(nh[gi] / d.m)));
    ah.push(a);
    const p1 = d.pps ? (ppsInclusion(g.psus.map((p) => p.units.length), a) ?? g.psus.map(() => a / A)) : g.psus.map(() => a / A);
    g.psus.forEach((p, i) => {
      pi1.set(p.psu.id, p1[i]);
      const M = p.units.length;
      p.units.forEach((u) => pik.set(u.id, p1[i] * (Math.min(d.m, M) / M)));
    });
  });
  return {
    frame,
    frameN: all.length,
    frameMean: (mean(all.map((u) => u.y)) as number) ?? NaN,
    frameS: sd(all.map((u) => u.y)),
    groups,
    nh,
    ah,
    pi1,
    pik,
    sumPi: sum([...pik.values()]),
  };
}

export interface DrawnUnit {
  unit: DsUnit;
  pi: number;
  w: number;
  stratum: string;
  psu: number;
}
export interface Draw {
  sample: DrawnUnit[];
  psus: Set<number>;
}

/** Draws one sample: SRS of units (one stage), or SRS / systematic PPS of PSUs then SRS of m units each. */
export function draw(p: Plan, d: DesignSpec, rand: Rand): Draw {
  const sample: DrawnUnit[] = [];
  const psus = new Set<number>();
  p.groups.forEach((g, gi) => {
    const stratum = d.strata === 3 ? STRATA[g.hs[0]] : "all";
    const add = (u: DsUnit) => {
      const pi = p.pik.get(u.id) as number;
      sample.push({ unit: u, pi, w: 1 / pi, stratum, psu: d.stages === 1 ? u.id : u.psu });
    };
    if (d.stages === 1) {
      sampleIndices(g.N, p.nh[gi], rand).forEach((i) => add(g.units[i]));
      return;
    }
    const a = p.ah[gi];
    const picked = d.pps ? systematicPps(g.psus.map((q) => p.pi1.get(q.psu.id) as number), rand) : sampleIndices(g.psus.length, a, rand);
    picked.forEach((i) => {
      const q = g.psus[i];
      psus.add(q.psu.id);
      sampleIndices(q.units.length, Math.min(d.m, q.units.length), rand).forEach((j) => add(q.units[j]));
    });
  });
  return { sample, psus };
}

/** Observations for svyMean: one-stage samples carry the stratum (or frame) size as fpc. */
export function toObs(p: Plan, d: DesignSpec, dr: Draw): (SurveyObs & { h: number })[] {
  return dr.sample.map((s) => ({
    y: s.unit.y,
    w: s.w,
    stratum: s.stratum,
    psu: s.psu,
    h: s.unit.h,
    fpc: d.stages === 1 ? (d.strata === 3 ? p.groups[s.unit.h].N : p.frameN) : undefined,
  }));
}

export interface Analysis {
  est: number | null;
  se: number | null;
  method: string;
  domains: { est: number | null; se: number | null; n: number }[];
}
/** Hájek mean and linearised SE: with the fpc for one-stage designs (exact SRSWOR / stratified SRSWOR), without for two-stage (ultimate cluster). */
export function analyse(p: Plan, d: DesignSpec, dr: Draw): Analysis {
  const obs = toObs(p, d, dr);
  const fpc = d.stages === 1;
  const m = svyMean(obs, { fpc });
  return {
    est: m.est,
    se: m.se,
    method: m.method,
    domains: [0, 1, 2].map((h) => {
      const r = svyDomainMean(obs, (o) => o.h === h, { fpc });
      return { est: r.est, se: r.se, n: r.n };
    }),
  };
}

/** Exact SE of the estimator for one-stage designs (closed forms on the frame); null for two-stage. */
export function exactSe(p: Plan, d: DesignSpec): number | null {
  if (d.stages === 2) return null;
  const v = stratMeanVar(p.groups.map((g) => g.N), p.groups.map((g) => g.S), p.nh);
  return v === null ? null : Math.sqrt(v);
}

/** Repeated draws: mean and SD of the Hájek estimate (the design SE by simulation) and mean sample size. */
export function simulate(p: Plan, d: DesignSpec, reps: number, seed: number) {
  const rand = mulberry32(seed);
  const ests: number[] = [];
  const ns: number[] = [];
  for (let r = 0; r < reps; r++) {
    const dr = draw(p, d, rand);
    const W = sum(dr.sample.map((s) => s.w));
    if (W > 0) ests.push(sum(dr.sample.map((s) => s.w * s.unit.y)) / W);
    ns.push(dr.sample.length);
  }
  return { mean: mean(ests), se: sd(ests), n: mean(ns), reps: ests.length };
}

/** SE of the SRSWOR mean from the frame at sample size n: √((1 − n/N) S²/n). */
export const srsSe = (p: Plan, n: number) => (n > 0 && n <= p.frameN ? Math.sqrt((1 - n / p.frameN) * (p.frameS ** 2 / n)) : null);
