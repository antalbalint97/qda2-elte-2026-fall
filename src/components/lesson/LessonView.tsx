"use client";

// A lesson of a course snapshot: outline, blocks in order, previous/next lesson and the learner's local answers.
// Used by the published course routes and by the Course Builder's student preview (the same component, so
// what the instructor previews is what students get).
import { BrandLink } from "@/components/BrandMark";
import { LabButton } from "@/components/lab/primitives/controls";
import type { Bilingual, BlockType, Lang } from "@/content/curriculum/types";
import { cn } from "@/lib/cn";
import type { DatasetRef, EmbeddedBlock } from "@/lib/course/model";
import { rRuntime } from "@/lib/r/webr-adapter";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { LessonBlock, type BlockCtx } from "./LessonBlocks";
import { fill, LESSON_T } from "./strings";
import { useAnswers } from "./useAnswers";

export type LessonReview = "not-reviewed" | "approved-for-pilot" | "local-preview";
export interface LessonNavItem {
  unitId: string;
  lessonId: string;
  title: Bilingual;
}
export interface LessonData {
  courseId: string;
  version: string;
  /** True when `version` is the newest published version (links then omit ?v=). */
  latest: boolean;
  review: LessonReview;
  courseTitle: Bilingual;
  outline: { unitId: string; title: Bilingual; lessons: { id: string; title: Bilingual }[] }[];
  unitId: string;
  unitTitle: Bilingual;
  lessonId: string;
  lessonTitle: Bilingual;
  blocks: EmbeddedBlock[];
  datasets: Record<string, DatasetRef>;
  prev: LessonNavItem | null;
  next: LessonNavItem | null;
}

// Block-type colours follow the lab roles: explanation = data blue, doing = model teal, mathematics = violet,
// prediction = amber, checking and reflecting = coral.
const TYPE_INK: Record<BlockType, string> = {
  concept: "text-data-ink",
  connection: "text-data-ink",
  lab: "text-model-ink",
  experiment: "text-model-ink",
  dataset: "text-model-ink",
  r: "text-model-ink",
  software: "text-model-ink",
  math: "text-explained-ink",
  prediction: "text-attention-ink",
  assessment: "text-residual-ink",
  reflection: "text-residual-ink",
};
const TYPE_PILL: Record<BlockType, string> = Object.fromEntries(
  Object.entries(TYPE_INK).map(([k, ink]) => [k, `${ink} border-current/40 bg-surface hover:bg-surface-2`]),
) as Record<BlockType, string>;

export function lessonHref(d: Pick<LessonData, "courseId" | "version" | "latest">, unitId: string, lessonId: string) {
  return `/course/${encodeURIComponent(d.courseId)}/${encodeURIComponent(unitId)}/${encodeURIComponent(lessonId)}${d.latest ? "" : `?v=${encodeURIComponent(d.version)}`}`;
}

export function LessonView({ data, onNavigate, initialLang = "en", present = false }: { data: LessonData; onNavigate?: (unitId: string, lessonId: string) => void; initialLang?: Lang; present?: boolean }) {
  const [lang, setLang] = useState<Lang>(initialLang);
  const t = LESSON_T[lang];
  const answers = useAnswers();
  const [deleted, setDeleted] = useState("");
  const scope = `${data.courseId}@${data.version}/${data.lessonId}`;
  const ctx: BlockCtx = useMemo(() => ({ lang, t, answers, scope, datasets: data.datasets }), [lang, t, answers, scope, data.datasets]);

  // R objects from one lesson must not leak into the next.
  useEffect(
    () => () => {
      void rRuntime().reset();
    },
    [data.lessonId],
  );

  const nav = (item: LessonNavItem, label: string, dir: "prev" | "next") => {
    const text = (
      <>
        <span className="block text-xs text-muted">{label}</span>
        <span className="block font-medium text-ink">{item.title[lang]}</span>
      </>
    );
    const cls = cn("block rounded-xl border border-line bg-surface px-4 py-3 hover:border-accent", dir === "next" && "text-right");
    return onNavigate ? (
      <button type="button" className={cn(cls, "w-full text-left", dir === "next" && "text-right")} onClick={() => onNavigate(item.unitId, item.lessonId)} rel={dir}>
        {text}
      </button>
    ) : (
      <Link className={cls} href={lessonHref(data, item.unitId, item.lessonId)} rel={dir}>
        {text}
      </Link>
    );
  };

  const exportAnswers = () => {
    const mine = Object.fromEntries(Object.entries(answers.all().answers).filter(([k]) => k.startsWith(`${data.courseId}@`)));
    const url = URL.createObjectURL(new Blob([JSON.stringify({ course: data.courseId, exportedAt: new Date().toISOString(), answers: mine }, null, 1)], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.courseId}-my-answers.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const standalone = !onNavigate;
  const courseHref = `/course/${encodeURIComponent(data.courseId)}${data.latest ? "" : `?v=${data.version}`}`;
  const langToggle = (
    <div role="group" aria-label="Language / Nyelv" className="flex overflow-hidden rounded-md border border-line font-mono text-xs">
      {(["en", "hu"] as const).map((l) => (
        <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)} className={cn("px-2 py-1", lang === l ? "bg-ink text-bg" : "text-muted hover:text-ink")}>
          {l === "en" ? "EN" : "hu"}
        </button>
      ))}
    </div>
  );

  return (
    <div lang={lang} className={cn(standalone && "min-h-dvh", present && "text-[1.08rem]")}>
      {/* lesson app bar (V3): brand, course and version, review state; Atlas, privacy and language on the right */}
      <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-line bg-bg/95 px-4 py-2.5 backdrop-blur sm:px-5", standalone && "sticky top-0 z-30 min-h-14")}>
        {standalone && <BrandLink label="QDA2" />}
        <p className="flex min-w-0 flex-wrap items-center gap-2 text-sm">
          {standalone ? (
            <Link href={courseHref} className="rounded-md border border-line bg-surface px-2.5 py-1 font-medium text-ink hover:border-line-strong">
              {data.courseTitle[lang]}
            </Link>
          ) : (
            <span className="font-medium text-ink">{data.courseTitle[lang]}</span>
          )}
          <span className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-xs text-muted">{fill(t.version, { v: data.version })}</span>
          {data.review !== "approved-for-pilot" && <span className="font-mono text-xs text-attention-ink">{data.review === "local-preview" ? t.barLocal : t.barNotReviewed}</span>}
        </p>
        <div className="ml-auto flex items-center gap-2">
          {standalone && (
            <>
              <Link href="/atlas" className="rounded-md px-2 py-1 text-[13px] text-muted hover:text-ink">
                {t.atlasLink}
              </Link>
              <Link href="/privacy" className="rounded-md border border-line bg-surface px-2.5 py-1 text-[13px] text-ink hover:border-line-strong">
                {t.privacyLink}
              </Link>
            </>
          )}
          {langToggle}
        </div>
      </div>

      <div className={cn("grid", standalone ? "lg:grid-cols-[260px_minmax(0,1fr)]" : "lg:grid-cols-[230px_minmax(0,1fr)]")}>
        <nav aria-label={t.outline} className={cn("hidden border-r border-line bg-surface-2/50 px-3.5 py-5 lg:block", standalone && "sticky top-14 h-[calc(100dvh-3.5rem)] overflow-y-auto")}>
          <ol className="space-y-3 text-[13px]">
            {data.outline.map((u, ui) => (
              <li key={u.unitId}>
                <p className="text-[11.5px] leading-snug tracking-[0.02em] text-faint">
                  <span className="font-mono">{String(ui + 1).padStart(2, "0")}</span> {u.title[lang]}
                </p>
                <ol className="mt-1 space-y-0.5">
                  {u.lessons.map((l) => {
                    const here = u.unitId === data.unitId && l.id === data.lessonId;
                    const cls = cn(
                      "flex w-full items-start gap-2 rounded-md border px-2 py-1 text-left leading-snug",
                      here ? "border-ink bg-surface font-medium text-ink" : "border-transparent text-muted hover:text-ink",
                    );
                    const body = (
                      <>
                        <span aria-hidden className="mt-[0.45em] h-1.5 w-1.5 shrink-0 rounded-full bg-model" />
                        <span>{l.title[lang]}</span>
                      </>
                    );
                    return (
                      <li key={l.id}>
                        {onNavigate ? (
                          <button type="button" className={cls} aria-current={here ? "page" : undefined} onClick={() => onNavigate(u.unitId, l.id)}>
                            {body}
                          </button>
                        ) : (
                          <Link className={cls} aria-current={here ? "page" : undefined} href={lessonHref(data, u.unitId, l.id)}>
                            {body}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ol>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mx-auto w-full min-w-0 max-w-[860px] px-4 pb-20 pt-8 sm:px-8" id="lesson">
          {data.review !== "approved-for-pilot" && (
            <p className="mb-5 rounded-xl border border-warn/40 bg-warn-soft px-4 py-2 text-sm text-ink" data-testid="review-notice">
              {data.review === "local-preview" ? t.localPreview : t.notReviewed}
            </p>
          )}
          {lang === "hu" && t.contentEnglish && <p className="mb-3 text-xs text-muted">{t.contentEnglish}</p>}
          <p className="text-[13px] text-faint">{data.unitTitle[lang]}</p>
          <h1 className="mt-1.5 font-serif text-[clamp(2rem,4vw,2.6rem)] font-semibold leading-[1.1] tracking-[-0.01em] text-ink">{data.lessonTitle[lang]}</h1>
          <ul className="mt-3 flex flex-wrap gap-1.5" aria-label={t.lesson}>
            {data.blocks.map((b, i) => (
              <li key={b.iid}>
                <a href={`#block-${b.iid}`} className={cn("block rounded-full border px-2 py-0.5 font-mono text-[11px]", TYPE_PILL[b.type])}>
                  {String(i + 1).padStart(2, "0")} · {t.type[b.type]}
                </a>
              </li>
            ))}
          </ul>
          <ol className="mt-8">
            {data.blocks.map((b, i) => (
              <li key={b.iid} id={`block-${b.iid}`} className="scroll-mt-20 border-t border-line py-8">
                <section aria-labelledby={`h-${b.iid}`} data-block-type={b.type}>
                  <p className={cn("font-mono text-[11.5px] uppercase tracking-[0.12em]", TYPE_INK[b.type])}>
                    {String(i + 1).padStart(2, "0")} · {t.type[b.type]}
                  </p>
                  <h2 id={`h-${b.iid}`} className="mt-1.5 text-[1.35rem] font-semibold tracking-[-0.01em] text-ink">
                    {b.title[lang]}
                  </h2>
                  {b.notes && <p className="mt-2 rounded-lg border-l-4 border-accent bg-surface-2 px-3 py-2 text-sm text-ink">{b.notes}</p>}
                  <div className="mt-3">
                    <LessonBlock block={b} ctx={ctx} />
                  </div>
                </section>
              </li>
            ))}
          </ol>

          <nav aria-label={`${t.prev} / ${t.next}`} className="mt-12 grid gap-3 sm:grid-cols-2">
            <div>{data.prev && nav(data.prev, t.prev, "prev")}</div>
            <div>{data.next ? nav(data.next, t.next, "next") : <p className="text-right text-sm text-muted">{t.endOfCourse}</p>}</div>
          </nav>

          <section aria-labelledby="answers-h" className="mt-12 rounded-2xl border border-line bg-surface p-4">
            <h2 id="answers-h" className="text-base font-semibold text-ink">
              {t.privacyTitle}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-muted">{t.privacyText}</p>
            <p className="mt-1 text-sm text-ink">{fill(t.count, { n: answers.count })}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <LabButton onClick={exportAnswers} disabled={!answers.count}>
                {t.exportAnswers}
              </LabButton>
              <LabButton
                onClick={() => {
                  answers.clear();
                  setDeleted(t.deleted);
                }}
                disabled={!answers.count}
              >
                {t.deleteAnswers}
              </LabButton>
            </div>
            <p role="status" aria-live="polite" className="mt-2 min-h-5 text-sm text-muted">
              {deleted}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
