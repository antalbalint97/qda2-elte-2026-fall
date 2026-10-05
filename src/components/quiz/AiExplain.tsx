"use client";

import { buildExplainPayload, explainMistake } from "@/lib/ai";
import type { ConceptId } from "@/content/concepts";
import { useState } from "react";

export function AiExplain(props: {
  concept: ConceptId;
  question: string;
  correctAnswer: string;
  studentAnswer: string;
  hint?: string;
}) {
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const [text, setText] = useState("");
  const payload = buildExplainPayload(props);

  if (state === "idle")
    return (
      <button
        type="button"
        onClick={async () => {
          setState("loading");
          setText(await explainMistake(payload, props.hint));
          setState("done");
        }}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-accent"
      >
        <svg aria-hidden viewBox="0 0 16 16" className="h-3.5 w-3.5">
          <path d="M8 2v3M8 11v3M2 8h3M11 8h3M4 4l1.8 1.8M10.2 10.2L12 12M12 4l-1.8 1.8M5.8 10.2L4 12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
        Explain why my answer was wrong
        <span className="rounded border border-line px-1 text-[10px] uppercase tracking-wide text-faint">preview</span>
      </button>
    );

  return (
    <div className="rounded-lg border border-line bg-surface p-3 text-sm" aria-live="polite">
      {state === "loading" ? (
        <div className="space-y-2" aria-label="Generating explanation">
          <div className="h-2.5 w-11/12 animate-pulse rounded bg-surface-3" />
          <div className="h-2.5 w-4/5 animate-pulse rounded bg-surface-3" />
          <div className="h-2.5 w-2/3 animate-pulse rounded bg-surface-3" />
        </div>
      ) : (
        <>
          <p className="leading-relaxed text-ink/85">{text}</p>
          <details className="mt-2 text-xs text-faint">
            <summary className="cursor-pointer select-none">
              Preview mode: no AI service is connected. See the request it would send.
            </summary>
            <pre className="mt-2 overflow-x-auto rounded bg-surface-2 p-2 font-mono text-[11px] leading-relaxed text-muted">
              {JSON.stringify(payload, null, 2)}
            </pre>
          </details>
        </>
      )}
    </div>
  );
}
