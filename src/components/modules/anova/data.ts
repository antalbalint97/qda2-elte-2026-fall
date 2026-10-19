/** The 11 observations of the ANOVA calculation video, in three groups. */
export const ORIGINAL = [
  [45, 61, 53, 73],
  [20, 14, 17],
  [22, 32, 26, 21],
];
export const LABELS = ["Group 1", "Group 2", "Group 3"];

export function mean(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function sumSquares(xs: number[], m: number): number {
  return xs.reduce((s, x) => s + (x - m) ** 2, 0);
}

/** One-way ANOVA decomposition: SS, df, MS, F and η². */
export function anova(groups: number[][]) {
  const all = groups.flat();
  const overall = mean(all);
  const means = groups.map(mean);
  const within = groups.reduce((s, xs, j) => s + sumSquares(xs, means[j]), 0);
  const between = groups.reduce((s, xs, j) => s + xs.length * (means[j] - overall) ** 2, 0);
  const total = sumSquares(all, overall);
  const dfBetween = groups.length - 1;
  const dfWithin = all.length - groups.length;
  const msBetween = between / dfBetween;
  const msWithin = within / dfWithin;
  return {
    overall,
    means,
    within,
    between,
    total,
    dfBetween,
    dfWithin,
    msBetween,
    msWithin,
    f: msWithin > 0 ? msBetween / msWithin : Infinity,
    eta: total > 0 ? between / total : 0,
  };
}

export function fmt(x: number, digits = 2) {
  return x.toLocaleString("en-US", { maximumFractionDigits: digits, minimumFractionDigits: digits });
}
