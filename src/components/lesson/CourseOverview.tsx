"use client";

import type { Bilingual, Lang } from "@/content/curriculum/types";
import { cn } from "@/lib/cn";
import Link from "next/link";
import { useState } from "react";
import { lessonHref, type LessonReview } from "./LessonView";
import { fill, LESSON_T } from "./strings";

export function CourseOverview(props: {
  courseId: string;
  version: string;
  latest: boolean;
  review: LessonReview;
  note: string;
  title: Bilingual;
  description: string;
  outcomes: string[];
  units: { id: string; title: Bilingual; lessons: { id: string; title: Bilingual; blocks: number }[] }[];
  versions: { version: string; publishedAt: string; review: LessonReview }[];
}) {
  const [lang, setLang] = useState<Lang>("en");
  const t = LESSON_T[lang];
  const first = props.units[0]?.lessons[0];
  const base = `/course/${encodeURIComponent(props.courseId)}`;
  return (
    <div lang={lang} className="mx-auto max-w-4xl px-4 pb-20 pt-10 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs tracking-widest text-faint">
            {t.course.toUpperCase()} · {fill(t.version, { v: props.version })}
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-ink">{props.title[lang]}</h1>
        </div>
        <div role="group" aria-label="Language / Nyelv" className="flex gap-1">
          {(["en", "hu"] as const).map((l) => (
            <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)} className={cn("rounded-md border px-2.5 py-1 font-mono text-xs uppercase", lang === l ? "border-accent bg-accent text-accent-ink" : "border-line text-muted hover:text-ink")}>
              {l}
            </button>
          ))}
        </div>
      </div>
      {props.review !== "approved-for-pilot" && (
        <div className="mt-4 rounded-xl border border-warn/40 bg-warn-soft px-4 py-3 text-sm text-ink" data-testid="review-notice">
          <p>{t.notReviewed}</p>
          <p className="mt-1 text-muted">{props.note}</p>
        </div>
      )}
      {lang === "hu" && t.contentEnglish && <p className="mt-2 text-xs text-muted">{t.contentEnglish}</p>}
      <p className="mt-4 leading-relaxed text-muted">{props.description}</p>
      {first && (
        <Link href={lessonHref(props, props.units[0].id, first.id)} className="mt-5 inline-block rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-ink hover:opacity-90">
          {t.start}
        </Link>
      )}
      {props.outcomes.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-ink">{t.outcomes}</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-ink">
            {props.outcomes.map((o, i) => (
              <li key={i}>{o}</li>
            ))}
          </ul>
        </section>
      )}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-ink">{t.units}</h2>
        <ol className="mt-3 space-y-4">
          {props.units.map((u) => (
            <li key={u.id}>
              <p className="font-medium text-ink">{u.title[lang]}</p>
              <ul className="mt-1 space-y-1 border-l border-line pl-4">
                {u.lessons.map((l) => (
                  <li key={l.id}>
                    <Link href={lessonHref(props, u.id, l.id)} className="text-accent underline underline-offset-2 hover:no-underline">
                      {l.title[lang]}
                    </Link>
                    <span className="ml-2 text-xs text-muted">{l.blocks}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </section>
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-ink">{t.versions}</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {props.versions.map((v) => (
            <li key={v.version}>
              <Link href={`${base}?v=${encodeURIComponent(v.version)}`} className={cn("underline underline-offset-2 hover:no-underline", v.version === props.version ? "font-semibold text-ink" : "text-accent")} aria-current={v.version === props.version ? "page" : undefined}>
                {fill(t.version, { v: v.version })}
              </Link>
              <span className="ml-2 text-muted">{v.publishedAt.slice(0, 10)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
