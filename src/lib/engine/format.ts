// Presentation-only number formatting. Never call these inside an estimator.

/** Fixed decimals with a thousands separator; null/NaN/±Infinity print as an em dash. */
export function fmt(x: number | null | undefined, digits = 2): string {
  if (x === null || x === undefined || !Number.isFinite(x)) return "—";
  return x.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

/** APA-style p without the leading zero: "< .001" or ".034". */
export function fmtP(p: number | null | undefined): string {
  if (p === null || p === undefined || !Number.isFinite(p)) return "—";
  if (p < 0.001) return "< .001";
  return p.toFixed(3).replace(/^0/, "");
}

/** Coefficient-style number without a leading zero (r, R², η², V). */
export function fmtCoef(x: number | null | undefined, digits = 3): string {
  if (x === null || x === undefined || !Number.isFinite(x)) return "—";
  return x.toFixed(digits).replace(/^(-?)0\./, "$1.");
}

/** Percentage with the given decimals. */
export function fmtPct(x: number | null | undefined, digits = 1): string {
  if (x === null || x === undefined || !Number.isFinite(x)) return "—";
  return `${x.toFixed(digits)} %`;
}
