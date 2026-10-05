// Every statistic shown in the Sopranos lab is computed here, from the synthetic dataset.
// scripts/sopranos/verify-app.mjs prints these values; scripts/sopranos/verify.py recomputes them with scipy.

import {
  chiSquareTest,
  correlationP,
  hedgesG,
  independentT,
  leveneTest,
  mean,
  median,
  oneSampleT,
  pairedT,
  pearson,
  sd,
  skewness,
  spearman,
} from "@/lib/stats";
import { EPISODES, type Episode } from "./dataset";

type NumKey = { [K in keyof Episode]: Episode[K] extends number ? K : never }[keyof Episode];

export const N = EPISODES.length;
export const col = (k: NumKey) => EPISODES.map((e) => e[k]);
const where = (pred: (e: Episode) => boolean, k: NumKey) => EPISODES.filter(pred).map((e) => e[k]);

/* ---------- Descriptives ---------- */

export interface Descriptives {
  n: number;
  mean: number;
  median: number;
  min: number;
  max: number;
  sd: number;
  skew: number;
}

export function describe(k: NumKey): Descriptives {
  const xs = col(k);
  return {
    n: xs.length,
    mean: mean(xs),
    median: median(xs),
    min: Math.min(...xs),
    max: Math.max(...xs),
    sd: sd(xs),
    skew: skewness(xs),
  };
}

/** SPSS-style frequency table: value, frequency, percent, cumulative percent. */
export function frequencies(k: NumKey) {
  const xs = col(k);
  const values = [...new Set(xs)].sort((a, b) => a - b);
  let cum = 0;
  return values.map((v) => {
    const f = xs.filter((x) => x === v).length;
    cum += f;
    return { value: v, freq: f, pct: (f / xs.length) * 100, cumPct: (cum / xs.length) * 100 };
  });
}

/* ---------- Crosstabs ---------- */

/** 2 × 2 table with X (rows: 0, 1) and Y (columns: 0, 1). */
export function table2x2(x: NumKey, y: NumKey, subset: (e: Episode) => boolean = () => true): number[][] {
  const rows = EPISODES.filter(subset);
  return [0, 1].map((i) => [0, 1].map((j) => rows.filter((e) => e[x] === i && e[y] === j).length));
}

export const rowPct = (t: number[][]) => t.map((r) => r.map((c) => (c / (r[0] + r[1])) * 100));

export const ZERO_ORDER = table2x2("early_late", "major_violence");
export const ZERO_ORDER_TEST = chiSquareTest(ZERO_ORDER);
export const PARTIAL_NON_FINALE = table2x2("early_late", "major_violence", (e) => e.finale_episode === 0);
export const PARTIAL_FINALE = table2x2("early_late", "major_violence", (e) => e.finale_episode === 1);
export const PARTIAL_NON_FINALE_TEST = chiSquareTest(PARTIAL_NON_FINALE);
export const EARLY_LATE_BY_FINALE = table2x2("early_late", "finale_episode");

/* ---------- Correlation ---------- */

export function correlate(a: NumKey, b: NumKey, xs = col(a), ys = col(b)) {
  const r = pearson(xs, ys);
  const rho = spearman(xs, ys);
  return { r, p: correlationP(r, xs.length), rho, pRho: correlationP(rho, xs.length), n: xs.length };
}

export const RUNTIME_VIOLENCE = correlate("runtime_minutes", "violence_event_count");
export const RUNTIME_FUCK = correlate("runtime_minutes", "fuck_count");

/** Position of the episode in the series (1 … N) against violent events. */
export const SERIES_ORDER = EPISODES.map((_, i) => i + 1);
export const ORDER_VIOLENCE = correlate("season", "violence_event_count", SERIES_ORDER, col("violence_event_count"));
export const SEASON_MEANS = [1, 2, 3, 4, 5, 6].map((s) => mean(where((e) => e.season === s, "violence_event_count")));

/* ---------- t-tests ---------- */

export const BENCHMARK = 50;
export const ONE_SAMPLE = { ...oneSampleT(col("runtime_minutes"), BENCHMARK), m: mean(col("runtime_minutes")), s: sd(col("runtime_minutes")) };

const therapy = where((e) => e.therapy_scene === 1, "violence_event_count");
const noTherapy = where((e) => e.therapy_scene === 0, "violence_event_count");
export const THERAPY_GROUPS = [
  { label: "1 = therapy scene", n: therapy.length, m: mean(therapy), s: sd(therapy) },
  { label: "0 = no therapy scene", n: noTherapy.length, m: mean(noTherapy), s: sd(noTherapy) },
];
export const THERAPY_T = independentT(therapy, noTherapy);
export const THERAPY_LEVENE = leveneTest(therapy, noTherapy);
export const THERAPY_G = hedgesG(therapy, noTherapy);
/** Pooled SD (the standardizer of Cohen's d) and d itself. */
export const THERAPY_SP = Math.sqrt(
  ((therapy.length - 1) * sd(therapy) ** 2 + (noTherapy.length - 1) * sd(noTherapy) ** 2) / (therapy.length + noTherapy.length - 2),
);
export const THERAPY_D = (mean(therapy) - mean(noTherapy)) / THERAPY_SP;
/** The row a student should read, decided by Levene's test. */
export const THERAPY_ROW = THERAPY_LEVENE.p >= 0.05 ? THERAPY_T.equal : THERAPY_T.welch;

export const PAIRED = {
  ...pairedT(col("crime_conflict_count"), col("family_conflict_count")),
  crime: mean(col("crime_conflict_count")),
  family: mean(col("family_conflict_count")),
};

/* ---------- Formatting ---------- */

export const pct = (x: number) => x.toFixed(1) + "%";
export function effectLabel(g: number) {
  const a = Math.abs(g);
  if (a < 0.2) return "negligible";
  if (a < 0.5) return "small";
  if (a < 0.8) return "moderate";
  return "large";
}
export function rLabel(r: number) {
  const a = Math.abs(r);
  if (a < 0.1) return "negligible";
  if (a < 0.3) return "weak";
  if (a < 0.5) return "moderate";
  return "strong";
}
