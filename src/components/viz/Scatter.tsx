export function Scatter({
  xs,
  ys,
  xLabel,
  yLabel,
  curve,
  ariaLabel,
  size = 320,
  tone = "x",
}: {
  xs: number[];
  ys: number[];
  xLabel?: string;
  yLabel?: string;
  /** Optional overlay, as a function of x, drawn across the x range. */
  curve?: (x: number) => number;
  ariaLabel: string;
  size?: number;
  tone?: "x" | "z";
}) {
  const W = size * 1.3;
  const H = size;
  const pad = { l: 28, r: 10, t: 10, b: 28 };
  const ext = (v: number[]) => {
    const lo = Math.min(...v);
    const hi = Math.max(...v);
    const m = (hi - lo) * 0.06 || 1;
    return [lo - m, hi + m];
  };
  const [x0, x1] = ext(xs);
  const [y0, y1] = ext(ys);
  const sx = (x: number) => pad.l + ((x - x0) / (x1 - x0)) * (W - pad.l - pad.r);
  const sy = (y: number) => H - pad.b - ((y - y0) / (y1 - y0)) * (H - pad.t - pad.b);
  const path = curve
    ? Array.from({ length: 80 }, (_, i) => x0 + ((x1 - x0) * i) / 79)
        .map((x, i) => `${i ? "L" : "M"}${sx(x).toFixed(1)},${sy(curve(x)).toFixed(1)}`)
        .join("")
    : null;
  const dot = tone === "x" ? "fill-rx" : "fill-rz";
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={ariaLabel}>
      <rect x={pad.l} y={pad.t} width={W - pad.l - pad.r} height={H - pad.t - pad.b} className="fill-surface-2" rx={6} />
      {[0.25, 0.5, 0.75].map((f) => (
        <g key={f}>
          <line x1={pad.l + f * (W - pad.l - pad.r)} x2={pad.l + f * (W - pad.l - pad.r)} y1={pad.t} y2={H - pad.b} className="stroke-grid" />
          <line y1={pad.t + f * (H - pad.t - pad.b)} y2={pad.t + f * (H - pad.t - pad.b)} x1={pad.l} x2={W - pad.r} className="stroke-grid" />
        </g>
      ))}
      {xs.map((x, i) => (
        <circle
          key={i}
          cx={+sx(x).toFixed(1)}
          cy={+sy(ys[i]).toFixed(1)}
          r={3.4}
          className={dot}
          opacity={0.7}
          style={{ transition: "cx 450ms ease, cy 450ms ease" }}
        />
      ))}
      {path && <path d={path} fill="none" className="stroke-accent animate-draw" strokeWidth={2.2} style={{ ["--len" as string]: 2000 }} />}
      {xLabel && (
        <text x={(W + pad.l) / 2} y={H - 8} textAnchor="middle" className="fill-muted text-[11px]">
          {xLabel} →
        </text>
      )}
      {yLabel && (
        <text x={12} y={(H - pad.b) / 2} textAnchor="middle" transform={`rotate(-90 12 ${(H - pad.b) / 2})`} className="fill-muted text-[11px]">
          {yLabel} →
        </text>
      )}
    </svg>
  );
}
