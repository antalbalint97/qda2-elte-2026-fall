"use client";

import { Panel } from "@/components/learning/ModuleShell";
import { Slider } from "@/components/ui/Slider";
import { mean, sd } from "@/lib/stats";
import { useState } from "react";
import { fmt } from "./data";

const ITEM_LABELS = ["T1", "T2", "T3 (reversed)", "T4"];
const A = [4, 4, 3, 3];
const START_B = [5, 5, 1, 3];

const X = (v: number) => 40 + (v - 1) * 60;
const ROW = (i: number) => 26 + i * 30;

function Profile({ values, color, dash }: { values: number[]; color: string; dash?: string }) {
  return (
    <g>
      <polyline
        points={values.map((v, i) => `${X(v)},${ROW(i)}`).join(" ")}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeDasharray={dash}
        opacity={0.8}
      />
      {values.map((v, i) => (
        <circle key={i} cx={X(v)} cy={ROW(i)} r={6} fill={color} />
      ))}
    </g>
  );
}

/** Two respondents with different answer patterns can end up with the same index score. */
export function SameScore() {
  const [b, setB] = useState(START_B);
  const ma = mean(A);
  const mb = mean(b);
  const same = Math.abs(ma - mb) < 1e-9;
  const set = (i: number, v: number) => setB((old) => old.map((x, k) => (k === i ? v : x)));

  return (
    <Panel>
      <h3 className="font-serif text-xl font-semibold text-ink">Two respondents, one number</h3>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        Four items of a trust index, already pointing the same way (1 = low trust, 5 = high trust). Respondent A answers
        consistently; change respondent B&rsquo;s answers and watch what the index keeps and what it throws away.
      </p>
      <div className="mt-5 grid gap-6 md:grid-cols-[minmax(0,1fr)_16rem]">
        <svg
          viewBox="0 0 320 200"
          className="w-full"
          role="img"
          aria-label={`Answer profiles. Respondent A: ${A.join(", ")}, index ${fmt(ma)}. Respondent B: ${b.join(", ")}, index ${fmt(mb)}.`}
        >
          {[1, 2, 3, 4, 5].map((v) => (
            <g key={v}>
              <line x1={X(v)} x2={X(v)} y1={12} y2={ROW(3) + 14} stroke="var(--grid)" />
              <text x={X(v)} y={ROW(3) + 30} textAnchor="middle" fontSize="11" fill="var(--muted)">
                {v}
              </text>
            </g>
          ))}
          {ITEM_LABELS.map((l, i) => (
            <text key={l} x={2} y={ROW(i) + 4} fontSize="10" fill="var(--muted)">
              {l.split(" ")[0]}
            </text>
          ))}
          <Profile values={A} color="var(--ink)" />
          <Profile values={b} color="var(--accent)" dash="5 4" />
          {/* the index: everything collapses to one point per respondent */}
          <line x1={X(1)} x2={X(5)} y1={180} y2={180} stroke="var(--border-strong)" />
          <text x={2} y={184} fontSize="10" fontWeight="600" fill="var(--ink)">
            index
          </text>
          <circle cx={X(ma)} cy={180} r={7} fill="var(--ink)" />
          <circle cx={X(mb)} cy={180} r={same ? 11 : 7} fill="none" stroke="var(--accent)" strokeWidth={2.5} />
        </svg>
        <div className="space-y-3">
          <p className="text-sm font-medium text-ink">
            <span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full bg-accent" aria-hidden />
            Respondent B
          </p>
          {b.map((v, i) => (
            <Slider
              key={i}
              label={`B on ${ITEM_LABELS[i]}`}
              value={v}
              min={1}
              max={5}
              onChange={(nv) => set(i, nv)}
              valueText={`${v} of 5`}
            />
          ))}
        </div>
      </div>
      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2" role="status">
        <p className="rounded-lg bg-surface-2 px-3 py-2 text-ink">
          A: answers {A.join(", ")} → index <strong>{fmt(ma)}</strong>, spread across items (SD) {fmt(sd(A))}
        </p>
        <p className="rounded-lg bg-surface-2 px-3 py-2 text-ink">
          B: answers {b.join(", ")} → index <strong>{fmt(mb)}</strong>, spread across items (SD) {fmt(sd(b))}
        </p>
      </div>
      <p className="mt-4 text-sm text-muted">
        {same
          ? "Same index score, different answer patterns. Once we average, the index cannot tell a consistent respondent from one who strongly agrees with some items and strongly disagrees with others. That is the price of data reduction: we give up detail to get one more valid and more reliable number."
          : "The scores differ now. Try to give B a very different pattern that still averages 3.50: many patterns collapse onto the same index score."}
      </p>
    </Panel>
  );
}
