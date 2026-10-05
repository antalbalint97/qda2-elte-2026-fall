"use client";

import { CONCEPTS, type ConceptId } from "@/content/concepts";
import { QUICK_REVIEW } from "@/content/questions";
import type { Question } from "@/content/quiz-types";
import { cn } from "@/lib/cn";
import { conceptStats, resetProgress, useProgress } from "@/lib/progress";
import Link from "next/link";
import { useState } from "react";
import { QuestionView } from "./QuestionView";

function shuffled<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

export function ReviewMode() {
  const progress = useProgress();
  const [deck, setDeck] = useState<Question[]>(QUICK_REVIEW);
  const [i, setI] = useState(0);
  const [session, setSession] = useState<Record<string, boolean>>({});
  const [round, setRound] = useState(0);
  const q = deck[i];
  const answered = Object.keys(session).length;
  const right = Object.values(session).filter(Boolean).length;
  const stats = conceptStats(progress);
  const weak = (Object.entries(stats) as Array<[ConceptId, { right: number; wrong: number }]>)
    .filter(([, s]) => s.wrong > 0)
    .sort((a, b) => b[1].wrong - a[1].wrong);
  const finished = answered === deck.length;

  function newRound(questions: Question[]) {
    setDeck(questions);
    setI(0);
    setSession({});
    setRound((r) => r + 1);
  }

  const weakDeck = QUICK_REVIEW.filter((qq) => weak.some(([c]) => c === qq.concept));

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_17rem]">
      <div className="rounded-2xl border border-line bg-surface">
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-6">
          <p className="font-mono text-xs text-faint">
            Question {i + 1} / {deck.length}
          </p>
          <div className="h-1.5 w-40 overflow-hidden rounded-full bg-surface-3" aria-hidden>
            <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${(answered / deck.length) * 100}%` }} />
          </div>
        </div>
        <div className="min-h-[24rem] p-4 sm:p-6">
          {finished ? (
            <div className="animate-fade-up py-10 text-center">
              <p className="font-serif text-3xl font-semibold text-ink">
                {right} / {deck.length}
              </p>
              <p className="mt-2 text-muted">
                {right === deck.length
                  ? "Every answer correct on the first try."
                  : "Round complete. The concepts you missed are listed on the right, with links back to the modules."}
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                <button type="button" onClick={() => newRound(shuffled(QUICK_REVIEW))} className="h-10 rounded-lg bg-accent px-4 text-sm font-medium text-accent-ink">
                  New mixed round
                </button>
                {weakDeck.length > 0 && (
                  <button type="button" onClick={() => newRound(shuffled(weakDeck))} className="h-10 rounded-lg border border-line px-4 text-sm font-medium text-ink hover:bg-surface-2">
                    Practise weak concepts ({weakDeck.length})
                  </button>
                )}
              </div>
            </div>
          ) : (
            <QuestionView
              key={`${round}-${q.id}`}
              q={q}
              onAnswered={(ok) => setSession((s) => (q.id in s ? s : { ...s, [q.id]: ok }))}
            />
          )}
        </div>
        {!finished && (
          <div className="flex items-center justify-between border-t border-line px-4 py-3 sm:px-6">
            <button type="button" disabled={i === 0} onClick={() => setI(i - 1)} className="text-sm font-medium text-muted hover:text-ink disabled:opacity-30">
              ← Previous
            </button>
            <button
              type="button"
              onClick={() => {
                const next = deck.findIndex((qq, k) => k > i && !(qq.id in session));
                const any = deck.findIndex((qq) => !(qq.id in session));
                setI(next >= 0 ? next : any >= 0 ? any : i);
              }}
              disabled={!(q.id in session) && i === deck.length - 1}
              className="text-sm font-medium text-accent hover:underline disabled:opacity-30"
            >
              {q.id in session ? "Next question →" : "Skip →"}
            </button>
          </div>
        )}
      </div>

      <aside className="space-y-4 self-start lg:sticky lg:top-20">
        <div className="grid grid-cols-3 gap-2 lg:grid-cols-1">
          {[
            ["Current streak", progress.streak],
            ["Correct this round", `${right}/${answered}`],
            ["Best streak", progress.bestStreak],
          ].map(([k, v]) => (
            <div key={k as string} className="rounded-xl border border-line bg-surface px-3.5 py-2.5">
              <p className="text-[11px] text-muted">{k}</p>
              <p className="font-mono text-xl font-semibold tabular-nums text-ink">{v}</p>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-line bg-surface p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-faint">Concepts needing review</p>
          {weak.length === 0 ? (
            <p className="mt-2 text-sm text-muted">Nothing yet. Missed concepts appear here as you answer.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {weak.map(([c, s]) => (
                <li key={c} className="flex items-center justify-between gap-2 text-sm">
                  <Link href={CONCEPTS[c].href} className="font-medium text-ink hover:text-accent">
                    {CONCEPTS[c].label}
                  </Link>
                  <span className={cn("shrink-0 font-mono text-xs", s.wrong > s.right ? "text-neg" : "text-warn")}>
                    {s.right}/{s.right + s.wrong}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 px-1 text-xs">
          <button type="button" onClick={() => newRound(shuffled(QUICK_REVIEW))} className="text-muted hover:text-ink">
            Shuffle questions
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirm("Clear all saved progress in this browser?")) {
                resetProgress();
                newRound(QUICK_REVIEW);
              }
            }}
            className="text-muted hover:text-neg"
          >
            Reset progress
          </button>
        </div>
        <p className="px-1 text-[11px] leading-relaxed text-faint">
          Progress counts your first attempt at each question across the whole site and is stored only in this browser.
        </p>
      </aside>
    </div>
  );
}
