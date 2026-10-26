"use client";

import { Panel } from "@/components/learning/ModuleShell";
import { Announce } from "@/components/ui/Announce";
import { Button } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Segmented";
import { Slider } from "@/components/ui/Slider";
import { mean, sumOfSquares, variance } from "@/lib/stats";
import { useRef, useState } from "react";
import { BOOK_LABELS, BOOK_RANGE, BOOKS, fmt } from "./data";

type View = "dev" | "squares" | "average";
const U = 12; // px per book, the same horizontally and vertically, so squares are true squares
const Y = (v: number) => 268 - v * U;
const PX = (i: number) => 70 + i * 80;
const AVG_X = 600;

export function VarianceSquares() {
  const [values, setValues] = useState(BOOKS);
  const [sel, setSel] = useState(5);
  const [view, setView] = useState<View>("squares");
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef<number | null>(null);

  const m = mean(values);
  const ss = sumOfSquares(values);
  const v = variance(values);
  const s = Math.sqrt(v);
  const devSum = values.reduce((a, x) => a + (x - m), 0);

  function setValue(i: number, x: number) {
    const clamped = Math.max(BOOK_RANGE.min, Math.min(BOOK_RANGE.max, Math.round(x)));
    setValues((vs) => vs.map((old, k) => (k === i ? clamped : old)));
  }

  function onPointerMove(e: React.PointerEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    const ctm = svg?.getScreenCTM();
    if (dragging.current === null || !svg || !ctm) return;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    setValue(dragging.current, (268 - p.y) / U);
  }

  const showSquares = view !== "dev";

  return (
    <Panel>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="tracking-tight text-xl font-semibold text-ink">Variance is an average square</h3>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Synthetic data: how many books six respondents read last year. Drag a dot up or down, or choose a
            respondent and use the slider.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setValues(BOOKS);
            setSel(5);
          }}
        >
          Reset
        </Button>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <span className="text-sm text-muted">Show</span>
        <Segmented<View>
          label="What to draw"
          value={view}
          onChange={setView}
          options={[
            { value: "dev", label: "Deviations" },
            { value: "squares", label: "Squared deviations" },
            { value: "average", label: "Average square" },
          ]}
        />
      </div>
      <svg
        ref={svgRef}
        viewBox="0 0 740 300"
        className="mt-4 w-full touch-none select-none"
        role="img"
        aria-label={`Six respondents' book counts: ${values.map((x, i) => `${BOOK_LABELS[i]} ${x}`).join(", ")}. Mean ${fmt(m)}. ${
          showSquares ? `Each deviation from the mean is drawn as a square; total area (sum of squares) ${fmt(ss)}.` : "Deviations from the mean are drawn as vertical lines."
        } ${view === "average" ? `The average square has area ${fmt(v)} (the variance) and side ${fmt(s, 2)} (the standard deviation).` : ""}`}
        onPointerMove={onPointerMove}
        onPointerUp={() => (dragging.current = null)}
        onPointerCancel={() => (dragging.current = null)}
      >
        {[0, 5, 10, 15, 20].map((t) => (
          <g key={t}>
            <line x1={36} x2={520} y1={Y(t)} y2={Y(t)} stroke="var(--grid)" />
            <text x={28} y={Y(t) + 4} textAnchor="end" fontSize="12" fill="var(--muted)">
              {t}
            </text>
          </g>
        ))}
        {showSquares &&
          values.map((x, i) => {
            const d = Math.abs(x - m) * U;
            const left = i >= 3; // right-hand squares open to the left so none leave the chart
            return (
              <rect
                key={`sq${i}`}
                x={left ? PX(i) - d : PX(i)}
                y={Math.min(Y(x), Y(m))}
                width={d}
                height={d}
                fill="var(--y)"
                fillOpacity={view === "average" ? 0.08 : 0.2}
                stroke="var(--y)"
                strokeOpacity={view === "average" ? 0.35 : 0.9}
              />
            );
          })}
        <line x1={36} x2={520} y1={Y(m)} y2={Y(m)} stroke="var(--ink)" strokeDasharray="6 4" />
        <text x={524} y={Y(m) + 4} fontSize="12" fill="var(--ink)">
          mean {fmt(m)}
        </text>
        {values.map((x, i) => (
          <g key={i}>
            <line x1={PX(i)} x2={PX(i)} y1={Y(x)} y2={Y(m)} stroke="var(--ink)" strokeWidth={view === "dev" ? 2.5 : 1.2} />
            {view === "dev" && Math.abs(x - m) > 0.05 && (
              <text x={PX(i) + 8} y={(Y(x) + Y(m)) / 2 + 4} fontSize="12" fill="var(--ink)">
                {x - m > 0 ? "+" : "−"}
                {fmt(Math.abs(x - m))}
              </text>
            )}
            <circle
              cx={PX(i)}
              cy={Y(x)}
              r={sel === i ? 9 : 7}
              fill="var(--y)"
              stroke={sel === i ? "var(--ink)" : "var(--surface)"}
              strokeWidth={2}
              className="cursor-ns-resize"
              onPointerDown={(e) => {
                dragging.current = i;
                setSel(i);
                svgRef.current?.setPointerCapture(e.pointerId);
              }}
            />
            <text x={PX(i)} y={292} textAnchor="middle" fontSize="12" fill="var(--muted)">
              {BOOK_LABELS[i]}
            </text>
          </g>
        ))}
        {view === "average" && (
          <g>
            <rect x={AVG_X} y={Y(m) - s * U} width={s * U} height={s * U} fill="var(--y)" fillOpacity={0.35} stroke="var(--ink)" strokeWidth={1.5} />
            <text x={AVG_X} y={Math.max(14, Y(m) - s * U - 8)} fontSize="12" fill="var(--ink)">
              area = variance {fmt(v)}
            </text>
            <text x={AVG_X} y={Y(m) + 18} fontSize="12" fill="var(--ink)">
              side = SD {fmt(s, 2)}
            </text>
          </g>
        )}
      </svg>
      <p className="text-xs text-muted">
        Dots = respondents; dashed line = mean; vertical lines = deviations from the mean. In the squared view each
        deviation becomes a square whose side is the deviation, so its area is the squared deviation.
      </p>
      <div className="mt-5 grid gap-5 sm:grid-cols-[auto_1fr] sm:items-end">
        <div>
          <p className="mb-1 text-sm font-medium text-ink">
            Respondent to move
          </p>
          <Segmented
            label="Respondent to move"
            value={String(sel)}
            onChange={(k) => setSel(Number(k))}
            options={BOOK_LABELS.map((l, i) => ({ value: String(i), label: l }))}
            size="sm"
          />
        </div>
        <Slider
          label={`Books read by respondent ${BOOK_LABELS[sel]}`}
          value={values[sel]}
          min={BOOK_RANGE.min}
          max={BOOK_RANGE.max}
          onChange={(x) => setValue(sel, x)}
          valueText={`${values[sel]} books`}
        />
      </div>
      <Announce>{`Respondent ${BOOK_LABELS[sel]}: ${values[sel]} books. Mean ${fmt(m)}, sum of squares ${fmt(ss)}, variance ${fmt(v)}, standard deviation ${fmt(s, 2)}.`}</Announce>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          ["Mean", fmt(m)],
          ["Sum of deviations", fmt(Math.abs(devSum) < 1e-9 ? 0 : devSum)],
          ["Sum of squares", fmt(ss)],
          ["Variance = SS ÷ 5", fmt(v)],
          ["SD = √variance", fmt(s, 2)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg bg-surface-2 p-3">
            <p className="text-xs text-muted">{label}</p>
            <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-ink">{value}</p>
          </div>
        ))}
      </div>
      <div className="mt-5 overflow-x-auto" tabIndex={0} role="region" aria-label="Deviations and squared deviations">
        <table className="w-full min-w-[26rem] border-collapse text-left text-sm tabular-nums">
          <thead>
            <tr className="border-b border-line text-muted">
              <th scope="col" className="py-2 pr-3 font-medium">Respondent</th>
              <th scope="col" className="pr-3 font-medium">Books</th>
              <th scope="col" className="pr-3 font-medium">Deviation from mean</th>
              <th scope="col" className="font-medium">Squared deviation</th>
            </tr>
          </thead>
          <tbody className="text-ink">
            {values.map((x, i) => (
              <tr key={i} className="border-b border-line">
                <th scope="row" className="py-1.5 pr-3 text-left font-normal">{BOOK_LABELS[i]}</th>
                <td className="pr-3">{x}</td>
                <td className="pr-3">{fmt(x - m)}</td>
                <td>{fmt((x - m) ** 2)}</td>
              </tr>
            ))}
            <tr>
              <th scope="row" className="py-1.5 pr-3 text-left font-semibold">Sum</th>
              <td className="pr-3">{values.reduce((a, b) => a + b, 0)}</td>
              <td className="pr-3">{fmt(Math.abs(devSum) < 1e-9 ? 0 : devSum)}</td>
              <td className="font-semibold">{fmt(ss)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
