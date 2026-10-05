"use client";

import { cn } from "@/lib/cn";
import { useState, useSyncExternalStore } from "react";

const KEY = "qda2-sopranos-notes-v1";
const listeners = new Set<() => void>();
let cache: Record<string, string> | null = null;

function read(): Record<string, string> {
  if (cache) return cache;
  try {
    cache = JSON.parse(window.localStorage.getItem(KEY) ?? "{}");
  } catch {
    cache = {};
  }
  return cache!;
}

function write(id: string, text: string) {
  cache = { ...read(), [id]: text };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    // storage unavailable: the draft lives for this page view only
  }
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/**
 * Free-text write-up. Not auto-graded: the student compares their own text with a model answer
 * and a checklist of what a good result sentence contains. Drafts are kept in this browser.
 */
export function WriteUp({
  id,
  prompt,
  model,
  checklist,
  rows = 3,
  causalWarning = true,
}: {
  id: string;
  prompt: string;
  model: string;
  checklist: string[];
  rows?: number;
  causalWarning?: boolean;
}) {
  const text = useSyncExternalStore(subscribe, () => read()[id] ?? "", () => "");
  const [shown, setShown] = useState(false);
  const [ticks, setTicks] = useState<boolean[]>(() => checklist.map(() => false));
  const causal = causalWarning && /\b(caus\w*|leads? to|results? in|effect of)\b/i.test(text);

  return (
    <div className="space-y-3 rounded-2xl border border-line bg-surface p-4 sm:p-6">
      <label htmlFor={`wu-${id}`} className="block text-base leading-relaxed text-ink">
        {prompt}
      </label>
      <textarea
        id={`wu-${id}`}
        rows={rows}
        value={text}
        onChange={(e) => write(id, e.target.value)}
        placeholder="Write your result here…"
        className="w-full resize-y rounded-lg border border-line bg-bg px-3 py-2 font-serif text-[15px] leading-relaxed text-ink outline-none placeholder:text-faint focus:border-accent"
      />
      {causal && (
        <p className="rounded-lg bg-warn-soft px-3 py-2 text-xs text-warn">
          Your text uses causal wording. Fine if you are saying what the data cannot show; otherwise prefer “is associated with”.
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setShown(true)}
          disabled={text.trim().length < 15}
          className="h-9 rounded-lg bg-accent px-3.5 text-sm font-medium text-accent-ink hover:opacity-90 disabled:opacity-40"
        >
          Compare with a model answer
        </button>
        {text.trim().length < 15 && <span className="text-xs text-faint">Write a sentence first.</span>}
      </div>
      {shown && (
        <div className="animate-fade-up space-y-3">
          <div className="rounded-xl border border-pos/30 bg-pos-soft p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-pos">Model answer</p>
            <p className="mt-1 font-serif text-[15px] leading-relaxed text-ink">{model}</p>
          </div>
          <fieldset>
            <legend className="text-xs font-semibold uppercase tracking-[0.12em] text-faint">Does your version…</legend>
            <ul className="mt-2 space-y-1.5">
              {checklist.map((c, i) => (
                <li key={c}>
                  <label className="flex cursor-pointer items-start gap-2.5 text-sm text-ink">
                    <input
                      type="checkbox"
                      checked={ticks[i]}
                      onChange={() => setTicks((t) => t.map((v, k) => (k === i ? !v : v)))}
                      className="mt-0.5 h-4 w-4 accent-[var(--accent)]"
                    />
                    <span className={cn(ticks[i] && "text-muted line-through decoration-pos/60")}>{c}</span>
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>
        </div>
      )}
    </div>
  );
}
