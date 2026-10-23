"use client";

// Course Builder (port of "QDA2 Course Builder.dc.html"). Local-first: drafts are kept in this browser only,
// exported as qda2-course/2 JSON and published by adding the reviewed export to src/content/published. The
// Builder never writes to the server and is only served where authoring is enabled (src/lib/authoring.ts).
import { LessonView } from "@/components/lesson/LessonView";
import { BLOCKS } from "@/content/curriculum/blocks";
import { CONCEPTS } from "@/content/curriculum/concepts";
import { COURSE_TEMPLATES } from "@/content/curriculum/courses";
import { BLOCK_TYPES, type Bilingual, type BlockType, type Lang } from "@/content/curriculum/types";
import { publishedVersions } from "@/content/published";
import { cn } from "@/lib/cn";
import { lessonData } from "@/lib/course/lesson-data";
import { addSnapshotVersion, buildSnapshot, courseFromTemplate, exportCourse, lookupBlock, type Course, type Snapshot } from "@/lib/course/model";
import * as ops from "@/lib/course/ops";
import { loadDrafts, saveDrafts, takeAtlasPending, type DraftMeta, type DraftStore, type StoreStatus } from "@/lib/course/storage";
import { parseCourseImport } from "@/lib/course/validate";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Inspector } from "./Inspector";
import { BUILDER_T, fill, type BuilderStrings } from "./strings";

const KNOWN = new Set(BLOCKS.map((b) => b.id));
const btn = "rounded-lg border border-line bg-surface px-2.5 py-1 text-sm text-ink hover:border-accent disabled:opacity-40";
const iconBtn = "rounded border border-line px-1.5 py-0.5 text-xs text-ink hover:border-accent disabled:opacity-30";
const input = "block w-full rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm text-ink";
const TYPE_DOT: Record<BlockType, string> = { concept: "var(--accent)", lab: "var(--model)", math: "var(--z)", dataset: "var(--muted)", prediction: "var(--y)", experiment: "var(--model)", r: "var(--accent)", assessment: "var(--warn)", software: "var(--ink)", reflection: "var(--z)", connection: "var(--z)" };

type Preview = { snap: Snapshot; unitId: string; lessonId: string; present: boolean; version: string } | null;
const freshMeta = (): DraftMeta => ({ savedAt: new Date().toISOString(), exportedAt: null, rev: 0, exportedRev: null });

export function CourseBuilder() {
  const [lang, setLang] = useState<Lang>("en");
  const t = BUILDER_T[lang];
  const [store, setStore] = useState<DraftStore | null>(null);
  const [saveStatus, setSaveStatus] = useState<StoreStatus>("ok");
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [tab, setTab] = useState<"library" | "inspector">("library");
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState<BlockType | "">("");
  const [reviewedOnly, setReviewedOnly] = useState(false);
  const [msg, setMsg] = useState<{ text: string; list?: string[] } | null>(null);
  const [preview, setPreview] = useState<Preview>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const previewClose = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  // load drafts; start with the Survey Statistics template when there are none
  useEffect(() => {
    let s = loadDrafts();
    if (!s.current || !s.courses[s.current]) {
      const ids = Object.keys(s.courses);
      if (ids.length) s = { ...s, current: ids[0] };
      else {
        const c = courseFromTemplate(COURSE_TEMPLATES.find((x) => x.id === "course.survey") ?? COURSE_TEMPLATES[0]);
        s = { v: 1, current: c.id, courses: { [c.id]: { course: c, meta: freshMeta() } } };
      }
    }
    setStore(s);
    const pending = takeAtlasPending();
    if (pending && KNOWN.has(pending)) {
      setQ(pending);
      setMsg({ text: fill(t.atlasPending, { t: BLOCKS.find((b) => b.id === pending)!.title[lang] }) });
    }
    // runs once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const entry = store?.current ? store.courses[store.current] : null;
  const course = entry?.course ?? null;

  const commit = useCallback(
    (next: Course, opts: { exported?: boolean } = {}) => {
      setStore((s) => {
        if (!s || !s.current) return s;
        const prev = s.courses[s.current];
        const rev = prev.meta.rev + (opts.exported ? 0 : 1);
        const meta: DraftMeta = { ...prev.meta, rev, savedAt: new Date().toISOString(), ...(opts.exported ? { exportedAt: new Date().toISOString(), exportedRev: rev } : {}) };
        const ns: DraftStore = { ...s, courses: { ...s.courses, [s.current]: { course: next, meta } } };
        setSaveStatus(saveDrafts(ns));
        return ns;
      });
    },
    [setStore],
  );
  const switchTo = (id: string) => {
    setStore((s) => {
      if (!s) return s;
      const ns = { ...s, current: id };
      setSaveStatus(saveDrafts(ns));
      return ns;
    });
    setLessonId(null);
    setSel(null);
  };
  const addCourse = (c: Course) => {
    setStore((s) => {
      const base = s ?? { v: 1 as const, current: null, courses: {} };
      let id = c.id;
      for (let i = 2; base.courses[id]; i++) id = `${c.id}-${i}`;
      const ns: DraftStore = { ...base, current: id, courses: { ...base.courses, [id]: { course: { ...c, id }, meta: freshMeta() } } };
      setSaveStatus(saveDrafts(ns));
      return ns;
    });
    setLessonId(null);
    setSel(null);
  };

  const lesson = course && lessonId ? ops.lessonById(course, lessonId) : null;
  const selBi = lesson?.blocks.find((b) => b.iid === sel) ?? null;

  const library = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const all = [...(course?.localBlocks ?? []), ...BLOCKS];
    return all.filter((b) => {
      if (typeFilter && b.type !== typeFilter) return false;
      if (reviewedOnly && !(b.review.scientific !== "unreviewed" && (b.review.numerical === "validated" || b.review.numerical === "n/a"))) return false;
      if (!needle) return true;
      const names = b.concepts.map((c) => CONCEPTS.find((k) => k.id === c)?.name.en ?? c).join(" ");
      return `${b.id} ${b.title.en} ${b.title.hu} ${b.objective} ${names}`.toLowerCase().includes(needle);
    });
  }, [q, typeFilter, reviewedOnly, course?.localBlocks]);

  const previewOpen = !!preview;
  useEffect(() => {
    if (previewOpen) previewClose.current?.focus();
  }, [previewOpen]);

  if (!store || !course || !entry) return <div className="mx-auto max-w-6xl px-4 py-10 text-muted">…</div>;

  const published = publishedVersions(course.id);
  const exported = entry.meta.exportedRev === entry.meta.rev;

  const addToLesson = (ref: string) => {
    if (!lessonId || !lesson) return setMsg({ text: t.pickLessonFirst });
    const r = ops.addBlock(course, lessonId, ref);
    commit(r.course);
    setSel(r.iid);
    setTab("inspector");
    setMsg({ text: fill(t.added, { l: lesson.title[lang] }) });
  };
  const doExport = () => {
    const exp = exportCourse(course);
    const file = `${course.id}-${exp.latestSnapshot ?? "draft"}.qda2-course.json`;
    const url = URL.createObjectURL(new Blob([JSON.stringify(exp, null, 1) + "\n"], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = file;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    commit(course, { exported: true });
    setMsg({ text: fill(t.exported, { file }) });
  };
  const doImport = async (f: File) => {
    const r = parseCourseImport(await f.text(), KNOWN);
    if (!r.ok || !r.data) return setMsg({ text: t.importFailed, list: r.errors.slice(0, 12) });
    addCourse(r.data.course);
    setMsg(r.warnings.length ? { text: t.importWarnings, list: r.warnings.slice(0, 12) } : { text: fill(t.imported, { t: r.data.course.title[lang] }) });
  };
  const doSnapshot = () => {
    const snap = buildSnapshot(course);
    if (snap.missing.length) return setMsg({ text: fill(t.snapshotMissing, { list: snap.missing.join(", ") }) });
    const r = addSnapshotVersion(course);
    commit(r.course);
    setMsg({ text: fill(t.snapshotMade, { v: r.version.version }) });
  };
  const openPreview = (snap: Snapshot, version: string, present: boolean) => {
    const first = snap.units.flatMap((u) => u.lessons.map((l) => ({ unitId: u.id, lessonId: l.id })));
    const start = (lessonId && first.find((x) => x.lessonId === lessonId)) || first[0];
    if (!start) return;
    returnFocus.current = document.activeElement as HTMLElement;
    setPreview({ snap, version, present, ...start });
  };

  const statusRows: [boolean, string, string?][] = [
    [!exported, t.stDraft, saveStatus === "ok" ? fill(t.savedAt, { time: new Date(entry.meta.savedAt).toLocaleTimeString() }) : saveStatus === "full" ? t.storageFull : t.notSaved],
    [exported, t.stExported, entry.meta.exportedAt ? new Date(entry.meta.exportedAt).toLocaleString() : undefined],
    [published.some((p) => p.review === "approved-for-pilot"), t.stPublished, published.length ? fill(t.stPublishedSome, { list: published.map((p) => `${p.version} (${p.review})`).join(", ") }) : t.stPublishedNone],
  ];

  return (
    <div lang={lang} className="mx-auto max-w-[1600px] px-4 pb-16 pt-6 sm:px-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-ink">{t.title}</h1>
        <div role="group" aria-label="Language / Nyelv" className="ml-auto flex gap-1">
          {(["en", "hu"] as const).map((l) => (
            <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)} className={cn("rounded-md border px-2.5 py-1 font-mono text-xs uppercase", lang === l ? "border-accent bg-accent text-accent-ink" : "border-line text-muted hover:text-ink")}>
              {l}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-2 max-w-4xl rounded-xl border border-warn/40 bg-warn-soft px-4 py-2 text-sm text-ink">{t.localOnly}</p>
      <details className="mt-1 max-w-4xl text-sm">
        <summary className="cursor-pointer text-accent">{t.howPublish}</summary>
        <p className="mt-1 leading-relaxed text-muted">{t.howPublishText}</p>
      </details>

      {/* course bar */}
      <div className="mt-4 flex flex-wrap items-end gap-2 rounded-2xl border border-line bg-surface p-3">
        <label className="text-xs text-muted">
          {t.course}
          <select className={cn(input, "mt-0.5 w-72")} value={store.current ?? ""} onChange={(e) => switchTo(e.target.value)}>
            {Object.entries(store.courses).map(([id, c]) => (
              <option key={id} value={id}>
                {c.course.title[lang]} ({id})
              </option>
            ))}
          </select>
        </label>
        <button type="button" className={btn} aria-expanded={newOpen} onClick={() => setNewOpen((o) => !o)}>
          {t.newCourse}
        </button>
        <button type="button" className={btn} onClick={() => fileRef.current?.click()}>
          {t.import}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          tabIndex={-1}
          aria-label={t.import}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void doImport(f);
            e.target.value = "";
          }}
        />
        <button type="button" className={btn} onClick={doExport}>
          {t.export}
        </button>
        <button type="button" className={btn} onClick={doSnapshot} title={t.snapshotHint}>
          {t.snapshot}
        </button>
        <button type="button" className={btn} onClick={() => openPreview(buildSnapshot(course), "draft", false)}>
          {t.studentPreview}
        </button>
        <button type="button" className={btn} onClick={() => openPreview(buildSnapshot(course), "draft", true)}>
          {t.presentPreview}
        </button>
        <button type="button" className={cn(btn, "ml-auto text-[var(--warn)]")} onClick={() => setConfirmDelete(true)}>
          {t.deleteDraft}
        </button>
      </div>
      {confirmDelete && (
        <div role="group" aria-label={t.deleteDraft} className="mt-2 rounded-xl border border-neg/30 bg-neg-soft p-3 text-sm">
          <p className="text-ink">{fill(t.confirmDelete, { t: course.title[lang] })}</p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              className={btn}
              onClick={() => {
                setStore((s) => {
                  if (!s || !s.current) return s;
                  const courses = { ...s.courses };
                  delete courses[s.current];
                  const ns: DraftStore = { ...s, courses, current: Object.keys(courses)[0] ?? null };
                  setSaveStatus(saveDrafts(ns));
                  if (!ns.current) {
                    const c = courseFromTemplate(COURSE_TEMPLATES[0]);
                    ns.current = c.id;
                    ns.courses = { [c.id]: { course: c, meta: freshMeta() } };
                  }
                  return ns;
                });
                setConfirmDelete(false);
                setLessonId(null);
              }}
            >
              {t.yesDelete}
            </button>
            <button type="button" className={btn} onClick={() => setConfirmDelete(false)}>
              {t.cancel}
            </button>
          </div>
        </div>
      )}
      {newOpen && <NewCourseForm t={t} lang={lang} onCreate={(c) => (addCourse(c), setNewOpen(false))} />}

      <div className="mt-2 grid gap-1 text-sm sm:grid-cols-3" aria-label={t.status} role="list" data-testid="builder-status">
        {statusRows.map(([on, label, detail], i) => (
          <div key={i} role="listitem" className={cn("rounded-lg border px-3 py-1.5", on ? "border-accent bg-surface text-ink" : "border-line text-muted")} aria-current={on ? "true" : undefined}>
            <span className="font-medium">{label}</span>
            {detail && <span className="block text-xs text-muted">{detail}</span>}
          </div>
        ))}
      </div>
      <div role="status" aria-live="polite" className="mt-2 min-h-5 text-sm text-ink">
        {msg && (
          <>
            {msg.text}
            {msg.list && (
              <ul className="list-disc pl-5 text-muted">
                {msg.list.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      <div className="mt-3 grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)_380px]">
        {/* outline */}
        <nav aria-label={t.outline} className="rounded-2xl border border-line bg-surface p-3 xl:max-h-[80vh] xl:overflow-auto">
          <h2 className="text-sm font-semibold text-ink">{t.outline}</h2>
          <button type="button" className={cn("mt-2 w-full rounded px-2 py-1 text-left text-sm", !lessonId ? "bg-surface-2 font-semibold text-ink" : "text-muted hover:text-ink")} aria-current={!lessonId ? "true" : undefined} onClick={() => (setLessonId(null), setSel(null))}>
            {t.overview}
          </button>
          <ol className="mt-2 space-y-3">
            {course.units.map((u, ui) => (
              <li key={u.id}>
                <div className="flex items-center gap-1">
                  <p className="min-w-0 flex-1 truncate text-xs font-semibold text-muted">{u.title[lang]}</p>
                  {course.units.length > 1 && (
                    <button type="button" className={iconBtn} aria-label={`${t.remove}: ${u.title[lang]}`} onClick={() => commit(ops.removeUnit(course, u.id))}>
                      ×
                    </button>
                  )}
                </div>
                <ol className="mt-1 space-y-0.5 border-l border-line pl-2">
                  {u.lessons.map((l, li) => (
                    <li key={l.id} className="flex items-center gap-1">
                      <button type="button" className={cn("min-w-0 flex-1 truncate rounded px-1.5 py-0.5 text-left text-sm", l.id === lessonId ? "bg-surface-2 font-semibold text-ink" : "text-muted hover:text-ink")} aria-current={l.id === lessonId ? "true" : undefined} onClick={() => (setLessonId(l.id), setSel(null))}>
                        {l.title[lang]}
                      </button>
                      <button type="button" className={iconBtn} aria-label={`${t.moveUp}: ${l.title[lang]}`} disabled={ui === 0 && li === 0} onClick={() => commit(ops.moveLesson(course, l.id, -1))}>
                        ↑
                      </button>
                      <button type="button" className={iconBtn} aria-label={`${t.moveDown}: ${l.title[lang]}`} disabled={ui === course.units.length - 1 && li === u.lessons.length - 1} onClick={() => commit(ops.moveLesson(course, l.id, 1))}>
                        ↓
                      </button>
                    </li>
                  ))}
                </ol>
                <button
                  type="button"
                  className="mt-1 pl-2 text-xs text-accent underline underline-offset-2"
                  onClick={() => {
                    const r = ops.addLesson(course, u.id);
                    commit(r.course);
                    setLessonId(r.lessonId);
                  }}
                >
                  + {t.addLesson}
                </button>
              </li>
            ))}
          </ol>
          <button type="button" className={cn(btn, "mt-3 w-full")} onClick={() => commit(ops.addUnit(course).course)}>
            + {t.addUnit}
          </button>
          <div className="mt-4 border-t border-line pt-3">
            <h2 className="text-sm font-semibold text-ink">{t.versions}</h2>
            {course.versions.length ? (
              <ul className="mt-1 space-y-1 text-sm">
                {course.versions.map((v) => (
                  <li key={v.version} className="flex items-center gap-2">
                    <span className="font-mono text-ink">{v.version}</span>
                    <span className="text-xs text-muted">{new Date(v.publishedAt).toLocaleString()}</span>
                    <button type="button" className="ml-auto text-xs text-accent underline underline-offset-2" onClick={() => openPreview(v.snapshot, v.version, false)} aria-label={`${t.inspect} ${v.version}`}>
                      {t.inspect}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-xs text-muted">{t.noVersions}</p>
            )}
            <p className="mt-1 text-xs text-faint">{t.snapshotHint}</p>
          </div>
        </nav>

        {/* centre: overview or lesson */}
        <section aria-label={lesson ? t.lesson : t.overview} className="min-w-0 rounded-2xl border border-line bg-surface p-4">
          {!lesson ? (
            <CourseForm course={course} t={t} onChange={commit} />
          ) : (
            <div className="space-y-3">
              <div className="grid gap-2 sm:grid-cols-2">
                {(["en", "hu"] as const).map((l) => (
                  <label key={l} className="text-xs text-muted">
                    {t.lessonTitle} ({t[l]})
                    <input className={cn(input, "mt-0.5")} value={lesson.title[l]} onChange={(e) => commit(ops.setTitle(course, { lessonId: lesson.id }, { ...lesson.title, [l]: e.target.value }))} />
                  </label>
                ))}
              </div>
              <UnitTitle course={course} lessonId={lesson.id} t={t} onChange={commit} />
              <h2 className="pt-2 text-sm font-semibold text-ink">
                {t.blocks} ({lesson.blocks.length})
              </h2>
              {lesson.blocks.length === 0 && <p className="text-sm text-muted">{t.emptyLesson}</p>}
              <ol className="space-y-1.5" data-testid="lesson-blocks">
                {lesson.blocks.map((bi, i) => {
                  const b = lookupBlock(bi.ref, course);
                  const title = bi.variant?.title?.[lang] ?? b?.title[lang] ?? bi.ref;
                  return (
                    <li
                      key={bi.iid}
                      className={cn("flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2", sel === bi.iid ? "border-accent bg-surface-2" : "border-line")}
                      onKeyDown={(e) => {
                        if (e.altKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
                          e.preventDefault();
                          commit(ops.moveBlock(course, bi.iid!, e.key === "ArrowUp" ? -1 : 1));
                        }
                      }}
                      data-block-ref={bi.ref}
                    >
                      <span aria-hidden className="h-2.5 w-2.5 flex-none rounded-sm" style={{ background: b ? TYPE_DOT[b.type] : "var(--warn)" }} />
                      <button type="button" className="min-w-0 flex-1 text-left" aria-pressed={sel === bi.iid} onClick={() => (setSel(bi.iid!), setTab("inspector"))}>
                        <span className="block truncate text-sm font-medium text-ink">{title}</span>
                        <span className="font-mono text-[10px] text-faint">
                          {b?.type ?? "?"} · {bi.ref}
                          {bi.variant ? " · variant" : ""}
                        </span>
                      </button>
                      <span className="flex gap-1">
                        <button type="button" className={iconBtn} aria-label={`${t.moveUp}: ${title}`} disabled={i === 0} onClick={() => commit(ops.moveBlock(course, bi.iid!, -1))}>
                          ↑
                        </button>
                        <button type="button" className={iconBtn} aria-label={`${t.moveDown}: ${title}`} disabled={i === lesson.blocks.length - 1} onClick={() => commit(ops.moveBlock(course, bi.iid!, 1))}>
                          ↓
                        </button>
                        <button
                          type="button"
                          className={iconBtn}
                          aria-label={`${t.duplicate}: ${title}`}
                          onClick={() => {
                            const r = ops.duplicateBlock(course, bi.iid!);
                            commit(r.course);
                            setSel(r.iid);
                          }}
                        >
                          ⧉
                        </button>
                        <button type="button" className={iconBtn} aria-label={`${t.remove}: ${title}`} onClick={() => (commit(ops.removeBlock(course, bi.iid!)), sel === bi.iid && setSel(null))}>
                          ×
                        </button>
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}
        </section>

        {/* library / inspector */}
        <aside className="rounded-2xl border border-line bg-surface p-3 xl:max-h-[80vh] xl:overflow-auto">
          <div role="tablist" aria-label={`${t.library} / ${t.inspector}`} className="flex gap-1">
            {(["library", "inspector"] as const).map((k) => (
              <button key={k} type="button" role="tab" id={`tab-${k}`} aria-controls={`panel-${k}`} aria-selected={tab === k} onClick={() => setTab(k)} className={cn("rounded-lg px-3 py-1 text-sm", tab === k ? "bg-ink text-bg" : "text-muted hover:text-ink")}>
                {t[k]}
              </button>
            ))}
          </div>
          <div id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`} className="mt-3">
            {tab === "inspector" ? (
              selBi ? (
                <Inspector
                  key={selBi.iid}
                  course={course}
                  bi={selBi}
                  lang={lang}
                  t={t}
                  onVariant={(v) => commit(ops.setVariant(course, selBi.iid!, v))}
                  onRemove={() => {
                    commit(ops.removeBlock(course, selBi.iid!));
                    setSel(null);
                  }}
                />
              ) : (
                <p className="text-sm text-muted">{t.noSelection}</p>
              )
            ) : (
              <div className="space-y-2">
                <label className="block text-xs text-muted">
                  {t.search}
                  <input type="search" className={cn(input, "mt-0.5")} placeholder={t.searchPh} value={q} onChange={(e) => setQ(e.target.value)} />
                </label>
                <div className="flex flex-wrap items-end gap-2">
                  <label className="text-xs text-muted">
                    {t.type}
                    <select className={cn(input, "mt-0.5")} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as BlockType | "")}>
                      <option value="">{t.allTypes}</option>
                      {BLOCK_TYPES.map((x) => (
                        <option key={x} value={x}>
                          {x}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex items-center gap-1.5 pb-1.5 text-xs text-ink">
                    <input type="checkbox" checked={reviewedOnly} onChange={(e) => setReviewedOnly(e.target.checked)} />
                    {t.reviewedOnly}
                  </label>
                </div>
                <p className="text-xs text-muted" aria-live="polite">
                  {fill(t.results, { n: library.length })}
                </p>
                <ul className="space-y-1.5" data-testid="library">
                  {library.slice(0, 60).map((b) => (
                    <li key={b.id} className="flex items-center gap-2 rounded-lg border border-line px-2.5 py-1.5">
                      <span aria-hidden className="h-2.5 w-2.5 flex-none rounded-sm" style={{ background: TYPE_DOT[b.type] }} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm text-ink">{b.title[lang]}</span>
                        <span className="font-mono text-[10px] text-faint">
                          {b.type} · {b.id}
                        </span>
                      </span>
                      <button type="button" className={iconBtn} aria-label={fill(t.addNamed, { t: b.title[lang] })} onClick={() => addToLesson(b.id)}>
                        +
                      </button>
                    </li>
                  ))}
                </ul>
                <NewLocalBlock
                  t={t}
                  onCreate={(type, title) => {
                    const r = ops.addLocalBlock(course, type, title);
                    if (!lessonId) {
                      commit(r.course);
                      return setMsg({ text: t.pickLessonFirst });
                    }
                    const a = ops.addBlock(r.course, lessonId, r.id);
                    commit(a.course);
                    setSel(a.iid);
                    setTab("inspector");
                  }}
                />
              </div>
            )}
          </div>
        </aside>
      </div>

      {preview && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={preview.present ? t.presentPreview : t.studentPreview}
          className="fixed inset-0 z-50 overflow-auto bg-bg"
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setPreview(null);
              returnFocus.current?.focus();
            }
          }}
        >
          <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-line bg-surface px-4 py-2">
            <p className="text-sm font-medium text-ink">
              {preview.present ? t.presentPreview : t.studentPreview} · {preview.version}
            </p>
            <button
              ref={previewClose}
              type="button"
              className={cn(btn, "ml-auto")}
              onClick={() => {
                setPreview(null);
                returnFocus.current?.focus();
              }}
            >
              {t.closePreview}
            </button>
          </div>
          {(() => {
            const d = lessonData(preview.snap, preview.unitId, preview.lessonId, { version: preview.version, latest: true, review: "local-preview" });
            return d ? <LessonView key={`${preview.lessonId}-${preview.present}`} data={d} initialLang={lang} present={preview.present} onNavigate={(unitId, lessonId) => setPreview({ ...preview, unitId, lessonId })} /> : null;
          })()}
        </div>
      )}
    </div>
  );
}

function UnitTitle({ course, lessonId, t, onChange }: { course: Course; lessonId: string; t: BuilderStrings; onChange: (c: Course) => void }) {
  const u = ops.unitOfLesson(course, lessonId);
  if (!u) return null;
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {(["en", "hu"] as const).map((l) => (
        <label key={l} className="text-xs text-muted">
          {t.unitTitle} ({t[l]})
          <input className={cn(input, "mt-0.5")} value={u.title[l]} onChange={(e) => onChange(ops.setTitle(course, { unitId: u.id }, { ...u.title, [l]: e.target.value }))} />
        </label>
      ))}
    </div>
  );
}

function CourseForm({ course, t, onChange }: { course: Course; t: BuilderStrings; onChange: (c: Course) => void }) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-ink">{t.overview}</h2>
      <div className="grid gap-2 sm:grid-cols-2">
        {(["en", "hu"] as const).map((l) => (
          <label key={l} className="text-xs text-muted">
            {t.courseTitle} ({t[l]})
            <input className={cn(input, "mt-0.5")} value={course.title[l]} onChange={(e) => onChange({ ...course, title: { ...course.title, [l]: e.target.value } })} />
          </label>
        ))}
      </div>
      <label className="block text-xs text-muted">
        {t.description}
        <textarea className={cn(input, "mt-0.5 min-h-20")} value={course.description} onChange={(e) => onChange({ ...course, description: e.target.value })} />
      </label>
      <label className="block text-xs text-muted">
        {t.outcomes}
        <textarea className={cn(input, "mt-0.5 min-h-24")} value={course.outcomes.join("\n")} onChange={(e) => onChange({ ...course, outcomes: e.target.value.split("\n") })} />
      </label>
      <p className="font-mono text-xs text-faint">
        {course.id} · {course.units.length} units · {course.units.reduce((a, u) => a + u.lessons.length, 0)} lessons
      </p>
    </div>
  );
}

function NewCourseForm({ t, lang, onCreate }: { t: BuilderStrings; lang: Lang; onCreate: (c: Course) => void }) {
  const [from, setFrom] = useState<string>("");
  const [id, setId] = useState("course.mine");
  const [title, setTitle] = useState("");
  const ok = /^[A-Za-z0-9][\w.-]{0,79}$/.test(id);
  return (
    <form
      className="mt-2 flex flex-wrap items-end gap-2 rounded-xl border border-line bg-surface p-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (from) {
          const tpl = COURSE_TEMPLATES.find((c) => c.id === from)!;
          onCreate(courseFromTemplate(tpl));
        } else if (ok) onCreate(ops.newCourse(id, { en: title || "New course", hu: title || "Új kurzus" }));
      }}
    >
      <label className="text-xs text-muted">
        {t.fromTemplate}
        <select className={cn(input, "mt-0.5")} value={from} onChange={(e) => setFrom(e.target.value)}>
          <option value="">{t.blank}</option>
          {COURSE_TEMPLATES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title[lang]}
            </option>
          ))}
        </select>
      </label>
      {!from && (
        <>
          <label className="text-xs text-muted">
            {t.courseId}
            <input className={cn(input, "mt-0.5 font-mono")} value={id} aria-invalid={!ok} onChange={(e) => setId(e.target.value)} />
          </label>
          <label className="text-xs text-muted">
            {t.courseTitle}
            <input className={cn(input, "mt-0.5")} value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
        </>
      )}
      <button type="submit" className={btn} disabled={!from && !ok}>
        {t.create}
      </button>
    </form>
  );
}

const LOCAL_TYPES: BlockType[] = ["concept", "math", "r", "prediction", "reflection"];
function NewLocalBlock({ t, onCreate }: { t: BuilderStrings; onCreate: (type: BlockType, title: Bilingual) => void }) {
  const [type, setType] = useState<BlockType>("r");
  const [title, setTitle] = useState("");
  return (
    <form
      className="mt-3 space-y-2 border-t border-line pt-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim()) return;
        onCreate(type, { en: title.trim(), hu: title.trim() });
        setTitle("");
      }}
    >
      <p className="text-sm font-semibold text-ink">{t.newLocal}</p>
      <p className="text-xs text-muted">{t.newLocalHint}</p>
      <div className="flex flex-wrap items-end gap-2">
        <label className="text-xs text-muted">
          {t.type}
          <select className={cn(input, "mt-0.5")} value={type} onChange={(e) => setType(e.target.value as BlockType)}>
            {LOCAL_TYPES.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </label>
        <label className="min-w-40 flex-1 text-xs text-muted">
          {t.newTitle}
          <input className={cn(input, "mt-0.5")} value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <button type="submit" className={btn} disabled={!title.trim()}>
          {t.create}
        </button>
      </div>
    </form>
  );
}
