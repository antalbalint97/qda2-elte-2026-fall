import { ChainBar } from "./ChainBar";
import type { ModuleMeta } from "@/content/modules";
import { MODULES } from "@/content/modules";
import { cn } from "@/lib/cn";
import Link from "next/link";
import type { ReactNode } from "react";

const STEP_LINKS = [
  { id: "understand", label: "Understand" },
  { id: "try", label: "Try" },
  { id: "spss", label: "SPSS" },
  { id: "test", label: "Test yourself" },
];

export function ModuleShell({ meta, lede, children }: { meta: ModuleMeta; lede: ReactNode; children: ReactNode }) {
  const i = MODULES.findIndex((m) => m.slug === meta.slug);
  const prev = MODULES[i - 1];
  const next = MODULES[i + 1];
  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 sm:px-6">
      <header className="pt-10 pb-8 sm:pt-14">
        <p className="font-mono text-xs tracking-widest text-faint">MODULE {meta.number}</p>
        <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight text-ink sm:text-5xl">{meta.title}</h1>
        <div className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">{lede}</div>
        <div className="mt-6">
          <ChainBar active={meta.chain} />
        </div>
      </header>
      <nav
        aria-label="Module sections"
        className="sticky top-14 z-20 -mx-4 mb-10 border-y border-line bg-bg/85 px-4 backdrop-blur sm:-mx-6 sm:px-6"
      >
        <ol className="flex gap-1 overflow-x-auto py-2 text-sm">
          {STEP_LINKS.map((s, n) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className="flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-1.5 text-muted hover:bg-surface-2 hover:text-ink"
              >
                <span className="font-mono text-[11px] text-faint">{n + 1}</span>
                {s.label}
              </a>
            </li>
          ))}
        </ol>
      </nav>
      <div className="space-y-20">{children}</div>
      <footer className="mt-24 grid gap-3 border-t border-line pt-8 sm:grid-cols-2">
        {prev ? (
          <Link href={prev.href} className="group rounded-xl border border-line p-4 hover:border-line-strong">
            <span className="text-xs text-faint">← Previous</span>
            <span className="mt-1 block font-medium text-ink group-hover:text-accent">{prev.title}</span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={next.href}
            className="group rounded-xl border border-line p-4 text-right hover:border-line-strong"
          >
            <span className="text-xs text-faint">Next →</span>
            <span className="mt-1 block font-medium text-ink group-hover:text-accent">{next.title}</span>
          </Link>
        ) : (
          <Link href="/review" className="group rounded-xl border border-line p-4 text-right hover:border-line-strong">
            <span className="text-xs text-faint">Finish with →</span>
            <span className="mt-1 block font-medium text-ink group-hover:text-accent">Quick review</span>
          </Link>
        )}
      </footer>
    </div>
  );
}

const KIND_LABEL = {
  understand: "Understand",
  try: "Try",
  spss: "SPSS",
  test: "Test yourself",
} as const;

/** One of the four learning steps of a module. Several sub-sections can share a kind. */
export function Step({
  kind,
  id,
  title,
  intro,
  children,
  className,
}: {
  kind: keyof typeof KIND_LABEL;
  id?: string;
  title: ReactNode;
  intro?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={cn("scroll-mt-32", className)}>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">{KIND_LABEL[kind]}</p>
      <h2 className="mt-1.5 font-serif text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{title}</h2>
      {intro && <div className="mt-3 max-w-3xl leading-relaxed text-muted">{intro}</div>}
      <div className="mt-7">{children}</div>
    </section>
  );
}

/** A quiet bordered surface for interactive work areas. */
export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-2xl border border-line bg-surface p-4 sm:p-6", className)}>{children}</div>;
}
