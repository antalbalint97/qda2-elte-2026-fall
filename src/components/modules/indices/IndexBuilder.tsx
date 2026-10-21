"use client";

import { Panel } from "@/components/learning/ModuleShell";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { alphaBand, alphaParts, cronbachAlpha, itemTotalStatistics, type ItemTotalRow } from "@/lib/reliability";
import { pearson } from "@/lib/stats";
import { useMemo, useState } from "react";
import { fmt, fmt3, ITEMS, RESPONSES, reverse, SCALE_LABEL, scoredMatrix } from "./data";

const LOW_ITEM_TOTAL = 0.25;
const MIN_ITEMS = 3;

/* ---------------- alpha gauge ---------------- */

const BANDS: Array<[number, number, string, string]> = [
  [0, 0.5, "unacceptable", "var(--neg-soft)"],
  [0.5, 0.6, "weak", "var(--neg-soft)"],
  [0.6, 0.7, "questionable", "var(--warn-soft)"],
  [0.7, 0.8, "acceptable", "var(--pos-soft)"],
  [0.8, 0.9, "good", "var(--pos-soft)"],
  [0.9, 1, "excellent?", "var(--warn-soft)"],
];

function AlphaGauge({ alpha }: { alpha: number }) {
  const X = (v: number) => 12 + Math.max(0, Math.min(1, v)) * 296;
  const band = alphaBand(alpha);
  return (
    <svg viewBox="0 0 320 66" className="w-full" role="img" aria-label={`Cronbach's alpha ${fmt3(alpha)}: ${band.label}.`}>
      {BANDS.map(([a, b, label, fill]) => (
        <g key={label}>
          <rect x={X(a)} y={22} width={X(b) - X(a)} height={22} fill={fill} stroke="var(--surface)">
            <title>{label}</title>
          </rect>
        </g>
      ))}
      {[0, 0.5, 0.6, 0.7, 0.8, 0.9, 1].map((t) => (
        <text key={t} x={X(t)} y={60} textAnchor="middle" fontSize="8.5" fill="var(--faint)">
          {t === 0 || t === 1 ? t : t.toFixed(1).slice(1)}
        </text>
      ))}
      <line x1={X(0.7)} x2={X(0.7)} y1={16} y2={48} stroke="var(--ink)" strokeDasharray="2 2" />
      <g style={{ transition: "transform 400ms ease" }} transform={`translate(${X(alpha)} 0)`}>
        <path d="M0 20 l-6 -10 h12 z" fill="var(--accent)" />
        <line x1={0} x2={0} y1={20} y2={46} stroke="var(--accent)" strokeWidth={3} />
      </g>
      {alpha < 0 && (
        <text x={24} y={14} fontSize="9.5" fill="var(--neg)">
          ◀ below zero ({fmt3(alpha)})
        </text>
      )}
    </svg>
  );
}

/* ---------------- why alpha moves: two variances ---------------- */

function VarianceBars({ parts, alpha }: { parts: ReturnType<typeof alphaParts>; alpha: number }) {
  const max = Math.max(parts.totalVariance, parts.sumOfItemVariances);
  const W = (v: number) => (v / max) * 100;
  return (
    <div className="space-y-2 text-sm">
      <div>
        <p className="text-xs text-muted">Sum of the {parts.k} item variances: {fmt(parts.sumOfItemVariances)}</p>
        <div className="mt-1 h-3 rounded bg-surface-3">
          <div className="h-3 rounded bg-muted transition-all duration-500" style={{ width: `${W(parts.sumOfItemVariances)}%` }} />
        </div>
      </div>
      <div>
        <p className="text-xs text-muted">Variance of the respondents&rsquo; summed score: {fmt(parts.totalVariance)}</p>
        <div className="mt-1 h-3 rounded bg-surface-3">
          <div className="h-3 rounded bg-accent transition-all duration-500" style={{ width: `${W(parts.totalVariance)}%` }} />
        </div>
      </div>
      <p className="font-mono text-xs text-ink">
        α = {parts.k}/{parts.k - 1} × (1 − {fmt(parts.sumOfItemVariances)} / {fmt(parts.totalVariance)}) = {fmt3(alpha)}
      </p>
      <p className="text-xs text-muted">
        When items agree, high answers pile up on the same respondents, so the summed scores spread out far more than the
        items do one by one: the blue bar outgrows the grey one and alpha rises. Items that disagree cancel out in the sum.
      </p>
    </div>
  );
}

/* ---------------- correlation heatmap (a real table, so it is readable without colour) ---------------- */

function Heatmap({ reversed, included }: { reversed: boolean[]; included: boolean[] }) {
  const cols = useMemo(
    () => ITEMS.map((_, j) => RESPONSES.map((row) => (reversed[j] ? reverse(row[j]) : row[j]))),
    [reversed],
  );
  return (
    <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Correlations between the items as currently scored">
      <table className="border-separate border-spacing-0.5 text-[11px] tabular-nums">
        <caption className="pb-2 text-left text-xs text-muted">
          Correlations between items, as currently scored. <span className="text-accent">Blue</span>: they rise together;{" "}
          <span className="text-neg">red</span>: one rises as the other falls.
        </caption>
        <thead>
          <tr>
            <td />
            {ITEMS.map((it, j) => (
              <th key={it.id} scope="col" className={cn("px-1 font-medium text-muted", !included[j] && "text-faint line-through")}>
                {it.id}
                {reversed[j] && "ʳ"}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ITEMS.map((a, i) => (
            <tr key={a.id}>
              <th scope="row" className={cn("pr-1 text-left font-medium text-muted", !included[i] && "text-faint line-through")}>
                {a.id}
                {reversed[i] && "ʳ"}
              </th>
              {ITEMS.map((b, j) => {
                const r = i === j ? 1 : pearson(cols[i], cols[j]);
                const on = included[i] && included[j];
                return (
                  <td
                    key={b.id}
                    className={cn("h-9 w-11 rounded text-center", on ? "text-ink" : "text-faint")}
                    style={{
                      background:
                        i === j
                          ? "var(--surface-3)"
                          : `color-mix(in srgb, ${r >= 0 ? "var(--accent)" : "var(--neg)"} ${Math.round(Math.abs(r) * (on ? 70 : 25))}%, var(--surface))`,
                    }}
                  >
                    {i === j ? "" : fmt(r)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------- the builder ---------------- */

export function IndexBuilder() {
  const [reversed, setReversed] = useState<boolean[]>(ITEMS.map(() => false));
  const [included, setIncluded] = useState<boolean[]>(ITEMS.map(() => true));
  const [reveal, setReveal] = useState(false);

  const m = useMemo(() => scoredMatrix(included, reversed), [included, reversed]);
  const alpha = cronbachAlpha(m);
  const parts = alphaParts(m);
  const band = alphaBand(alpha);
  const nIn = included.filter(Boolean).length;

  // map SPSS item-total rows back to item positions
  const stats = useMemo(() => {
    const rows = itemTotalStatistics(m);
    const out: Array<ItemTotalRow | null> = [];
    let k = 0;
    for (const inc of included) out.push(inc ? rows[k++] : null);
    return out;
  }, [m, included]);

  const candidates = stats
    .map((s, j) => ({ j, s }))
    .filter((c): c is { j: number; s: ItemTotalRow } => c.s !== null);
  const best = nIn > MIN_ITEMS ? candidates.reduce((a, b) => (b.s.alphaIfDeleted > a.s.alphaIfDeleted ? b : a)) : null;
  // clearly negative, not just near zero: the signature of an item that runs the other way
  const negativeItem = candidates.find((c) => c.s.itemTotal < -0.1);
  // deleting only makes sense once every item points the same way
  const dropNext = !negativeItem && best && best.s.alphaIfDeleted > alpha ? best.j : null;

  let hint: string;
  if (negativeItem)
    hint = `${ITEMS[negativeItem.j].id} correlates negatively with the rest of the items. Read its wording: does agreeing with it mean more trust or less?`;
  else if (dropNext !== null)
    hint = `Every item now points the same way. Deleting ${ITEMS[dropNext].id} would raise alpha to ${fmt3(stats[dropNext]!.alphaIfDeleted)}: it is the one to look at next (one item at a time).`;
  else if (band.ok && ITEMS.every((it, j) => !included[j] || reversed[j] === !it.negative))
    hint = `Alpha is ${band.label}, but you reversed the trust items instead of the distrust items, so a high index now means LESS trust. That is allowed (alpha is the same either way), but the label must say so. Reversing the smaller group, here T3 and T5, is less work.`;
  else if (band.ok) hint = `Done: alpha is ${band.label}, and deleting any further item would not raise it. Average the ${nIn} items to get the index.`;
  else hint = "No single deletion raises alpha any more. The items may not measure one concept: rethink them rather than dropping more.";

  const toggle = (arr: boolean[], set: (v: boolean[]) => void, j: number) => set(arr.map((v, k) => (k === j ? !v : v)));

  return (
    <Panel>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-serif text-xl font-semibold text-ink">Index builder: trust in science</h3>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            120 synthetic respondents answered six items ({SCALE_LABEL}). We want one index where a high value means
            more trust. Reverse the items that are worded the other way, then drop items that do not belong, one at a
            time, until alpha is acceptable. Keep at least {MIN_ITEMS} items.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setReversed(ITEMS.map(() => false));
            setIncluded(ITEMS.map(() => true));
            setReveal(false);
          }}
        >
          Start again
        </Button>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <ul className="space-y-2" aria-label="Items">
          {ITEMS.map((it, j) => {
            const s = stats[j];
            const low = s && s.itemTotal < LOW_ITEM_TOTAL;
            return (
              <li
                key={it.id}
                className={cn(
                  "rounded-xl border p-3 transition-colors",
                  included[j] ? "border-line bg-surface" : "border-dashed border-line-strong bg-surface-2",
                  dropNext === j && "border-warn ring-1 ring-warn/40",
                )}
              >
                <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
                  <span className="font-mono text-sm font-semibold text-ink">
                    {it.id}
                    {reversed[j] && <span className="text-accent">ʳ</span>}
                  </span>
                  <p className={cn("min-w-[12rem] flex-1 text-sm text-ink", !included[j] && "line-through")}>{it.text}</p>
                  <div className="ml-auto flex gap-1.5">
                    <Button
                      size="sm"
                      variant={reversed[j] ? "primary" : "secondary"}
                      aria-pressed={reversed[j]}
                      aria-label={`Reverse-score ${it.id}`}
                      onClick={() => toggle(reversed, setReversed, j)}
                    >
                      {reversed[j] ? "Reversed" : "Reverse"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-pressed={!included[j]}
                      aria-label={`${included[j] ? "Delete" : "Restore"} ${it.id}`}
                      disabled={included[j] && nIn <= MIN_ITEMS}
                      onClick={() => toggle(included, setIncluded, j)}
                    >
                      {included[j] ? "Delete" : "Restore"}
                    </Button>
                  </div>
                </div>
                {s && (
                  <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 pl-8 font-mono text-xs text-muted">
                    <span className={cn(low && "font-semibold text-neg")}>
                      item-total r = {fmt3(s.itemTotal)}
                      {low && " (below .25)"}
                    </span>
                    <span className={cn(dropNext === j && "font-semibold text-warn")}>
                      α if deleted = {fmt3(s.alphaIfDeleted)}
                    </span>
                  </p>
                )}
                {reveal && <p className="mt-1.5 pl-8 text-xs text-faint">{it.note}</p>}
              </li>
            );
          })}
        </ul>

        <div className="space-y-6">
          <div>
            <p className="text-sm text-muted">
              Cronbach&rsquo;s alpha of the {nIn} kept items
            </p>
            <p className="font-serif text-4xl font-semibold tabular-nums text-ink">{fmt3(alpha)}</p>
            <p className={cn("text-sm font-medium", band.ok ? "text-pos" : "text-neg")}>{band.label}</p>
            <AlphaGauge alpha={alpha} />
          </div>
          <VarianceBars parts={parts} alpha={alpha} />
        </div>
      </div>

      <p role="status" className="mt-6 rounded-lg bg-accent-soft px-4 py-3 text-sm text-ink">
        {hint}
      </p>

      <div className="mt-8 grid gap-6 md:grid-cols-[auto_minmax(0,1fr)] md:items-start">
        <Heatmap reversed={reversed} included={included} />
        <div className="space-y-3 text-sm text-muted">
          <p>
            Before reversing, T3 and T5 show <span className="text-neg">red</span> rows: people who trust science
            <em> disagree</em> with them. Reverse them and the whole table turns blue, except one item that stays pale
            next to everything else.
          </p>
          <p>
            Alpha only checks that items move together. It cannot tell you <em>what</em> they measure: that is decided by
            reading the items.
          </p>
          <Button size="sm" onClick={() => setReveal((r) => !r)} aria-pressed={reveal}>
            {reveal ? "Hide the item design" : "Reveal how the items were designed"}
          </Button>
        </div>
      </div>
    </Panel>
  );
}
