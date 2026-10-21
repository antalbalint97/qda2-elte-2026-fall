// Teaching data for 09 Building an Index. All answers are synthetic (scripts/indices/generate.py).
import { mean } from "@/lib/stats";
import { RESPONSES } from "./responses";

export { RESPONSES };

export interface Item {
  id: string;
  text: string;
  /** Worded in the opposite direction to the index ("high = more trust"), so it must be reverse-scored. */
  negative: boolean;
  /** What the item really measures, revealed after the student has worked with it. */
  note: string;
}

export const SCALE_LABEL = "1 = strongly disagree … 5 = strongly agree";

export const ITEMS: Item[] = [
  { id: "T1", text: "Scientists mostly act in the public interest.", negative: false, note: "Trust, positive wording." },
  { id: "T2", text: "Published research findings can usually be relied on.", negative: false, note: "Trust, positive wording." },
  { id: "T3", text: "Science creates more problems than it solves.", negative: true, note: "Distrust: high agreement means LOW trust." },
  { id: "T4", text: "In a health crisis I would follow the advice of scientists.", negative: false, note: "Trust, positive wording." },
  { id: "T5", text: "Scientists hide results that are inconvenient for them.", negative: true, note: "Distrust: high agreement means LOW trust." },
  { id: "T6", text: "I enjoy watching documentaries about science.", negative: false, note: "Interest in science, a different concept from trust." },
];

/** Reverse-scoring on a 1–5 scale: 1↔5, 2↔4, 3 stays. */
export const reverse = (v: number) => 6 - v;

/** The responses with the chosen items reverse-scored, restricted to the chosen items. */
export function scoredMatrix(included: boolean[], reversed: boolean[], data: number[][] = RESPONSES): number[][] {
  return data.map((row) => row.flatMap((v, j) => (included[j] ? [reversed[j] ? reverse(v) : v] : [])));
}

/** The final index of the worked example: T1–T5 with T3 and T5 reversed, averaged (T6 dropped). */
export const FINAL_INCLUDED = [true, true, true, true, true, false];
export const CORRECT_REVERSED = ITEMS.map((it) => it.negative);
export const INDEX: number[] = scoredMatrix(FINAL_INCLUDED, CORRECT_REVERSED).map((r) => round2(mean(r)));

export function round2(v: number) {
  return Math.round(v * 100) / 100;
}

export const fmt = (v: number, d = 2) => (Number.isFinite(v) ? v.toFixed(d) : "–");
/** SPSS-style three decimals. */
export const fmt3 = (v: number) => (Number.isFinite(v) ? v.toFixed(3) : "–");

/* ---------------- Categorising the index ---------------- */

export type CutMethod = "absolute" | "relative" | "percentile";

export interface Cuts {
  /** Upper limit (inclusive) of category 1 and of category 2. */
  upper: [number, number];
  labels: [string, string, string];
}

/** Fixed limits from the meaning of the 1–5 scale: the middle third around the neutral answer 3. */
export const ABSOLUTE: Cuts = {
  upper: [2.49, 3.5],
  labels: ["Low trust (mostly disagrees)", "Mixed (around the neutral 3)", "High trust (mostly agrees)"],
};

/** Mean ± h, with the mean rounded to one decimal as in the course example. */
export function relativeCuts(values: number[], h: number): Cuts {
  const m = Math.round(mean(values) * 10) / 10;
  return {
    upper: [round2(m - h - 0.01), round2(m + h)],
    labels: ["Below the sample average", `Around the average (${fmt(m, 1)} ± ${fmt(h, 1)})`, "Above the sample average"],
  };
}

/** Cumulative percentage at each distinct value, as in the SPSS Frequencies table. */
export function cumulative(values: number[]): Array<{ value: number; count: number; cum: number }> {
  const counts = new Map<number, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  let run = 0;
  return [...counts.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([value, count]) => {
      run += count;
      return { value, count, cum: (run / values.length) * 100 };
    });
}

/** Terciles from the Cumulative Percent column: the value whose cumulative % is closest to 33.3 and 66.7. */
export function percentileCuts(values: number[]): Cuts & { reached: [number, number] } {
  const rows = cumulative(values);
  const nearest = (target: number) => rows.reduce((best, r) => (Math.abs(r.cum - target) < Math.abs(best.cum - target) ? r : best));
  const a = nearest(100 / 3);
  const b = nearest(200 / 3);
  return {
    upper: [a.value, b.value],
    reached: [a.cum, b.cum],
    labels: ["Lowest third of the sample", "Middle third", "Highest third"],
  };
}

export function categorise(v: number, cuts: Cuts): 0 | 1 | 2 {
  return v <= cuts.upper[0] ? 0 : v <= cuts.upper[1] ? 1 : 2;
}

export function categoryCounts(values: number[], cuts: Cuts): [number, number, number] {
  const out: [number, number, number] = [0, 0, 0];
  for (const v of values) out[categorise(v, cuts)]++;
  return out;
}
