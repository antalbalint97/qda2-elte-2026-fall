"use client";

import { Feedback } from "@/components/learning/Feedback";
import type { OrderQuestion } from "@/content/quiz-types";
import { cn } from "@/lib/cn";
import { recordAnswer } from "@/lib/progress";
import { useLayoutEffect, useRef, useState } from "react";
import { AiExplain } from "./AiExplain";

/** Ordering task: drag and drop with the mouse, or move items with the arrow buttons (keyboard and touch). */
export function OrderQuestionView({
  q,
  onAnswered,
  showFormat = true,
}: {
  q: OrderQuestion;
  onAnswered?: (correct: boolean) => void;
  showFormat?: boolean;
}) {
  const [order, setOrder] = useState<string[]>(q.initial);
  const [submitted, setSubmitted] = useState<null | boolean>(null);
  const [revealed, setRevealed] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const els = useRef(new Map<string, HTMLLIElement>());
  const rects = useRef(new Map<string, DOMRect>());
  const byId = Object.fromEntries(q.items.map((it) => [it.id, it]));
  const correctIds = q.items.map((it) => it.id);
  const firstWrongOrder = useRef<string[] | null>(null);
  const [placedRight, setPlacedRight] = useState(0);

  // FLIP animation: every reorder slides items from their old to their new position.
  function snapshot() {
    els.current.forEach((el, id) => rects.current.set(id, el.getBoundingClientRect()));
  }
  useLayoutEffect(() => {
    els.current.forEach((el, id) => {
      const before = rects.current.get(id);
      if (!before) return;
      const after = el.getBoundingClientRect();
      const dy = before.top - after.top;
      if (!dy) return;
      el.style.transition = "none";
      el.style.transform = `translateY(${dy}px)`;
      requestAnimationFrame(() => {
        el.style.transition = "transform 450ms cubic-bezier(.2,.7,.2,1)";
        el.style.transform = "";
      });
    });
    rects.current.clear();
  }, [order]);

  function move(from: number, to: number) {
    if (to < 0 || to >= order.length || submitted !== null) return;
    snapshot();
    const next = [...order];
    const [it] = next.splice(from, 1);
    next.splice(to, 0, it);
    setOrder(next);
  }

  function submit() {
    const ok = order.every((id, i) => id === correctIds[i]);
    firstWrongOrder.current = ok ? null : order;
    setPlacedRight(order.filter((id, i) => id === correctIds[i]).length);
    setSubmitted(ok);
    recordAnswer(q.id, q.concept, ok);
    onAnswered?.(ok);
  }

  function reveal() {
    snapshot();
    setRevealed(true);
    setOrder(correctIds);
  }

  function reset() {
    snapshot();
    setSubmitted(null);
    setRevealed(false);
    setOrder(q.initial);
  }

  return (
    <div className="space-y-4">
      <div>
        {showFormat && (
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">{q.format}</p>
        )}
        <p className="text-base leading-relaxed text-ink sm:text-lg">{q.prompt}</p>
        {submitted === null && (
          <p className="mt-1 text-xs text-faint">Drag the steps, or use the arrow buttons to move them.</p>
        )}
      </div>
      <ol className="space-y-2">
        {order.map((id, i) => {
          const it = byId[id];
          const status = submitted === null ? "idle" : correctIds[i] === id ? "ok" : "bad";
          return (
            <li
              key={id}
              ref={(el) => {
                if (el) els.current.set(id, el);
                else els.current.delete(id);
              }}
              draggable={submitted === null}
              onDragStart={(e) => {
                setDragId(id);
                e.dataTransfer.effectAllowed = "move";
              }}
              onDragEnd={() => setDragId(null)}
              onDragOver={(e) => {
                e.preventDefault();
                if (dragId && dragId !== id) move(order.indexOf(dragId), i);
              }}
              className={cn(
                "flex items-center gap-3 rounded-xl border bg-surface px-3 py-2.5 text-sm",
                submitted === null && "cursor-grab active:cursor-grabbing",
                dragId === id && "opacity-60 ring-2 ring-accent/40",
                status === "idle" && "border-line",
                status === "ok" && "border-pos/50 bg-pos-soft",
                status === "bad" && "border-neg/50 bg-neg-soft",
              )}
            >
              <span
                className={cn(
                  "grid h-6 w-6 shrink-0 place-items-center rounded-full font-mono text-xs font-semibold",
                  status === "ok" ? "bg-pos text-white" : status === "bad" ? "bg-neg text-white" : "bg-surface-3 text-muted",
                )}
              >
                {i + 1}
              </span>
              <span className="flex-1 leading-snug text-ink">{it.label}</span>
              {submitted === null && (
                <span className="flex shrink-0 flex-col">
                  <button
                    type="button"
                    aria-label={`Move “${it.label}” up`}
                    disabled={i === 0}
                    onClick={() => move(i, i - 1)}
                    className="rounded p-0.5 text-faint hover:bg-surface-2 hover:text-ink disabled:opacity-25"
                  >
                    <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden>
                      <path d="M4 10l4-4 4 4" fill="none" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    aria-label={`Move “${it.label}” down`}
                    disabled={i === order.length - 1}
                    onClick={() => move(i, i + 1)}
                    className="rounded p-0.5 text-faint hover:bg-surface-2 hover:text-ink disabled:opacity-25"
                  >
                    <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden>
                      <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  </button>
                </span>
              )}
            </li>
          );
        })}
      </ol>
      <div className="flex flex-wrap gap-2">
        {submitted === null && (
          <button
            type="button"
            onClick={submit}
            className="h-10 rounded-lg bg-accent px-4 text-sm font-medium text-accent-ink hover:opacity-90"
          >
            Check order
          </button>
        )}
        {submitted === false && !revealed && (
          <button
            type="button"
            onClick={reveal}
            className="h-10 rounded-lg bg-accent px-4 text-sm font-medium text-accent-ink hover:opacity-90"
          >
            Show the correct order
          </button>
        )}
        {submitted !== null && (
          <button
            type="button"
            onClick={reset}
            className="h-10 rounded-lg border border-line bg-surface px-4 text-sm font-medium text-ink hover:bg-surface-2"
          >
            Try again
          </button>
        )}
      </div>
      {submitted === true && (
        <Feedback tone="correct">
          <p>{q.explanation}</p>
        </Feedback>
      )}
      {submitted === false && (
        <Feedback
          tone="incorrect"
          title={`${placedRight} of ${order.length} steps were in the right place`}
        >
          <p>{q.explanation}</p>
          {!revealed && <p>Reveal the correct order to see why each step comes before the next.</p>}
        </Feedback>
      )}
      {submitted === false && (
        <AiExplain
          concept={q.concept}
          question={q.prompt}
          correctAnswer={q.items.map((it) => it.label).join(" → ")}
          studentAnswer={(firstWrongOrder.current ?? order).map((id) => byId[id].label).join(" → ")}
        />
      )}
      {(submitted === true || revealed) && q.items.some((it) => it.why) && (
        <ol className="animate-fade-up space-y-2 border-l-2 border-accent/30 pl-4">
          {q.items.map((it, i) => (
            <li key={it.id} className="text-sm leading-relaxed text-muted">
              <span className="font-semibold text-ink">Step {i + 1}. </span>
              {it.why}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
