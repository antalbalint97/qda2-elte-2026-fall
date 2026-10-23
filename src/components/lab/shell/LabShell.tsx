"use client";

import { maturityLabel, labMaturity } from "@/content/curriculum/lab-status";
import type { Lang } from "@/content/curriculum/types";
import { cn } from "@/lib/cn";
import Link from "next/link";
import { createContext, useContext, useState, type ReactNode } from "react";
import { common, type CommonStrings } from "./i18n";
import type { LabApi } from "./useLab";

interface LabCtx {
  lang: Lang;
  t: CommonStrings;
  locked: (key: string) => boolean;
  present: boolean;
  embedded: boolean;
}

const Ctx = createContext<LabCtx>({ lang: "en", t: common("en"), locked: () => false, present: false, embedded: false });
export const useLabContext = () => useContext(Ctx);

export interface TeachDemo {
  title: string;
  note: string;
  apply: () => void;
}

/**
 * Chrome shared by every lab: title bar with Teach / Share / Reset / language, instructor instructions,
 * the visualization (children) beside an aside of controls and readouts, and a footer with the method and
 * validation status. Teach mode covers the page, enlarges the content and hides the aside unless
 * `keepAsideInTeach` is set.
 */
export function LabShell<P extends Record<string, unknown>>({
  lab,
  title,
  subtitle,
  toolbar,
  children,
  aside,
  below,
  method,
  validation,
  synthetic = true,
  demos,
  keepAsideInTeach = false,
}: {
  lab: LabApi<P>;
  title: string;
  subtitle?: ReactNode;
  /** Extra controls in the title bar (stage tabs, scenario picker). */
  toolbar?: ReactNode;
  children: ReactNode;
  aside?: ReactNode;
  /** Full-width panel under the canvas and aside (formulas, decomposition). */
  below?: ReactNode;
  /** One line naming the estimator or algorithm (shown in the footer). */
  method: string;
  /** Validation note; defaults to the lab's recorded maturity. */
  validation?: ReactNode;
  synthetic?: boolean;
  demos?: TeachDemo[];
  keepAsideInTeach?: boolean;
}) {
  const { t, lang, present } = lab;
  const [shareState, setShareState] = useState<"idle" | "copied" | "manual">("idle");
  const [demo, setDemo] = useState(0);
  const [panels, setPanels] = useState(true);
  const maturity = labMaturity(lab.id);
  const status = maturityLabel(maturity);
  const Heading = lab.embedded && !present ? "h3" : "h1";
  const showAside = !!aside && (!present || keepAsideInTeach || panels);

  const onShare = async () => {
    const r = await lab.share();
    setShareState(r);
    window.setTimeout(() => setShareState("idle"), 1800);
  };
  const goDemo = (i: number) => {
    if (!demos?.length) return;
    const k = (i + demos.length) % demos.length;
    setDemo(k);
    demos[k].apply();
  };
  const toggleTeach = () => {
    if (!present && demos?.length) {
      setDemo(0);
      demos[0].apply();
    }
    lab.setPresent(!present);
  };

  return (
    <Ctx.Provider value={{ lang, t, locked: lab.locked as (k: string) => boolean, present, embedded: lab.embedded && !present }}>
      <div
        lang={lang}
        data-lab={lab.id}
        data-present={present ? "true" : undefined}
        className={cn(present ? "fixed inset-0 z-50 overflow-auto bg-bg" : lab.embedded ? "" : "mx-auto max-w-[1500px] px-4 pb-10 pt-4 sm:px-6")}
        role={present ? "dialog" : undefined}
        aria-modal={present ? true : undefined}
        aria-label={present ? `${title} · ${t.teach}` : undefined}
      >
        <div className={cn("flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line pb-3", present && "sticky top-0 z-10 bg-bg px-5 pt-3")}>
          {!lab.embedded && !present && (
            <Link href="/labs" className="text-sm text-muted hover:text-ink">
              {t.labs} /
            </Link>
          )}
          <div className="min-w-0">
            <Heading className={cn("font-semibold tracking-tight text-ink", lab.embedded && !present ? "text-base" : "text-xl")}>{title}</Heading>
          </div>
          {toolbar && <div className="flex flex-wrap items-center gap-2">{toolbar}</div>}
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <button type="button" onClick={toggleTeach} aria-pressed={present} className={btn(present)}>
              {present ? t.exitTeach : t.teach}
            </button>
            <button type="button" onClick={lab.reset} title={t.resetHint} className={btn(false)}>
              {t.reset}
            </button>
            <button type="button" onClick={onShare} className={btn(false)}>
              {t.share}
            </button>
            <span role="status" aria-live="polite" className="text-xs text-muted">
              {shareState === "copied" ? t.copied : shareState === "manual" ? t.copyFailed : ""}
            </span>
            <button
              type="button"
              onClick={() => lab.setLang(lang === "en" ? "hu" : "en")}
              aria-label={`${t.language}: ${lang === "en" ? "English" : "magyar"}`}
              className="rounded-md px-2 py-1 font-mono text-xs text-muted hover:text-ink"
            >
              {lang === "en" ? "EN · hu" : "en · HU"}
            </button>
          </div>
        </div>

        {present && demos && demos.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 bg-ink px-5 py-2 text-sm text-bg">
            <span className="font-mono text-xs opacity-80">
              {demo + 1} / {demos.length}
            </span>
            <strong className="font-semibold">{demos[demo].title}</strong>
            <span className="opacity-85">{demos[demo].note}</span>
            <div className="ml-auto flex gap-2">
              <button type="button" className={darkBtn} onClick={() => goDemo(demo - 1)} aria-label="Previous demo">
                ←
              </button>
              <button type="button" className={darkBtn} onClick={() => goDemo(demo + 1)} aria-label="Next demo">
                →
              </button>
              {aside && !keepAsideInTeach && (
                <button type="button" className={darkBtn} onClick={() => setPanels((v) => !v)} aria-pressed={panels}>
                  {panels ? t.hidePanels : t.showPanels}
                </button>
              )}
            </div>
          </div>
        )}

        <div className={cn(present && "px-5 pb-8 [zoom:1.15]")}>
          {subtitle && <div className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">{subtitle}</div>}

          {lab.instructions && (
            <div className="mt-3 rounded-xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm">
              <p className="font-semibold text-ink">{t.instructions}</p>
              <p className="mt-1 whitespace-pre-line text-ink">{lab.instructions}</p>
            </div>
          )}
          {lab.rejected.length > 0 && (
            <p className="mt-3 rounded-lg bg-warn-soft px-3 py-2 text-xs text-warn">
              {t.rejected} {lab.rejected.join(", ")}
            </p>
          )}

          <div className={cn("mt-4 grid gap-4", showAside && "lg:grid-cols-[minmax(0,1fr)_320px]")}>
            <section aria-label={title} className="min-w-0 rounded-2xl border border-line bg-surface p-3 sm:p-4">
              {children}
            </section>
            {showAside && (
              <aside aria-label={t.controls} className="flex min-w-0 flex-col gap-3">
                {aside}
              </aside>
            )}
          </div>
          {below && (!present || panels) && <div className="mt-4">{below}</div>}

          <footer className="mt-4 flex flex-wrap items-start justify-between gap-x-6 gap-y-2 text-xs text-faint">
            <p className="max-w-3xl">
              <span className="font-medium text-muted">{t.method}:</span> {method}
              {synthetic && <> · {t.synthetic}</>}
            </p>
            <p>
              <span className="font-medium text-muted">{t.validation}:</span>{" "}
              {validation ?? (maturity.numericallyValidated ? t.validated : t.notValidated)} ·{" "}
              <span data-testid="lab-status">{t.status[status]}</span>
            </p>
          </footer>
        </div>
      </div>
    </Ctx.Provider>
  );
}

const btn = (on: boolean) =>
  cn(
    "h-8 rounded-lg border px-3 text-sm font-medium transition-colors",
    on ? "border-ink bg-ink text-bg" : "border-line bg-surface text-ink hover:border-line-strong hover:bg-surface-2",
  );
const darkBtn = "rounded-md border border-white/30 px-3 py-1 text-sm hover:bg-white/10";

/** A titled card for the aside (controls, readouts, notes). */
export function Panel({ title, children, className }: { title?: ReactNode; children: ReactNode; className?: string }) {
  const H = useLabContext().embedded ? "h4" : "h2";
  return (
    <div className={cn("rounded-2xl border border-line bg-surface px-4 py-3", className)}>
      {title && <H className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">{title}</H>}
      {children}
    </div>
  );
}
