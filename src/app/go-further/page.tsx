import { AdvancedLab } from "@/components/advanced/AdvancedLab";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Go Further | QDA2",
  description: "Optional advanced extensions for QDA2 students who want to explore beyond the course minimum.",
};

export default function GoFurtherPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 pb-24 sm:px-6">
      <header className="pt-10 pb-8 sm:pt-14">
        <div className="flex flex-wrap items-center gap-3">
          <p className="font-mono text-xs tracking-widest text-faint">OPTIONAL / ADVANCED</p>
          <span className="rounded-full border border-warn/30 bg-warn-soft px-2.5 py-1 text-xs font-semibold text-warn">
            Not part of basic mastery
          </span>
        </div>
        <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight text-ink sm:text-5xl">Go Further</h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-muted">
          Advanced tools for students who want to go beyond the required course minimum. You do not need these topics
          for the basic task. They explain ideas that already appeared in some homework submissions and questions.
        </p>
        <div className="mt-6 rounded-2xl border border-line bg-surface-2 p-5 text-sm leading-relaxed text-muted">
          <strong className="text-ink">The rule:</strong> choose a statistic because the measurement level and research
          question justify it, not because SPSS offers a checkbox.
        </div>
      </header>
      <AdvancedLab />
    </main>
  );
}
