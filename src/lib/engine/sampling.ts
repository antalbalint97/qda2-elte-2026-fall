// Finite-population sampling simulation (Sampling Universe, CI Explorer). Seeded and deterministic.
import { describe as describeFull, histogram as histFull, median } from "./descriptives";
import { clamp, mean, ssAround } from "./numeric";
import { normalQuantile, tCritical } from "./distributions";
import { gaussian, rng, sampleIndices, type Rand } from "./rng";

export type PopulationShape = "normal" | "skewed" | "bimodal" | "binary";
export const POPULATION_SHAPES: PopulationShape[] = ["normal", "skewed", "bimodal", "binary"];

/** A finite population on a 0–100 scale (binary → 0/1, π = 0.32). Known data-generating process, seeded. */
export function makePopulation(shape: PopulationShape, N: number, seed: number): number[] {
  const r = rng(seed);
  const z = gaussian(r);
  const out = new Array<number>(N);
  for (let i = 0; i < N; i++) {
    let v: number;
    if (shape === "normal") v = 50 + 12 * z();
    else if (shape === "skewed") v = 20 + 14 * Math.exp(0.55 * z());
    else if (shape === "bimodal") v = (r() < 0.55 ? 34 : 68) + 7 * z();
    else v = r() < 0.32 ? 1 : 0;
    out[i] = shape === "binary" ? v : Math.round(clamp(v, 0, 100) * 10) / 10;
  }
  return out;
}

export interface PopParams {
  N: number;
  mu: number;
  /** Population variance with divisor N. */
  sigma2: number;
  sigma: number;
}
export function popParams(pop: readonly number[]): PopParams {
  const mu = mean(pop) as number;
  const sigma2 = ssAround(pop, mu) / pop.length;
  return { N: pop.length, mu, sigma2, sigma: Math.sqrt(sigma2) };
}

/** Simple random sample without replacement (indices). */
export const srs = (N: number, n: number, rand: Rand): number[] => sampleIndices(N, n, rand);

export type SampleStatistic = "mean" | "proportion" | "median" | "var_n" | "var_n1";
export function statistic(kind: SampleStatistic, xs: readonly number[]): number | null {
  const n = xs.length;
  if (!n) return null;
  const m = mean(xs) as number;
  if (kind === "mean" || kind === "proportion") return m;
  if (kind === "median") return median(xs);
  if (kind === "var_n") return ssAround(xs, m) / n;
  if (kind === "var_n1") return n > 1 ? ssAround(xs, m) / (n - 1) : null;
  return null;
}

/** SE of the sample mean under SRSWOR: √(σ²/n · (N − n)/(N − 1)). */
export function theorySE(p: PopParams, n: number): number {
  const fpc = p.N > 1 ? (p.N - n) / (p.N - 1) : 1;
  return Math.sqrt((p.sigma2 / n) * fpc);
}

export function describe(xs: readonly number[]): { n: number; mean: number | null; sd: number | null } {
  const d = describeFull(xs);
  return { n: d.n, mean: d.mean, sd: d.sd };
}

/** Fixed-range histogram with values outside the range clamped to the end bins. */
export function histogram(xs: readonly number[], lo: number, hi: number, bins: number) {
  const counts = new Array<number>(bins).fill(0);
  const w = (hi - lo) / bins;
  for (const x of xs) {
    let b = Math.floor((x - lo) / w);
    if (b < 0) b = 0;
    if (b >= bins) b = bins - 1;
    counts[b]++;
  }
  return { counts, lo, hi, w };
}
export { histFull };

/** B bootstrap replicates of a statistic (resampling with replacement). */
export function bootstrap(xs: readonly number[], B: number, rand: Rand, kind: SampleStatistic): (number | null)[] {
  const out: (number | null)[] = [];
  const n = xs.length;
  for (let b = 0; b < B; b++) {
    const s = new Array<number>(n);
    for (let i = 0; i < n; i++) s[i] = xs[Math.floor(rand() * n)];
    out.push(statistic(kind, s));
  }
  return out;
}

export interface Draw {
  idx: number[];
  values: number[];
  stat: number | null;
  mean: number | null;
  sd: number | null;
}
/** One SRS from the population with its statistic, mean and SD. */
export function drawSample(pop: readonly number[], n: number, kind: SampleStatistic, rand: Rand): Draw {
  const idx = srs(pop.length, n, rand);
  const values = idx.map((i) => pop[i]);
  const d = describe(values);
  return { idx, values, stat: statistic(kind, values), mean: d.mean, sd: d.sd };
}

// ── Confidence intervals under SRS and a two-stage cluster design (CI Explorer) ──

/** A population with K clusters: unit i belongs to cluster i mod K; non-binary values get a cluster effect. */
export interface ClusteredPopulation {
  y: number[];
  cluster: number[];
  K: number;
  mu: number;
  sigma: number;
}

/**
 * The CI Explorer population: `makePopulation` plus a normal cluster effect (SD `effectSd`, seeded with
 * seed + 99) added to every unit of a cluster and clamped to 0–100. Binary populations get no effect.
 */
export function makeClusteredPopulation(shape: PopulationShape, N: number, seed: number, K = 50, effectSd = 8): ClusteredPopulation {
  const base = makePopulation(shape, N, seed);
  const z = gaussian(rng(seed + 99));
  const eff = Array.from({ length: K }, () => z() * (shape === "binary" ? 0 : effectSd));
  const cluster = base.map((_, i) => i % K);
  const y = base.map((v, i) => (shape === "binary" ? v : clamp(v + eff[cluster[i]], 0, 100)));
  const p = popParams(y);
  return { y, cluster, K, mu: p.mu, sigma: p.sigma };
}

export type CiMethod = "t" | "z" | "wald" | "wilson";
export type CiDesign = "srs" | "cluster";
export interface CiOptions {
  n: number;
  level: number;
  method: CiMethod;
  design: CiDesign;
  /** Units drawn per selected cluster (cluster design). */
  perCluster?: number;
  /** Treat the 0/1 population as a proportion (enables Wald / Wilson). */
  binary?: boolean;
}
export interface CiResult {
  lo: number;
  hi: number;
  mean: number;
  se: number;
  /** Naive SRS t interval that ignores the clustering (cluster design only). */
  naive: { lo: number; hi: number } | null;
  covers: boolean;
  naiveCovers: boolean | null;
  method: "t" | "z" | "wald" | "wilson" | "cluster-t";
  /** Number of clusters a (cluster design) or null. */
  clusters: number | null;
}

/** Wilson score interval for a proportion. */
export function wilsonInterval(p: number, n: number, z: number): { lo: number; hi: number } {
  const den = 1 + (z * z) / n;
  const c = (p + (z * z) / (2 * n)) / den;
  const hw = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / den;
  return { lo: c - hw, hi: c + hw };
}

/** Memoised two-sided critical values (tCritical bisects, so cache per df and α). */
function criticalCache() {
  const m = new Map<string, number>();
  return {
    t(df: number, alpha: number) {
      const k = df + "|" + alpha;
      let v = m.get(k);
      if (v === undefined) m.set(k, (v = tCritical(df, alpha)));
      return v;
    },
    z(alpha: number) {
      const k = "z|" + alpha;
      let v = m.get(k);
      if (v === undefined) m.set(k, (v = normalQuantile(1 - alpha / 2)));
      return v;
    },
  };
}
type Crit = ReturnType<typeof criticalCache>;

/**
 * One sample and its interval. SRS: n units without replacement. Cluster: a = max(2, round(n/m)) clusters
 * by SRS, then m units by SRS within each; the design-based interval uses the SD of the a cluster means
 * with t(a − 1) (ultimate-cluster approximation, f ignored), and the naive interval treats the units as
 * an SRS. Returns null when the SE is undefined (all values equal).
 */
export function ciInterval(P: ClusteredPopulation, o: CiOptions, rand: Rand, crit: Crit = criticalCache()): CiResult | null {
  const N = P.y.length;
  const alpha = 1 - o.level;
  const ys: number[] = [];
  const psu: number[] = [];
  if (o.design === "srs") {
    for (const i of srs(N, o.n, rand)) ys.push(P.y[i]);
  } else {
    const m = o.perCluster ?? 10;
    const a = Math.max(2, Math.round(o.n / m));
    for (const c of srs(P.K, Math.min(a, P.K), rand)) {
      const members: number[] = [];
      for (let i = c; i < N; i += P.K) members.push(i);
      for (const j of srs(members.length, Math.min(m, members.length), rand)) {
        ys.push(P.y[members[j]]);
        psu.push(c);
      }
    }
  }
  const nn = ys.length;
  const m = mean(ys) as number;
  const covers = (lo: number, hi: number) => lo <= P.mu && P.mu <= hi;
  if (o.binary && o.method !== "t") {
    const z = crit.z(alpha);
    const se = Math.sqrt((m * (1 - m)) / nn);
    const iv = o.method === "wilson" ? wilsonInterval(m, nn, z) : { lo: m - z * se, hi: m + z * se };
    return { ...iv, mean: m, se, naive: null, covers: covers(iv.lo, iv.hi), naiveCovers: null, method: o.method === "wilson" ? "wilson" : "wald", clusters: null };
  }
  if (nn < 2) return null;
  const s = Math.sqrt(ssAround(ys, m) / (nn - 1));
  // a sample with no spread (e.g. all 0 or all 1 from a binary population) gives a zero-width interval; it is
  // kept, not dropped, so coverage is not conditioned on positive sample variance
  const seSrs = s / Math.sqrt(nn);
  if (o.design === "cluster") {
    const byC = new Map<number, number[]>();
    ys.forEach((y, i) => {
      const arr = byC.get(psu[i]);
      if (arr) arr.push(y);
      else byC.set(psu[i], [y]);
    });
    const means = [...byC.values()].map((v) => mean(v) as number);
    const a = means.length;
    const mc = mean(means) as number;
    const sc = Math.sqrt(ssAround(means, mc) / (a - 1));
    const se = sc / Math.sqrt(a);
    const tc = crit.t(a - 1, alpha);
    const tn = crit.t(nn - 1, alpha);
    const naive = { lo: m - tn * seSrs, hi: m + tn * seSrs };
    const lo = m - tc * se;
    const hi = m + tc * se;
    return { lo, hi, mean: m, se, naive, covers: covers(lo, hi), naiveCovers: covers(naive.lo, naive.hi), method: "cluster-t", clusters: a };
  }
  const c = o.method === "z" ? crit.z(alpha) : crit.t(nn - 1, alpha);
  const lo = m - c * seSrs;
  const hi = m + c * seSrs;
  return { lo, hi, mean: m, se: seSrs, naive: null, covers: covers(lo, hi), naiveCovers: null, method: o.method === "z" ? "z" : "t", clusters: null };
}

export interface CoverageRun {
  count: number;
  cover: number;
  naive: number | null;
}
/** Repeats `ciInterval` `reps` times and counts how often μ is covered. */
export function coverageSimulation(P: ClusteredPopulation, o: CiOptions, reps: number, rand: Rand): CoverageRun {
  const crit = criticalCache();
  let count = 0;
  let cover = 0;
  let naive = 0;
  let hasNaive = false;
  for (let i = 0; i < reps; i++) {
    const x = ciInterval(P, o, rand, crit);
    if (!x) continue;
    count++;
    if (x.covers) cover++;
    if (x.naiveCovers !== null) {
      hasNaive = true;
      if (x.naiveCovers) naive++;
    }
  }
  return { count, cover, naive: hasNaive ? naive : null };
}
export { criticalCache };

/**
 * Expected half-width of the interval before sampling (σ known): SRS crit·σ/√n; cluster design
 * t(a − 1)·√((S²_B + S̄²_W/m)/a), with S²_B the variance of the K population cluster means and S̄²_W the
 * mean within-cluster variance (with-replacement approximation, no finite-population correction).
 */
export function expectedHalfWidth(P: ClusteredPopulation, o: CiOptions): number {
  const alpha = 1 - o.level;
  if (o.design === "srs") {
    const c = o.method === "t" ? tCritical(o.n - 1, alpha) : normalQuantile(1 - alpha / 2);
    return (c * P.sigma) / Math.sqrt(o.n);
  }
  const m = o.perCluster ?? 10;
  const a = Math.max(2, Math.round(o.n / m));
  const groups: number[][] = Array.from({ length: P.K }, () => []);
  P.y.forEach((v, i) => groups[P.cluster[i]].push(v));
  const cm = groups.map((g) => mean(g) as number);
  const gm = mean(cm) as number;
  const sb2 = ssAround(cm, gm) / (P.K - 1);
  const sw2 = groups.reduce((s, g, k) => s + ssAround(g, cm[k]) / Math.max(1, g.length - 1), 0) / P.K;
  return tCritical(a - 1, alpha) * Math.sqrt((sb2 + sw2 / m) / a);
}
