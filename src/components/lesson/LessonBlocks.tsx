"use client";

// Renderers for every block type of a course snapshot. Each renders the embedded snapshot content only; a
// learner's interaction (lab state, R code, answers) never writes back into it.
import { LabHost } from "@/components/lab/registry";
import { LabButton } from "@/components/lab/primitives/controls";
import { RCodeBlock } from "@/components/r/RCodeBlock";
import { datasetCsv, rName } from "@/content/curriculum/datasets";
import { isImplemented } from "@/content/curriculum/implemented-labs";
import type { BankQuestion, Dataset, Lang } from "@/content/curriculum/types";
import { cn } from "@/lib/cn";
import { gradeChoice, gradeOrder } from "@/lib/course/grading";
import type { DatasetRef, EmbeddedBlock } from "@/lib/course/model";
import { encodeJsonHash, type LabConfiguration } from "@/lib/lab-config";
import { useEffect, useId, useMemo, useState } from "react";
import { CourseText } from "./CourseText";
import { fill, LESSON_T } from "./strings";
import type { AnswerApi } from "./useAnswers";

type T = (typeof LESSON_T)["en"];
export interface BlockCtx {
  lang: Lang;
  t: T;
  answers: AnswerApi;
  /** Key prefix for stored answers: "courseId@version/lessonId". */
  scope: string;
  datasets: Record<string, DatasetRef>;
}

function ConceptCards({ block, t, showMisconceptions = true }: { block: EmbeddedBlock; t: T; showMisconceptions?: boolean }) {
  if (!block.conceptCards.length) return null;
  return (
    <div className="mt-3 space-y-3">
      {block.conceptCards.map((c) => (
        <div key={c.id} className="rounded-xl border border-line bg-surface p-3">
          <p className="font-semibold text-ink">
            {c.name.en}
            <span className="ml-2 text-sm font-normal text-muted">{c.name.hu}</span>
          </p>
          <p className="mt-1 text-sm leading-relaxed text-ink">{c.def}</p>
          {c.notation && (
            <p className="mt-2 text-sm">
              <span className="text-muted">{t.notation}: </span>
              <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[13px] text-ink">{c.notation}</code>
            </p>
          )}
          {showMisconceptions && c.misconceptions.length > 0 && (
            <details className="mt-2 text-sm">
              <summary className="cursor-pointer text-muted hover:text-ink">{t.misconceptions}</summary>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-ink">
                {c.misconceptions.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            </details>
          )}
          <a href={`/atlas#${encodeURIComponent(c.id)}`} className="mt-2 inline-block text-xs text-accent underline underline-offset-2 hover:no-underline">
            {t.inAtlas}
          </a>
        </div>
      ))}
    </div>
  );
}

function Explanation({ block, t }: { block: EmbeddedBlock; t: T }) {
  const text = block.body || block.objective;
  return text ? <CourseText body={text} /> : <p className="text-sm text-muted">{t.noBody}</p>;
}

function TextAnswer({ block, ctx, label }: { block: EmbeddedBlock; ctx: BlockCtx; label: string }) {
  const key = `${ctx.scope}/${block.iid}`;
  const id = useId();
  const [text, setText] = useState("");
  const { ready, get, generation } = ctx.answers;
  // stored answers are read after hydration, and again after the learner deletes them
  useEffect(() => {
    if (ready) setText(get(key)?.text ?? "");
  }, [ready, get, key, generation]);
  return (
    <div className="mt-3">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      <textarea
        id={id}
        rows={4}
        value={text}
        maxLength={4000}
        onChange={(e) => {
          setText(e.target.value);
          ctx.answers.set(key, { text: e.target.value });
        }}
        className="mt-1 block w-full rounded-lg border border-line bg-surface p-2 text-sm text-ink"
      />
      <p className="mt-1 text-xs text-muted">
        {ctx.answers.status === "ok" ? ctx.t.savedLocal : ctx.t.notSaved} {ctx.t.notGraded}
      </p>
    </div>
  );
}

function LabBlock({ block, ctx }: { block: EmbeddedBlock; ctx: BlockCtx }) {
  const { t, lang } = ctx;
  const [mount, setMount] = useState(0);
  const config = useMemo<LabConfiguration>(() => {
    const c: LabConfiguration = { l: lang, ...block.config };
    if (block.lockedControls.length) c.controls = { locked: block.lockedControls };
    if (block.instructions) c.instructions = block.instructions;
    return c;
  }, [block, lang]);
  if (!block.lab || !isImplemented(block.lab)) return <p className="rounded-xl bg-warn-soft px-4 py-3 text-sm text-warn">{t.labMissing}</p>;
  return (
    <div className="mt-2">
      {block.prompt && <CourseText body={block.prompt} className="mb-3 leading-relaxed text-ink" />}
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <LabButton onClick={() => setMount((m) => m + 1)}>{t.resetLab}</LabButton>
        <a className="rounded-lg px-2 py-1 text-sm text-accent underline underline-offset-2 hover:no-underline" href={`/lab/${block.lab}${encodeJsonHash(config)}`}>
          {t.openLab}
        </a>
        <a className="rounded-lg px-2 py-1 text-sm text-accent underline underline-offset-2 hover:no-underline" href={`/lab/${block.lab}${encodeJsonHash({ ...config, present: true })}`}>
          {t.teach}
        </a>
      </div>
      {block.lockedControls.length > 0 && <p className="mb-2 text-xs text-muted">{fill(t.locked, { keys: block.lockedControls.join(", ") })}</p>}
      {block.rejectedConfig?.length ? <p className="mb-2 text-xs text-warn">{fill(t.rejected, { keys: block.rejectedConfig.join(", ") })}</p> : null}
      <div className="rounded-2xl border border-line bg-bg p-2 sm:p-3" data-testid={`lab-${block.lab}`}>
        <LabHost key={mount} id={block.lab} config={config} embedded />
      </div>
    </div>
  );
}

const asDataset = (d: DatasetRef): Dataset | null => (d.embedded && d.rows ? { id: d.id, title: d.title, provenance: d.provenance, columns: d.columns, rows: d.rows, ...(d.design ? { design: d.design } : {}) } : null);

function RBlock({ block, ctx }: { block: EmbeddedBlock; ctx: BlockCtx }) {
  const { t, lang } = ctx;
  const [ran, setRan] = useState(false);
  const cfg = block.config;
  const ds = typeof cfg.dataset === "string" ? ctx.datasets[cfg.dataset] : undefined;
  const datasets = useMemo(() => (ds ? [asDataset(ds)].filter((x): x is Dataset => !!x) : []), [ds]);
  const packages = Array.isArray(cfg.packages) ? (cfg.packages as string[]) : [];
  return (
    <div className="mt-2 space-y-2">
      {block.objective && <p className="leading-relaxed text-ink">{block.objective}</p>}
      {block.prompt && <CourseText body={block.prompt} />}
      {ds && <p className="text-xs text-muted">{fill(t.inR, { name: rName(ds.id) })}</p>}
      <RCodeBlock initialCode={String(cfg.code ?? "")} lang={lang} datasets={datasets} packages={packages} editable={cfg.editable !== false} label={`${t.type.r}: ${block.title[lang]}`} onResult={() => setRan(true)} />
      {typeof cfg.expected === "string" && cfg.expected && (
        <details className="rounded-lg border border-line bg-surface p-3 text-sm" open={false} data-testid="r-expected">
          <summary className="cursor-pointer font-medium text-ink">{ran ? t.showExpected : t.expected}</summary>
          <p className="mt-2 leading-relaxed text-ink">{cfg.expected}</p>
        </details>
      )}
    </div>
  );
}

function DatasetBlock({ block, ctx }: { block: EmbeddedBlock; ctx: BlockCtx }) {
  const { t, lang } = ctx;
  const ref = ctx.datasets[block.datasetId ?? block.id];
  const prov = ref?.provenance ?? block.provenance;
  const N = 8;
  const download = () => {
    if (!ref?.rows) return;
    const url = URL.createObjectURL(new Blob([datasetCsv({ columns: ref.columns, rows: ref.rows })], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${rName(ref.id)}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <div className="mt-2 space-y-3 text-sm">
      {prov && (
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
          <dt className="text-muted">{t.kind}</dt>
          <dd className="text-ink">{prov.kind}</dd>
          <dt className="text-muted">{t.rows}</dt>
          <dd className="text-ink">{prov.n ?? "—"}</dd>
          <dt className="text-muted">{t.generator}</dt>
          <dd className="text-ink">{prov.generator}</dd>
          <dt className="text-muted">{t.license}</dt>
          <dd className="text-ink">{prov.license}</dd>
          <dt className="text-muted">{t.limits}</dt>
          <dd className="text-ink">{prov.limits}</dd>
        </dl>
      )}
      {ref?.embedded && ref.rows ? (
        <>
          <p className="text-xs text-muted">{fill(t.inR, { name: rName(ref.id) })}</p>
          <div tabIndex={0} role="region" aria-label={fill(t.preview, { n: Math.min(N, ref.rows.length) })} className="overflow-x-auto rounded-lg border border-line">
            <table className="w-full border-collapse text-left font-mono text-xs">
              <caption className="sr-only">{`${ref.title[lang]}: ${fill(t.preview, { n: Math.min(N, ref.rows.length) })}`}</caption>
              <thead>
                <tr className="border-b border-line bg-surface-2">
                  {ref.columns.map((c) => (
                    <th key={c.name} scope="col" className="px-2 py-1 font-medium text-ink" title={c.label}>
                      {c.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ref.rows.slice(0, N).map((r, i) => (
                  <tr key={i} className="border-b border-line last:border-0">
                    {r.map((v, j) => (
                      <td key={j} className="px-2 py-1 text-ink">
                        {String(v)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <LabButton onClick={download}>{t.csv}</LabButton>
        </>
      ) : (
        <p className="text-muted">{t.notEmbedded}</p>
      )}
    </div>
  );
}

function ChoiceQuestion({ q, ctx, storeKey }: { q: BankQuestion; ctx: BlockCtx; storeKey: string }) {
  const { t } = ctx;
  const name = useId();
  const [pick, setPick] = useState<string | null>(null);
  const [graded, setGraded] = useState<ReturnType<typeof gradeChoice> | null>(null);
  const check = () => {
    if (!pick) return;
    const g = gradeChoice(q, pick);
    setGraded(g);
    // the first attempt is what is kept
    if (!ctx.answers.get(storeKey)) ctx.answers.set(storeKey, { choice: pick, correct: g.correct });
  };
  return (
    <fieldset className="space-y-2">
      <legend className="leading-relaxed text-ink">{q.prompt}</legend>
      {q.context && <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-surface-2 p-2 font-mono text-xs text-ink">{q.context}</pre>}
      <div role="radiogroup" aria-label={t.options} className="space-y-1.5">
        {q.options!.map((o) => (
          <label key={o.id} className={cn("flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2 text-sm", pick === o.id ? "border-accent bg-surface-2" : "border-line bg-surface")}>
            <input type="radio" name={name} value={o.id} checked={pick === o.id} disabled={!!graded} onChange={() => setPick(o.id)} className="mt-0.5" />
            <span className="text-ink">{o.label}</span>
          </label>
        ))}
      </div>
      <div className="flex gap-2">
        {!graded ? (
          <LabButton variant="primary" onClick={check} disabled={!pick}>
            {t.check}
          </LabButton>
        ) : (
          !graded.correct && (
            <LabButton
              onClick={() => {
                setGraded(null);
                setPick(null);
              }}
            >
              {t.tryAgain}
            </LabButton>
          )
        )}
      </div>
      <div role="status" aria-live="polite">
        {graded && (
          <div className={cn("rounded-lg border p-3 text-sm", graded.correct ? "border-pos/50 bg-pos-soft" : "border-neg/50 bg-neg-soft")}>
            <p className="font-semibold text-ink">{graded.correct ? t.correct : t.incorrect}</p>
            {graded.feedback.map((f, i) => (
              <p key={i} className="mt-1 leading-relaxed text-ink">
                {f}
              </p>
            ))}
          </div>
        )}
      </div>
    </fieldset>
  );
}

function OrderQuestion({ q, ctx, storeKey }: { q: BankQuestion; ctx: BlockCtx; storeKey: string }) {
  const { t } = ctx;
  const byId = Object.fromEntries(q.items!.map((i) => [i.id, i]));
  const [order, setOrder] = useState<string[]>(q.initial!);
  const [graded, setGraded] = useState<ReturnType<typeof gradeOrder> | null>(null);
  const [moved, setMoved] = useState("");
  const move = (from: number, to: number) => {
    if (to < 0 || to >= order.length || graded) return;
    const next = [...order];
    const [it] = next.splice(from, 1);
    next.splice(to, 0, it);
    setOrder(next);
    setMoved(fill(t.moved, { label: byId[it].label, pos: to + 1, n: next.length }));
  };
  const check = () => {
    const g = gradeOrder(q, order);
    setGraded(g);
    if (!ctx.answers.get(storeKey)) ctx.answers.set(storeKey, { order, correct: g.correct });
  };
  return (
    <div className="space-y-2">
      <p className="leading-relaxed text-ink">{q.prompt}</p>
      <p className="sr-only" aria-live="polite">
        {moved}
      </p>
      <ol className="space-y-1.5">
        {order.map((id, i) => {
          const bad = graded?.wrongPositions?.includes(i);
          return (
            <li key={id} className={cn("flex items-center gap-2 rounded-lg border px-3 py-2 text-sm", !graded ? "border-line bg-surface" : bad ? "border-neg/50 bg-neg-soft" : "border-pos/50 bg-pos-soft")}>
              <span className="font-mono text-xs text-muted">{i + 1}</span>
              <span className="flex-1 text-ink">
                {byId[id].label}
                {graded && <span className="sr-only">{bad ? " (wrong position)" : " (correct position)"}</span>}
              </span>
              {!graded && (
                <span className="flex gap-1">
                  <button type="button" className="rounded border border-line px-1.5 text-xs text-ink disabled:opacity-30" aria-label={fill(t.moveUp, { label: byId[id].label })} disabled={i === 0} onClick={() => move(i, i - 1)}>
                    ↑
                  </button>
                  <button type="button" className="rounded border border-line px-1.5 text-xs text-ink disabled:opacity-30" aria-label={fill(t.moveDown, { label: byId[id].label })} disabled={i === order.length - 1} onClick={() => move(i, i + 1)}>
                    ↓
                  </button>
                </span>
              )}
            </li>
          );
        })}
      </ol>
      <div className="flex flex-wrap gap-2">
        {!graded && (
          <LabButton variant="primary" onClick={check}>
            {t.check}
          </LabButton>
        )}
        {graded && !graded.correct && (
          <>
            <LabButton onClick={() => setGraded(null)}>{t.tryAgain}</LabButton>
            <LabButton
              onClick={() => {
                setOrder(q.items!.map((i) => i.id));
                setGraded({ correct: true, feedback: [q.explanation, ...q.items!.filter((i) => i.why).map((i) => `${i.label} ${i.why}`)], wrongPositions: [] });
              }}
            >
              {t.showOrder}
            </LabButton>
          </>
        )}
      </div>
      <div role="status" aria-live="polite">
        {graded && (
          <div className={cn("rounded-lg border p-3 text-sm", graded.correct ? "border-pos/50 bg-pos-soft" : "border-neg/50 bg-neg-soft")}>
            <p className="font-semibold text-ink">{graded.correct ? t.correct : t.incorrect}</p>
            {(graded.correct ? graded.feedback : [fill(t.placed, { k: order.length - (graded.wrongPositions?.length ?? 0), n: order.length })]).map((f, i) => (
              <p key={i} className="mt-1 leading-relaxed text-ink">
                {f}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AssessmentBlock({ block, ctx }: { block: EmbeddedBlock; ctx: BlockCtx }) {
  if (!block.questionItems.length) return <p className="text-sm text-muted">{ctx.t.noQuestions}</p>;
  return (
    <div className="mt-2 space-y-6">
      {block.prompt && <CourseText body={block.prompt} />}
      {block.questionItems.map((q) => {
        const key = `${ctx.scope}/${block.iid}/${q.id}`;
        return (
          <div key={q.id} className="rounded-xl border border-line bg-surface p-3 sm:p-4" data-question={q.id}>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">{q.format}</p>
            {q.kind === "choice" ? <ChoiceQuestion q={q} ctx={ctx} storeKey={key} /> : <OrderQuestion q={q} ctx={ctx} storeKey={key} />}
          </div>
        );
      })}
    </div>
  );
}

/** One block of a lesson, by type. */
export function LessonBlock({ block, ctx }: { block: EmbeddedBlock; ctx: BlockCtx }) {
  const { t } = ctx;
  switch (block.type) {
    case "concept":
      return (
        <>
          <Explanation block={block} t={t} />
          <ConceptCards block={block} t={t} />
        </>
      );
    case "math":
      return (
        <>
          <Explanation block={block} t={t} />
          <ConceptCards block={block} t={t} showMisconceptions={false} />
        </>
      );
    case "dataset":
      return <DatasetBlock block={block} ctx={ctx} />;
    case "prediction":
      return (
        <>
          {block.prompt ? <CourseText body={block.prompt} /> : <Explanation block={block} t={t} />}
          <TextAnswer block={block} ctx={ctx} label={t.yourPrediction} />
        </>
      );
    case "reflection":
      return (
        <>
          {block.prompt ? <CourseText body={block.prompt} /> : <Explanation block={block} t={t} />}
          <ConceptCards block={block} t={t} showMisconceptions={false} />
          <TextAnswer block={block} ctx={ctx} label={t.yourAnswer} />
        </>
      );
    case "lab":
    case "experiment":
    case "connection":
      if (block.lab) return <LabBlock block={block} ctx={ctx} />;
      return (
        <>
          {block.prompt ? <CourseText body={block.prompt} /> : <Explanation block={block} t={t} />}
          <ConceptCards block={block} t={t} />
          {block.type === "experiment" && <TextAnswer block={block} ctx={ctx} label={t.yourAnswer} />}
        </>
      );
    case "r":
      return <RBlock block={block} ctx={ctx} />;
    case "assessment":
      return <AssessmentBlock block={block} ctx={ctx} />;
    case "software":
      return (
        <>
          <Explanation block={block} t={t} />
          {block.software.length > 0 && (
            <p className="mt-2 text-sm text-muted">
              {t.software}: <span className="text-ink">{block.software.join(", ")}</span>
            </p>
          )}
          <ConceptCards block={block} t={t} showMisconceptions={false} />
        </>
      );
  }
}
