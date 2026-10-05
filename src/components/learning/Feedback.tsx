import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

export type FeedbackTone = "correct" | "incorrect" | "partial";

const TONE = {
  correct: { box: "border-pos/30 bg-pos-soft", title: "text-pos", label: "Correct" },
  incorrect: { box: "border-neg/30 bg-neg-soft", title: "text-neg", label: "Not quite" },
  partial: { box: "border-warn/30 bg-warn-soft", title: "text-warn", label: "Defensible, with a caveat" },
};

function Icon({ tone }: { tone: FeedbackTone }) {
  if (tone === "correct")
    return (
      <path d="M4.5 8.5l2.2 2.2L11.5 5.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    );
  if (tone === "partial")
    return <path d="M8 4.5v4.2M8 11.2v.3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />;
  return <path d="M5.5 5.5l5 5m0-5l-5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />;
}

/** Feedback always explains why, never just right/wrong. */
export function Feedback({
  tone,
  title,
  children,
  className,
}: {
  tone: FeedbackTone;
  title?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const t = TONE[tone];
  return (
    <div role="status" aria-live="polite" className={cn("animate-fade-up rounded-xl border p-4", t.box, className)}>
      <p className={cn("flex items-center gap-2 text-sm font-semibold", t.title)}>
        <svg aria-hidden viewBox="0 0 16 16" className="h-4 w-4">
          <circle cx="8" cy="8" r="7.2" fill="none" stroke="currentColor" strokeWidth="1.2" />
          <Icon tone={tone} />
        </svg>
        {title ?? t.label}
      </p>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-ink/85">{children}</div>
    </div>
  );
}
