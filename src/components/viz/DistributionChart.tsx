import { linspace } from "@/lib/stats";

export interface Marker {
  x: number;
  label: string;
  tone?: "accent" | "muted" | "neg";
  dashed?: boolean;
  /** Label row: 0 = top, 1 = second line (avoids overlapping labels). */
  row?: 0 | 1;
}

/**
 * Density curve with shaded regions and vertical markers. Pure SVG, responsive via viewBox.
 * All regions are computed from the real density so the shaded area is the actual probability.
 */
export function DistributionChart({
  pdf,
  xMin,
  xMax,
  regions = [],
  markers = [],
  ticks,
  tickFormat = (v) => String(v),
  xLabel,
  height = 220,
  yMax,
  ariaLabel,
}: {
  pdf: (x: number) => number;
  xMin: number;
  xMax: number;
  regions?: Array<[number, number]>;
  markers?: Marker[];
  ticks: number[];
  tickFormat?: (v: number) => string;
  xLabel?: string;
  height?: number;
  yMax?: number;
  ariaLabel: string;
}) {
  const W = 640;
  const H = height;
  const pad = { l: 16, r: 16, t: 40, b: 44 };
  const xs = linspace(xMin, xMax, 241);
  const ys = xs.map(pdf);
  const top = yMax ?? Math.max(...ys) * 1.08;
  const sx = (x: number) => Math.round((pad.l + ((x - xMin) / (xMax - xMin)) * (W - pad.l - pad.r)) * 10) / 10;
  const sy = (y: number) => H - pad.b - (y / top) * (H - pad.t - pad.b);
  const curve = xs.map((x, i) => `${i ? "L" : "M"}${sx(x).toFixed(1)},${sy(ys[i]).toFixed(1)}`).join("");
  const area = (a: number, b: number) => {
    const lo = Math.max(a, xMin);
    const hi = Math.min(b, xMax);
    if (hi <= lo) return "";
    const pts = linspace(lo, hi, 80);
    return (
      `M${sx(lo)},${sy(0)}` + pts.map((x) => `L${sx(x).toFixed(1)},${sy(pdf(x)).toFixed(1)}`).join("") + `L${sx(hi)},${sy(0)}Z`
    );
  };
  const toneCls = { accent: "stroke-accent fill-accent", muted: "stroke-faint fill-faint", neg: "stroke-neg fill-neg" };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={ariaLabel}>
      {regions.map(([a, b], i) => (
        <path key={i} d={area(a, b)} className="fill-accent/30 transition-all duration-150" />
      ))}
      <path d={curve} fill="none" className="stroke-ink" strokeWidth={1.8} />
      <line x1={pad.l} x2={W - pad.r} y1={sy(0)} y2={sy(0)} className="stroke-line-strong" />
      {ticks.map((t) => (
        <g key={t}>
          <line x1={sx(t)} x2={sx(t)} y1={sy(0)} y2={sy(0) + 5} className="stroke-line-strong" />
          <text x={sx(t)} y={sy(0) + 18} textAnchor="middle" className="fill-muted font-mono text-[11px]">
            {tickFormat(t)}
          </text>
        </g>
      ))}
      {xLabel && (
        <text x={W / 2} y={H - 6} textAnchor="middle" className="fill-faint text-[11px]">
          {xLabel}
        </text>
      )}
      {markers.map((m, i) => {
        if (m.x < xMin || m.x > xMax) return null;
        const c = toneCls[m.tone ?? "accent"];
        return (
          <g key={i} className={c} style={{ transition: "transform 150ms" }}>
            <line
              x1={sx(m.x)}
              x2={sx(m.x)}
              y1={pad.t - (m.row ? 4 : 18)}
              y2={sy(0)}
              strokeWidth={m.dashed ? 1.2 : 2}
              strokeDasharray={m.dashed ? "4 4" : undefined}
              fill="none"
            />
            {!m.dashed && <circle cx={sx(m.x)} cy={sy(0)} r={4.5} stroke="none" />}
            <text
              x={sx(m.x)}
              y={m.row ? pad.t - 8 : pad.t - 24}
              textAnchor={sx(m.x) > W - 80 ? "end" : sx(m.x) < 80 ? "start" : "middle"}
              stroke="none"
              className={m.row ? "text-[10px]" : "text-[11px] font-medium"}
            >
              {m.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
