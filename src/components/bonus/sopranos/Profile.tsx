"use client";

import { PROFILE_LABEL, PROFILE_OF, type ProfileCategory } from "@/content/sopranos/questions";
import { resetAnswers, useProgress } from "@/lib/progress";

const ANCHOR: Record<ProfileCategory, string> = {
  levels: "#variables",
  descriptives: "#frequencies",
  crosstabs: "#crosstab",
  p: "#trial",
  lazarsfeld: "#lazarsfeld",
  correlation: "#correlation",
  t: "#t-tests",
};

/** Final report built from first attempts at the lab's questions (stored in this browser). */
export function Profile() {
  const progress = useProgress();
  const totals = Object.fromEntries(
    (Object.keys(PROFILE_LABEL) as ProfileCategory[]).map((c) => [
      c,
      { right: 0, done: 0, total: Object.values(PROFILE_OF).filter((v) => v === c).length },
    ]),
  ) as Record<ProfileCategory, { right: number; done: number; total: number }>;
  for (const [id, a] of Object.entries(progress.answers)) {
    const c = PROFILE_OF[id];
    if (!c) continue;
    totals[c].done++;
    if (a.correct) totals[c].right++;
  }
  const cats = Object.keys(totals) as ProfileCategory[];
  const answered = cats.filter((c) => totals[c].done > 0);
  const ratio = (c: ProfileCategory) => totals[c].right / totals[c].done;
  const strongest = [...answered].sort((a, b) => ratio(b) - ratio(a) || totals[b].done - totals[a].done)[0];
  const weakest = [...answered].sort((a, b) => ratio(a) - ratio(b))[0];
  const untouched = cats.filter((c) => totals[c].done === 0);
  const reviewNext = weakest && ratio(weakest) < 1 ? weakest : untouched[0];
  const doneAll = cats.reduce((s, c) => s + totals[c].done, 0);
  const totalAll = cats.reduce((s, c) => s + totals[c].total, 0);

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-line-strong bg-surface">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-dashed border-line-strong px-4 py-3 sm:px-6">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-ink">Simon&apos;s Sopranos statistical profile</p>
          <p className="font-mono text-xs text-faint">
            {doneAll} / {totalAll} questions attempted
          </p>
        </div>
        <ul className="divide-y divide-line">
          {cats.map((c) => {
            const t = totals[c];
            return (
              <li key={c} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 px-4 py-3 sm:grid-cols-[14rem_minmax(0,1fr)_5rem] sm:px-6">
                <a href={ANCHOR[c]} className="text-sm font-medium text-ink hover:text-accent">
                  {PROFILE_LABEL[c]}
                </a>
                <span className="order-3 col-span-2 flex h-2 overflow-hidden rounded-full bg-surface-3 sm:order-none sm:col-span-1" aria-hidden>
                  <span className="h-full bg-pos" style={{ width: `${(t.right / t.total) * 100}%` }} />
                  <span className="h-full bg-neg/60" style={{ width: `${((t.done - t.right) / t.total) * 100}%` }} />
                </span>
                <span className="text-right font-mono text-sm tabular-nums text-ink">
                  {t.right} / {t.done}
                  <span className="text-faint"> of {t.total}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-pos/30 bg-pos-soft p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-pos">Strongest area</p>
          <p className="mt-1 font-serif text-xl text-ink">{strongest ? PROFILE_LABEL[strongest] : "Not enough answers yet"}</p>
          {strongest && (
            <p className="text-xs text-muted">
              {totals[strongest].right} of {totals[strongest].done} right on the first attempt
            </p>
          )}
        </div>
        <div className="rounded-xl border border-accent/30 bg-accent-soft p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">Review next</p>
          <p className="mt-1 font-serif text-xl text-ink">
            {reviewNext ? (
              <a href={ANCHOR[reviewNext]} className="hover:underline">
                {PROFILE_LABEL[reviewNext]}
              </a>
            ) : (
              "Nothing flagged. Clean sheet."
            )}
          </p>
          {reviewNext && (
            <p className="text-xs text-muted">
              {totals[reviewNext].done === 0
                ? "Not attempted yet"
                : `${totals[reviewNext].right} of ${totals[reviewNext].done} right on the first attempt`}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-faint">
        <p className="max-w-xl leading-relaxed">
          Practice only: this is not a course grade. Only first attempts count, and they are stored in this browser and nowhere else.
        </p>
        <button
          type="button"
          onClick={() => {
            if (confirm("Clear your answers in the Sopranos lab? (The rest of the QDA2 Lab is not affected.)")) resetAnswers("sop-");
          }}
          className="font-medium text-muted hover:text-neg"
        >
          Reset this lab
        </button>
      </div>
    </div>
  );
}
