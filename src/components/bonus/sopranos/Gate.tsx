"use client";

import { ChoiceQuestionView } from "@/components/quiz/ChoiceQuestionView";
import type { ChoiceQuestion } from "@/content/quiz-types";
import { useState, type ReactNode } from "react";

/**
 * Statistical reasoning before software: the SPSS procedure (children) stays locked
 * until the conceptual question has been answered.
 */
export function Gate({ q, children, lockedLabel = "SPSS procedure" }: { q: ChoiceQuestion; children: ReactNode; lockedLabel?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-line bg-surface p-4 sm:p-6">
        <ChoiceQuestionView q={q} onAnswered={() => setOpen(true)} />
      </div>
      {open ? (
        <div className="animate-fade-up space-y-5">{children}</div>
      ) : (
        <div className="flex items-center gap-3 rounded-xl border border-dashed border-line-strong px-4 py-3 text-sm text-faint">
          <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0" aria-hidden>
            <rect x="3" y="7" width="10" height="7" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
            <path d="M5.5 7V5a2.5 2.5 0 015 0v2" fill="none" stroke="currentColor" strokeWidth="1.3" />
          </svg>
          {lockedLabel} unlocks after you answer the question above. Statistics first, buttons second.
        </div>
      )}
    </div>
  );
}
