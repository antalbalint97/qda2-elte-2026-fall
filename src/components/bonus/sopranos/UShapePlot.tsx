import { Scatter } from "@/components/viz/Scatter";
import { col, ORDER_VIOLENCE, SEASON_MEANS, SERIES_ORDER } from "@/content/sopranos/analysis";
import { noLeadingZero } from "@/lib/stats";
import { SyntheticTag } from "./Case";

/** Least-squares quadratic y = a + bx + cx², solved from the 3 × 3 normal equations. */
function quadraticFit(xs: number[], ys: number[]) {
  const s = (p: number, q = 0) => xs.reduce((acc, x, i) => acc + x ** p * (q ? ys[i] : 1), 0);
  const A = [
    [xs.length, s(1), s(2)],
    [s(1), s(2), s(3)],
    [s(2), s(3), s(4)],
  ];
  const B = [s(0, 1), s(1, 1), s(2, 1)];
  const det = (m: number[][]) =>
    m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
    m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
    m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
  const D = det(A);
  const coef = [0, 1, 2].map((k) => det(A.map((row, i) => row.map((v, j) => (j === k ? B[i] : v)))) / D);
  return (x: number) => coef[0] + coef[1] * x + coef[2] * x * x;
}

const YS = col("violence_event_count");
const FIT = quadraticFit(SERIES_ORDER, YS);

export function UShapePlot() {
  const maxMean = Math.max(...SEASON_MEANS);
  return (
    <div className="grid gap-6 rounded-2xl border border-line bg-surface p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_15rem]">
      <div>
        <Scatter
          xs={SERIES_ORDER}
          ys={YS}
          xLabel="position in the series (episode 1 … 74)"
          yLabel="violent events"
          curve={FIT}
          ariaLabel="Scatterplot of series position against violent events, with a U-shaped curve: high at the start, low in the middle, high again at the end."
        />
        <SyntheticTag />
      </div>
      <div className="space-y-4">
        <div className="rounded-xl bg-surface-2 p-4">
          <p className="font-mono text-2xl font-semibold text-ink">r = {noLeadingZero(ORDER_VIOLENCE.r)}</p>
          <p className="text-xs text-muted">Pearson, N = {ORDER_VIOLENCE.n}</p>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-faint">Mean violent events by season</p>
          <ul className="space-y-1.5">
            {SEASON_MEANS.map((m, i) => (
              <li key={i} className="flex items-center gap-2 text-xs">
                <span className="w-14 shrink-0 text-muted">Season {i + 1}</span>
                <span className="flex-1" aria-hidden>
                  <span className="block h-2.5 rounded-full bg-ry/70" style={{ width: `${(m / maxMean) * 100}%` }} />
                </span>
                <span className="font-mono tabular-nums text-ink">{m.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
