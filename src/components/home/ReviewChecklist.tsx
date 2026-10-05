"use client";

import { CONCEPTS, type ConceptId } from "@/content/concepts";
import { REVIEW_TOPICS } from "@/content/modules";
import { cn } from "@/lib/cn";
import { conceptStats, setSelfRating, useProgress } from "@/lib/progress";
import Link from "next/link";

export function ReviewChecklist() {
  const p = useProgress();
  const stats = conceptStats(p);
  const weak = (Object.entries(stats) as Array<[ConceptId, { right: number; wrong: number }]>)
    .filter(([, s]) => s.wrong > 0)
    .sort((a, b) => b[1].wrong - a[1].wrong)
    .slice(0, 4);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <div className="rounded-2xl border border-line bg-surface">
        <div className="border-b border-line px-4 py-3 sm:px-5">
          <p className="text-sm text-muted">
            Mark how confident you feel, then jump to the part you need. Your marks stay in this browser.
          </p>
        </div>
        <ul className="divide-y divide-line">
          {REVIEW_TOPICS.map((t) => {
            const r = p.selfRatings[t.id];
            return (
              <li key={t.id} className="flex items-center gap-3 px-4 py-2.5 sm:px-5">
                <span
                  className={cn(
                    "h-2 w-2 shrink-0 rounded-full",
                    r === "ok" ? "bg-pos" : r === "review" ? "bg-warn" : "bg-surface-3",
                  )}
                  aria-hidden
                />
                <Link href={t.href} className="flex-1 text-sm font-medium text-ink hover:text-accent">
                  {t.label}
                </Link>
                <div className="flex gap-1" role="group" aria-label={`Confidence: ${t.label}`}>
                  <button
                    type="button"
                    aria-pressed={r === "review"}
                    onClick={() => setSelfRating(t.id, r === "review" ? null : "review")}
                    className={cn(
                      "rounded-md px-2 py-1 text-xs transition-colors",
                      r === "review" ? "bg-warn-soft font-medium text-warn" : "text-faint hover:text-ink",
                    )}
                  >
                    Review
                  </button>
                  <button
                    type="button"
                    aria-pressed={r === "ok"}
                    onClick={() => setSelfRating(t.id, r === "ok" ? null : "ok")}
                    className={cn(
                      "rounded-md px-2 py-1 text-xs transition-colors",
                      r === "ok" ? "bg-pos-soft font-medium text-pos" : "text-faint hover:text-ink",
                    )}
                  >
                    Confident
                  </button>
                </div>
                <Link href={t.href} aria-label={`Go to ${t.label}`} className="text-faint hover:text-accent">
                  →
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="rounded-2xl border border-line bg-surface-2 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-faint">Based on your answers</p>
        {weak.length === 0 ? (
          <div className="mt-3 space-y-3 text-sm text-muted">
            <p>No mistakes recorded yet. Answer a few questions and the concepts you miss will show up here.</p>
            <Link href="/review" className="inline-block font-medium text-accent hover:underline">
              Take the quick review →
            </Link>
          </div>
        ) : (
          <ul className="mt-3 space-y-2.5">
            {weak.map(([c, s]) => (
              <li key={c}>
                <Link href={CONCEPTS[c].href} className="group flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium text-ink group-hover:text-accent">{CONCEPTS[c].label}</span>
                  <span className="font-mono text-xs text-faint">
                    {s.wrong} missed · {s.right} right
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
