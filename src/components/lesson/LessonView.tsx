"use client";

// A lesson of a course snapshot: outline, blocks in order, previous/next lesson and the learner's local answers.
// Used by the published course routes and by the Course Builder's student preview (the same component, so
// what the instructor previews is what students get).
import { LabButton } from "@/components/lab/primitives/controls";
import type { Bilingual, Lang } from "@/content/curriculum/types";
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

  return (
    <div lang={lang} className={cn("mx-auto max-w-6xl px-4 pb-20 pt-6 sm:px-6", present && "text-[1.08rem]")}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {onNavigate ? (
            <span>{data.courseTitle[lang]}</span>
          ) : (
            <Link href={`/course/${encodeURIComponent(data.courseId)}${data.latest ? "" : `?v=${data.version}`}`} className="text-accent underline underline-offset-2 hover:no-underline">
              {data.courseTitle[lang]}
            </Link>
          )}
          <span className="ml-2 rounded bg-surface-2 px-1.5 py-0.5 font-mono text-xs text-muted">{fill(t.version, { v: data.version })}</span>
        </p>
        <div role="group" aria-label="Language / Nyelv" className="flex gap-1">
          {(["en", "hu"] as const).map((l) => (
            <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)} className={cn("rounded-md border px-2.5 py-1 font-mono text-xs uppercase", lang === l ? "border-accent bg-accent text-accent-ink" : "border-line text-muted hover:text-ink")}>
              {l}
            </button>
          ))}
        </div>
      </div>
      {data.review !== "approved-for-pilot" && (
        <p className="mt-3 rounded-xl border border-warn/40 bg-warn-soft px-4 py-2 text-sm text-ink" data-testid="review-notice">
          {data.review === "local-preview" ? t.localPreview : t.notReviewed}
        </p>
      )}
      {lang === "hu" && t.contentEnglish && <p className="mt-2 text-xs text-muted">{t.contentEnglish}</p>}

      <div className="mt-6 grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
        <nav aria-label={t.outline} className="hidden lg:block">
          <ol className="space-y-3 text-sm">
            {data.outline.map((u) => (
              <li key={u.unitId}>
                <p className="font-medium text-muted">{u.title[lang]}</p>
                <ol className="mt-1 space-y-0.5 border-l border-line pl-3">
                  {u.lessons.map((l) => {
                    const here = u.unitId === data.unitId && l.id === data.lessonId;
                    const cls = cn("block rounded px-1 py-0.5 text-left", here ? "font-semibold text-ink" : "text-muted hover:text-ink");
                    return (
                      <li key={l.id}>
                        {onNavigate ? (
                          <button type="button" className={cls} aria-current={here ? "page" : undefined} onClick={() => onNavigate(u.unitId, l.id)}>
                            {l.title[lang]}
                          </button>
                        ) : (
                          <Link className={cls} aria-current={here ? "page" : undefined} href={lessonHref(data, u.unitId, l.id)}>
                            {l.title[lang]}
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

        <div className="min-w-0" id="lesson">
          <p className="font-mono text-xs tracking-widest text-faint">{data.unitTitle[lang]}</p>
          <h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight text-ink sm:text-4xl">{data.lessonTitle[lang]}</h1>
          <ol className="mt-8 space-y-10">
            {data.blocks.map((b, i) => (
              <li key={b.iid} id={`block-${b.iid}`}>
                <section aria-labelledby={`h-${b.iid}`} data-block-type={b.type}>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">
                    {i + 1} · {t.type[b.type]}
                  </p>
                  <h2 id={`h-${b.iid}`} className="mt-1 text-xl font-semibold text-ink">
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
