import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

/** One part of the lab: a sheet of case-file paper on the charcoal page. */
export function CaseSection({
  part,
  id,
  title,
  kicker,
  intro,
  aside,
  children,
}: {
  part: string;
  id: string;
  title: ReactNode;
  kicker: string;
  intro?: ReactNode;
  /** One restrained joke per section, at most. */
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28">
      <div className="relative overflow-hidden rounded-2xl border border-line-strong bg-bg shadow-[0_10px_40px_-12px_rgb(0_0_0/0.6)]">
        <div className="paper-grain absolute inset-x-0 top-0 h-24 opacity-70" aria-hidden />
        <header className="relative border-b border-dashed border-line-strong px-4 pb-5 pt-6 sm:px-8">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="rounded-sm border border-accent/50 px-1.5 py-0.5 font-mono text-[11px] font-semibold tracking-[0.18em] text-accent">
              PART {part}
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-faint">{kicker}</span>
          </div>
          <h2 className="mt-3 font-serif text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{title}</h2>
          {intro && <div className="mt-3 max-w-3xl leading-relaxed text-muted">{intro}</div>}
          {aside && <p className="mt-3 font-serif text-sm italic text-accent">{aside}</p>}
        </header>
        <div className="relative space-y-8 px-4 py-6 sm:px-8 sm:py-8">{children}</div>
      </div>
    </section>
  );
}

/** A labelled block inside a section (question cluster, output, exhibit). */
export function Exhibit({
  label,
  title,
  children,
  className,
}: {
  label?: string;
  title?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-4", className)}>
      {(label || title) && (
        <div>
          {label && <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-faint">{label}</p>}
          {title && <h3 className="mt-1 text-lg font-semibold text-ink">{title}</h3>}
        </div>
      )}
      {children}
    </div>
  );
}

/** Research question banner: the first thing asked in every part. */
export function ResearchQuestion({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border-l-4 border-accent bg-surface px-4 py-3">
      <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">Research question</p>
      <p className="mt-1 font-serif text-lg text-ink">{children}</p>
    </div>
  );
}

/** Synthetic-data marker used on every chart and table that shows dataset values. */
export function SyntheticTag({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm border border-dashed border-warn/60 bg-warn-soft px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-warn",
        className,
      )}
    >
      Synthetic data
    </span>
  );
}

export function HypotheticalTag({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm border border-dashed border-line-strong bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted",
        className,
      )}
    >
      Hypothetical tables
    </span>
  );
}
