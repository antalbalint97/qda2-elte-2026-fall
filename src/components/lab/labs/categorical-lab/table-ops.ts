// Count-table edits behind the Categorical Data Lab's draggable mosaic. Pure functions on integer tables;
// each one states which totals it preserves (checked in tests/unit/categorical-lab.test.ts).

export type Table = number[][];

export const PRESET_TABLES = {
  lecture: { rows: ["Women", "Men"], cols: ["Trusts parliament", "Does not"], base: [[62, 88], [44, 106]] },
  indep: { rows: ["Primary", "Secondary", "Tertiary"], cols: ["Low", "Mid", "High"], base: [[30, 30, 30], [40, 40, 40], [20, 20, 20]] },
  strong: { rows: ["Primary", "Secondary", "Tertiary"], cols: ["Low", "Mid", "High"], base: [[60, 25, 5], [30, 50, 20], [8, 30, 62]] },
  sparse: { rows: ["A", "B"], cols: ["Yes", "No"], base: [[3, 1], [1, 3]] },
} as const;
export type PresetTable = keyof typeof PRESET_TABLES;

const sum = (a: readonly number[]) => a.reduce((s, x) => s + x, 0);

/** R×C copy of `t`; new cells are `fill`. */
export function resize(t: readonly (readonly number[])[], R: number, C: number, fill = 10): Table {
  return Array.from({ length: R }, (_, i) => Array.from({ length: C }, (_, j) => t[i]?.[j] ?? fill));
}

export function transpose(t: readonly (readonly number[])[]): Table {
  return t[0].map((_, j) => t.map((r) => r[j]));
}

/** Integers proportional to `w` that sum to `total` (largest remainder); equal shares when Σw = 0. */
export function apportion(w: readonly number[], total: number): number[] {
  const W = sum(w);
  const raw = w.map((x) => (W > 0 ? (x / W) * total : total / w.length));
  const out = raw.map(Math.floor);
  let left = total - sum(out);
  const order = raw.map((x, i) => [x - Math.floor(x), i] as const).sort((a, b) => b[0] - a[0] || a[1] - b[1]);
  for (let k = 0; left > 0; k = (k + 1) % order.length, left--) out[order[k][1]]++;
  return out;
}

/**
 * Moves the boundary between cells (i, j) and (i, j+1) so that the cumulative count of row i up to and
 * including column j becomes `c`. Row totals and N are preserved. With `keepMargins` the opposite change
 * is made in a neighbouring row, so column totals are preserved too (as far as that row has cases).
 */
export function moveWithinRow(t: Table, i: number, j: number, c: number, keepMargins: boolean): Table {
  const row = t[i];
  const before = sum(row.slice(0, j));
  const pair = row[j] + row[j + 1];
  let delta = Math.round(Math.min(before + pair, Math.max(before, c))) - before - row[j];
  const out = t.map((r) => r.slice());
  if (keepMargins) {
    // row k gives back: (k, j) falls by delta and (k, j+1) rises by delta; both must stay ≥ 0
    const k = i + 1 < t.length ? i + 1 : i - 1;
    delta = Math.max(-t[k][j + 1], Math.min(t[k][j], delta));
    out[k][j] -= delta;
    out[k][j + 1] += delta;
  }
  out[i][j] = row[j] + delta;
  out[i][j + 1] = pair - out[i][j];
  return out;
}

/**
 * Moves the boundary between rows i and i+1 so that the cumulative N up to and including row i becomes
 * `c`. N and the within-row percentages of both rows are preserved (up to integer rounding).
 */
export function moveRowBoundary(t: Table, i: number, c: number): Table {
  const tot = t.map(sum);
  const before = sum(tot.slice(0, i));
  const pair = tot[i] + tot[i + 1];
  const a = Math.round(Math.min(before + pair, Math.max(before, c))) - before;
  const out = t.map((r) => r.slice());
  out[i] = apportion(t[i], a);
  out[i + 1] = apportion(t[i + 1], pair - a);
  return out;
}

/** Displayed counts: base × scale, rounded. */
export function scaled(t: readonly (readonly number[])[], scale: number): Table {
  return t.map((r) => r.map((v) => Math.round(v * scale)));
}
