// SVG path helpers shared by the labs (pure; no React).

export type Scale = (v: number) => number;

/** Linear map from [d0, d1] to [r0, r1]. */
export function linear(d0: number, d1: number, r0: number, r1: number): Scale {
  const k = d1 === d0 ? 0 : (r1 - r0) / (d1 - d0);
  return (v: number) => r0 + (v - d0) * k;
}

/** Polyline of y = fn(x) on [x0, x1]; non-finite values break the line. */
export function curvePath(fn: (x: number) => number, x0: number, x1: number, X: Scale, Y: Scale, steps = 160): string {
  let d = "";
  let pen = false;
  for (let i = 0; i <= steps; i++) {
    const x = x0 + ((x1 - x0) * i) / steps;
    const y = fn(x);
    if (!Number.isFinite(y)) {
      pen = false;
      continue;
    }
    d += (pen ? "L" : "M") + X(x).toFixed(1) + "," + Y(y).toFixed(1) + " ";
    pen = true;
  }
  return d.trim();
}

/** Closed area under y = fn(x) between a and b, down to the baseline pixel `base`. */
export function areaPath(fn: (x: number) => number, a: number, b: number, X: Scale, Y: Scale, base: number, steps = 80): string {
  if (!(b > a)) return "";
  let d = "M" + X(a).toFixed(1) + "," + base.toFixed(1) + " ";
  for (let i = 0; i <= steps; i++) {
    const x = a + ((b - a) * i) / steps;
    const y = fn(x);
    d += "L" + X(x).toFixed(1) + "," + Y(Number.isFinite(y) ? y : 0).toFixed(1) + " ";
  }
  return d + "L" + X(b).toFixed(1) + "," + base.toFixed(1) + " Z";
}

/** n + 1 evenly spaced values from lo to hi. */
export const ticks = (lo: number, hi: number, n = 5): number[] => Array.from({ length: n + 1 }, (_, i) => lo + ((hi - lo) * i) / n);

/** "Nice" tick values (1, 2, 5 × 10^k steps) covering [lo, hi]. */
export function niceTicks(lo: number, hi: number, target = 5): number[] {
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) return [];
  if (hi === lo) return [lo];
  const raw = (hi - lo) / target;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? 10 * mag;
  const out: number[] = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + step * 1e-9; v += step) out.push(Math.abs(v) < step * 1e-9 ? 0 : +v.toPrecision(12));
  return out;
}

/** Histogram bars as rectangles in pixel space. */
export function barRects(counts: number[], edges: number[], X: Scale, Y: Scale, base: number) {
  return counts.map((c, i) => {
    const x0 = X(edges[i]);
    const x1 = X(edges[i + 1]);
    const y = Y(c);
    return { x: Math.min(x0, x1), y: Math.min(y, base), w: Math.abs(x1 - x0), h: Math.abs(base - y), count: c };
  });
}
