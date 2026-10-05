import { ReviewMode } from "@/components/quiz/ReviewMode";
import { QUICK_REVIEW } from "@/content/questions";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Quick review" };

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-10 sm:px-6 sm:pt-14">
      <p className="font-mono text-xs tracking-widest text-faint">QUICK REVIEW</p>
      <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight text-ink sm:text-5xl">Mixed practice</h1>
      <p className="mt-3 max-w-2xl text-lg leading-relaxed text-muted">
        {QUICK_REVIEW.length} questions across all six modules. Answer, read why, move on. Wrong answers name the exact
        idea that got mixed up.
      </p>
      <div className="mt-10">
        <ReviewMode />
      </div>
    </div>
  );
}
