"use client";

// Landing hero: fifteen draggable points with their least-squares line. Every coral square is a squared residual;
// the line minimises their total. All numbers come from the engine's OLS fit on the points as they are now.
import { fit } from "@/lib/engine/regression";
import { fmt } from "@/lib/engine/format";
import { cn } from "@/lib/cn";
import { useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

const BASE: [number, number][] = [[1, 28], [2, 35], [3, 31], [4, 44], [6, 49], [3, 46], [5, 52], [6, 58], [8, 55], [9, 66], [5, 60], [7, 71], [9, 68], [11, 82], [13, 88]];
// rounded so that server- and client-rendered style strings match exactly (the browser keeps six significant digits)
const r2 = (v: number) => Math.round(v * 100) / 100;
const PX = (x: number) => r2(36 + x * 33.7);
const PY = (y: number) => r2(300 - y * 2.8);
const clampX = (x: number) => Math.max(0, Math.min(14, x));
const clampY = (y: number) => Math.max(0, Math.min(100, y));

export interface HeroStrings {
  title: string;
  caption: string;
  xLabel: string;
  yLabel: string;
  point: (i: number, x: number, y: number) => string;
  chart: (r: string) => string;
  reset: string;
}

export function HeroLeastSquares({ t }: { t: HeroStrings }) {
  const [pts, setPts] = useState(() => BASE.map(([x, y], id) => ({ id, x, y })));
  const [drag, setDrag] = useState<number | null>(null);
  const svg = useRef<SVGSVGElement>(null);
  const clip = useId().replace(/:/g, "");
  const f = fit(
    pts.map((p) => p.x),
    pts.map((p) => p.y),
  );
  const ok = f.slope !== null && f.intercept !== null;
  const a = ok ? (f.intercept as number) : (f.my ?? 0);
  const b = ok ? (f.slope as number) : 0;
  const moved = pts.some((p, i) => p.x !== BASE[i][0] || p.y !== BASE[i][1]);

  const toData = (e: PointerEvent) => {
    const ctm = svg.current?.getScreenCTM();
    if (!ctm) return null;
    const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    return { x: clampX(Math.round(((pt.x - 36) / 33.7) * 2) / 2), y: clampY(Math.round((300 - pt.y) / 2.8)) };
  };
  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    if (drag === null) return;
    const d = toData(e);
    if (d) setPts((ps) => ps.map((p) => (p.id === drag ? { ...p, ...d } : p)));
  };
  const onKey = (id: number) => (e: KeyboardEvent) => {
    const step = e.shiftKey ? 5 : 2;
    const dy = e.key === "ArrowUp" ? step : e.key === "ArrowDown" ? -step : 0;
    const dx = e.key === "ArrowRight" ? 0.5 : e.key === "ArrowLeft" ? -0.5 : 0;
    if (!dx && !dy) return;
    e.preventDefault();
    setPts((ps) => ps.map((p) => (p.id === id ? { ...p, x: clampX(p.x + dx), y: clampY(p.y + dy) } : p)));
  };
  const motion = drag === null ? "lab-tr" : "lab-fast";
  const rot = r2((Math.atan2(-b * 2.8, 33.7) * 180) / Math.PI);

  return (
    <figure className="rounded-2xl border border-night-line bg-night-2 px-[18px] pb-2.5 pt-4">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <figcaption className="text-[12.5px] text-night-faint">{t.title}</figcaption>
        <p className="font-mono text-[13px] text-night-ink" aria-live="polite">
          r = <span className="text-model">{ok && f.r !== null ? fmt(f.r, 3) : "—"}</span> · R² = {ok && f.r2 !== null ? fmt(f.r2, 3) : "—"} · SSE ={" "}
          <span className="text-residual">{ok ? fmt(f.sse, 0) : "—"}</span>
        </p>
      </div>
      <svg
        ref={svg}
        viewBox="0 0 520 330"
        className="mt-1.5 block h-auto w-full touch-none select-none font-mono"
        onPointerMove={onMove}
        onPointerUp={() => setDrag(null)}
        onPointerCancel={() => setDrag(null)}
        role="group"
        aria-label={t.chart(ok && f.r !== null ? fmt(f.r, 3) : "—")}
      >
        <defs>
          <clipPath id={clip}>
            <rect x="30" y="10" width="480" height="290" />
          </clipPath>
        </defs>
        {[0, 25, 50, 75, 100].map((v) => (
          <line key={v} x1="36" x2="508" y1={PY(v)} y2={PY(v)} stroke="var(--night-line)" />
        ))}
        <g clipPath={`url(#${clip})`}>
          {pts.map((p) => {
            const px = PX(p.x);
            const py = PY(p.y);
            const ry = PY(a + b * p.x);
            const s = r2(Math.abs(py - ry));
            const top = Math.min(py, ry);
            return (
              <g key={p.id} aria-hidden>
                <rect className={motion} style={{ x: px > 270 ? r2(px - s) : px, y: top, width: s, height: s }} fill="var(--residual)" fillOpacity={0.18} stroke="var(--residual)" strokeOpacity={0.8} />
                <rect className={motion} style={{ x: r2(px - 1), y: top, width: 2, height: s }} fill="var(--residual)" />
              </g>
            );
          })}
          <g className={motion} style={{ transform: `translate(${PX(0)}px, ${PY(a)}px) rotate(${rot}deg)`, transformOrigin: "0px 0px" }} aria-hidden>
            <line x1="-200" x2="800" y1="0" y2="0" stroke="var(--model)" strokeWidth="2.5" />
          </g>
        </g>
        {pts.map((p, i) => (
          <g
            key={p.id}
            className={cn(motion, "cursor-move outline-none [&:focus-visible>circle]:stroke-night-ink")}
            style={{ transform: `translate(${PX(p.x)}px, ${PY(p.y)}px)` }}
            tabIndex={0}
            role="slider"
            aria-label={t.point(i + 1, p.x, p.y)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={p.y}
            aria-valuetext={`X ${p.x}, Y ${p.y}`}
            onKeyDown={onKey(p.id)}
            onPointerDown={(e) => {
              svg.current?.setPointerCapture(e.pointerId);
              setDrag(p.id);
            }}
          >
            <circle r="14" fill="transparent" />
            <circle r="8" fill="var(--data)" stroke="var(--night)" strokeWidth="2" />
          </g>
        ))}
        <text x="508" y="322" textAnchor="end" fontSize="10.5" fill="var(--night-faint)" className="font-sans">
          {t.xLabel}
        </text>
        <text x="36" y="322" fontSize="10.5" fill="var(--night-faint)" className="font-sans">
          {t.yLabel}
        </text>
        {[0, 50, 100].map((v) => (
          <text key={v} x="30" y={PY(v) + 4} textAnchor="end" fontSize="10" fill="var(--night-faint)">
            {v}
          </text>
        ))}
      </svg>
      <div className="mt-1.5 flex items-start justify-between gap-3">
        <p className="text-[11.5px] leading-relaxed text-night-faint">{t.caption}</p>
        {moved && (
          <button type="button" onClick={() => setPts(BASE.map(([x, y], id) => ({ id, x, y })))} className="shrink-0 rounded-md border border-night-line px-2 py-0.5 text-[11.5px] text-night-muted hover:text-night-ink">
            {t.reset}
          </button>
        )}
      </div>
    </figure>
  );
}
