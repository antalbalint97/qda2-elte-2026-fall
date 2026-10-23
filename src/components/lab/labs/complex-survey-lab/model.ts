// Complex Survey Inference Lab model: a seeded population of H strata × 40 PSUs, a stratified two-stage
// sample (a PSUs per stratum, then 8 units per PSU), and the estimators the lab compares: naive s/√n,
// Taylor linearisation, JK1 / JKn / BRR replicate weights, domain means, Rao–Scott tests and survey-weighted
// regression. All design-based results are checked against R survey (tests/unit/complex-survey.test.ts).
import { mean, sum } from "@/lib/engine/numeric";
import { gaussian, mulberry32, sampleIndices, type Rand } from "@/lib/engine/rng";
import { replicateVar, replicateWeights, svyDomainMean, svyMean, type ReplicateWeights, type SurveyObs } from "@/lib/engine/survey-estimators";

export const GROUPS = ["A", "B", "C"] as const;
export const PSUS_PER_STRATUM = 40;
export const M_TAKE = 8;
export type VarMethod = "taylor" | "jk1" | "jkn" | "brr";

export interface CsUnit {
  h: number;
  psu: number;
  group: (typeof GROUPS)[number];
  x: number;
  y: number;
  agree: 0 | 1;
}
export interface CsPopulation {
  H: number;
  psus: { h: number; id: number; units: CsUnit[] }[];
  N: number;
  truth: number;
  truthGroup: Record<string, number>;
}

const r1 = (v: number) => Math.round(v * 10) / 10;
/** H strata of 40 PSUs (30–60 units each); y depends on stratum, PSU (ICC), x and group; agree depends on y and group. */
export function makeCsPopulation(H: number, seed: number): CsPopulation {
  const rand = mulberry32(seed);
  const z = gaussian(rand);
  const psus: CsPopulation["psus"] = [];
  for (let h = 0; h < H; h++) {
    const shift = H > 1 ? 8 * (h / (H - 1) - 0.5) : 0;
    const pC = 0.15 + (0.3 * h) / Math.max(1, H - 1);
    for (let j = 0; j < PSUS_PER_STRATUM; j++) {
      const id = h * 100 + j + 1;
      const M = 30 + Math.floor(rand() * 31);
      const u = 4 * z();
      const units: CsUnit[] = [];
      for (let k = 0; k < M; k++) {
        const a = rand();
        const group = a < pC ? "C" : a < pC + 0.4 ? "B" : "A";
        const x = r1(Math.min(10, Math.max(0, 5 + 2 * z())));
        const y = r1(50 + shift + u + 2.5 * (x - 5) + (group === "B" ? 3 : group === "C" ? -4 : 0) + 8 * z());
        const eta = -0.3 + 0.06 * (y - 50) + (group === "C" ? 0.5 : 0);
        units.push({ h, psu: id, group, x, y, agree: rand() < 1 / (1 + Math.exp(-eta)) ? 1 : 0 });
      }
      psus.push({ h, id, units });
    }
  }
  const all = psus.flatMap((p) => p.units);
  return {
    H,
    psus,
    N: all.length,
    truth: mean(all.map((u) => u.y)) as number,
    truthGroup: Object.fromEntries(GROUPS.map((g) => [g, mean(all.filter((u) => u.group === g).map((u) => u.y)) as number])),
  };
}

export type CsObs = SurveyObs & { stratum: string; psu: number; fpc: number; group: string; x: number; agree: 0 | 1; h: number };

/** Stratified two-stage sample: SRS of a PSUs per stratum, then SRS of 8 units; w = (A/a)(M_i/m). fpc = A (PSUs in the stratum). */
export function drawSample(pop: CsPopulation, a: number, rand: Rand): CsObs[] {
  const out: CsObs[] = [];
  for (let h = 0; h < pop.H; h++) {
    const ps = pop.psus.filter((p) => p.h === h);
    sampleIndices(ps.length, a, rand).forEach((i) => {
      const p = ps[i];
      const M = p.units.length;
      sampleIndices(M, M_TAKE, rand).forEach((k) => {
        const u = p.units[k];
        out.push({ y: u.y, w: (ps.length / a) * (M / M_TAKE), stratum: `S${h + 1}`, psu: p.id, fpc: ps.length, group: u.group, x: u.x, agree: u.agree, h });
      });
    });
  }
  return out;
}

// survey::hadamard(n) for n ≤ 8 (orders 4, 8 and 12), as 0/1 rows.
const HAD: Record<number, string[]> = {
  4: ["1111", "1010", "1100", "1001"],
  8: ["11111111", "10101010", "11001100", "10011001", "11110000", "10100101", "11000011", "10010110"],
  12: ["111111111111", "100100011101", "101000111010", "110001110100", "100011101001", "100111010010", "101110100100", "111101001000", "111010010001", "110100100011", "101001000111", "110010001110"],
};
/** Hadamard matrix used by survey::brrweights for `pairs` strata. */
export const hadamardFor = (pairs: number) => HAD[pairs <= 3 ? 4 : pairs <= 7 ? 8 : 12].map((r) => [...r].map(Number));

/**
 * BRR replicate weights as survey::brrweights (fay.rho = 0) for designs with exactly two PSUs per stratum:
 * strata sorted by name, PSUs in order of appearance; replicate r doubles the first PSU of pair k when
 * H[k + 1, r] = 1 and the second otherwise. Scale 1/R.
 */
export function brrWeights(obs: readonly SurveyObs[]): ReplicateWeights | null {
  const strata = [...new Set(obs.map((o) => String(o.stratum)))].sort();
  const firstPsu = new Map<string, string[]>();
  for (const o of obs) {
    const h = String(o.stratum);
    const list = firstPsu.get(h) ?? [];
    if (!list.includes(String(o.psu))) list.push(String(o.psu));
    firstPsu.set(h, list);
  }
  if (strata.some((h) => firstPsu.get(h)!.length !== 2) || strata.length > 8) return null;
  const Hm = hadamardFor(strata.length);
  const R = Hm[0].length;
  const replicates: number[][] = [];
  for (let r = 0; r < R; r++) {
    replicates.push(
      obs.map((o) => {
        const k = strata.indexOf(String(o.stratum));
        const first = firstPsu.get(String(o.stratum))![0] === String(o.psu);
        const keepFirst = Hm[k + 1][r] === 1;
        return o.w * (first === keepFirst ? 2 : 0);
      }),
    );
  }
  return { replicates, scales: replicates.map(() => 1 / R), method: `BRR (${R} half-sample replicates, survey::brrweights Hadamard matrix)` };
}

export const hajek = (obs: readonly { y: number }[]) => (w: number[]) => {
  const W = sum(w);
  return W > 0 ? sum(w.map((wi, i) => wi * obs[i].y)) / W : null;
};

export function replicateSet(obs: readonly CsObs[], method: Exclude<VarMethod, "taylor">): ReplicateWeights | null {
  return method === "brr" ? brrWeights(obs) : replicateWeights(obs, method);
}

export interface SeSet {
  est: number;
  naive: number | null;
  taylor: number | null;
  replicate: number | null;
  replicateMethod: string;
  deff: number | null;
  df: number;
}
export function seSet(obs: readonly CsObs[], method: VarMethod, fpc: boolean): SeSet {
  const ys = obs.map((o) => o.y);
  const m = mean(ys) as number;
  const naive = ys.length > 1 ? Math.sqrt(sum(ys.map((y) => (y - m) ** 2)) / (ys.length - 1) / ys.length) : null;
  const t = svyMean(obs, { fpc });
  const rm = method === "taylor" ? "jkn" : method;
  const rw = replicateSet(obs, rm);
  const rv = rw ? replicateVar(obs, hajek(obs), rw) : null;
  return { est: t.est as number, naive, taylor: t.se, replicate: rv?.se ?? null, replicateMethod: rw?.method ?? "", deff: t.deff, df: t.df ?? 0 };
}

/** Parses "group=C" or "stratum=2"; anything else falls back to group = C. */
export function parseDomain(s: string, H: number): { key: "group" | "stratum"; value: string; label: string } {
  const m = /^\s*(group|stratum)\s*=\s*([A-Za-z0-9]+)\s*$/.exec(s ?? "");
  if (m && m[1] === "group" && (GROUPS as readonly string[]).includes(m[2].toUpperCase())) return { key: "group", value: m[2].toUpperCase(), label: `group = ${m[2].toUpperCase()}` };
  if (m && m[1] === "stratum") {
    const k = Number(m[2].replace(/^S/i, ""));
    if (Number.isInteger(k) && k >= 1 && k <= H) return { key: "stratum", value: `S${k}`, label: `stratum = S${k}` };
  }
  return { key: "group", value: "C", label: "group = C" };
}

export function domainEstimates(obs: readonly CsObs[], dom: { key: "group" | "stratum"; value: string }, method: VarMethod, fpc: boolean) {
  const inD = (o: CsObs) => (dom.key === "group" ? o.group === dom.value : o.stratum === dom.value);
  const t = svyDomainMean(obs, inD, { fpc });
  const rm = method === "taylor" ? "jkn" : method;
  const rw = replicateSet(obs, rm);
  const est = (w: number[]) => {
    const W = sum(w.map((wi, i) => (inD(obs[i]) ? wi : 0)));
    return W > 0 ? sum(w.map((wi, i) => (inD(obs[i]) ? wi * obs[i].y : 0))) / W : null;
  };
  const rv = rw ? replicateVar(obs, est, rw) : null;
  const sub = obs.filter(inD).map((o) => o.y);
  const ms = mean(sub);
  const naive = sub.length > 1 && ms !== null ? Math.sqrt(sum(sub.map((y) => (y - ms) ** 2)) / (sub.length - 1) / sub.length) : null;
  return { est: t.est, seTaylor: t.se, seRep: rv?.se ?? null, n: sub.length, naiveEst: ms, naiveSe: naive };
}

/** Repeated samples: SD of the Hájek mean (the true SE) and coverage of 95 % intervals (naive normal, design t on PSU − strata df). */
export function coverageSim(pop: CsPopulation, a: number, fpc: boolean, reps: number, seed: number, tCrit: (df: number) => number) {
  const rand = mulberry32(seed);
  const ests: number[] = [];
  let covN = 0;
  let covD = 0;
  for (let r = 0; r < reps; r++) {
    const obs = drawSample(pop, a, rand);
    const t = svyMean(obs, { fpc });
    const ys = obs.map((o) => o.y);
    const m = mean(ys) as number;
    const naive = Math.sqrt(sum(ys.map((y) => (y - m) ** 2)) / (ys.length - 1) / ys.length);
    const est = t.est as number;
    ests.push(est);
    if (Math.abs(m - pop.truth) <= 1.96 * naive) covN++;
    if (t.se !== null && Math.abs(est - pop.truth) <= tCrit(t.df ?? 1) * t.se) covD++;
  }
  const mu = mean(ests) as number;
  return { reps, trueSe: Math.sqrt(sum(ests.map((e) => (e - mu) ** 2)) / (reps - 1)), coverageNaive: covN / reps, coverageDesign: covD / reps };
}

export const MODELS = ["y ~ x", "y ~ x + group", "y ~ group"] as const;
export type Model = (typeof MODELS)[number];
/** Model-matrix columns (without intercept) and names for the regression view. */
export function modelColumns(model: Model) {
  const cols: { name: string; f: (o: CsObs) => number }[] = [];
  if (model.includes("x")) cols.push({ name: "x", f: (o) => o.x });
  if (model.includes("group")) cols.push({ name: "groupB", f: (o) => (o.group === "B" ? 1 : 0) }, { name: "groupC", f: (o) => (o.group === "C" ? 1 : 0) });
  return cols;
}

/** R code reproducing the lab's numbers with the survey package. */
export function rCode(opts: { method: VarMethod; fpc: boolean; domain: { key: string; value: string }; model: Model }) {
  const rep = opts.method === "taylor" ? null : opts.method === "jk1" ? "JK1" : opts.method === "jkn" ? "JKn" : "BRR";
  return [
    "library(survey)",
    'cs <- read.csv("complex_survey_sample.csv")   # downloaded from the lab',
    `des <- svydesign(ids = ~psu, strata = ~stratum, weights = ~w${opts.fpc ? ", fpc = ~fpc" : ""}, data = cs)`,
    "svymean(~y, des, deff = TRUE)",
    ...(rep ? [`rep <- as.svrepdesign(des, type = "${rep}")`, "svymean(~y, rep)"] : []),
    `svymean(~y, subset(des, ${opts.domain.key} == "${opts.domain.value}"))`,
    'svychisq(~group + agree, des, statistic = "Chisq")   # first-order Rao–Scott',
    "svychisq(~group + agree, des)                        # second-order (F), R default",
    `summary(svyglm(${opts.model}, design = des))`,
  ].join("\n");
}

export const sampleCsv = (obs: readonly CsObs[]) => ["stratum,psu,fpc,w,group,x,y,agree", ...obs.map((o) => [o.stratum, o.psu, o.fpc, o.w, o.group, o.x, o.y, o.agree].join(","))].join("\n");
