"use client";

// Inspector for one block instance: edits its course variant (never the library block). Lab settings come
// from LabDefinition.params and are validated with the same rules the lab applies to a link.
import { CodeEditor } from "@/components/r/CodeEditor";
import { DATASETS } from "@/content/curriculum/datasets";
import { isImplemented } from "@/content/curriculum/implemented-labs";
import { LABS } from "@/content/curriculum/labs";
import type { BlockInstance, BlockVariant, Lang, LabParam } from "@/content/curriculum/types";
import { cn } from "@/lib/cn";
import { effective, LIBRARY, lookupBlock, MAX_MATCHED_QUESTIONS, type Course } from "@/lib/course/model";
import { coerceParam, encodeJsonHash, type LabConfiguration } from "@/lib/lab-config";
import { useEffect, useId, useState } from "react";
import { fill, type BuilderStrings } from "./strings";

const input = "block w-full rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm text-ink";

function Field({ label, children, hint }: { label: string; children: (id: string) => React.ReactNode; hint?: string }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="text-xs font-medium text-muted">
        {label}
      </label>
      <div className="mt-0.5">{children(id)}</div>
      {hint && <p className="mt-0.5 text-xs text-faint">{hint}</p>}
    </div>
  );
}

/** One lab parameter. Array/object/range values are edited as JSON and only stored when valid. */
function ParamInput({ p, value, onChange, t }: { p: LabParam; value: unknown; onChange: (v: unknown) => void; t: BuilderStrings }) {
  const [text, setText] = useState(value === undefined ? "" : JSON.stringify(value));
  const [bad, setBad] = useState(false);
  useEffect(() => setText(value === undefined ? "" : JSON.stringify(value)), [value]);
  return (
    <Field label={`${p.key} (${p.type})`}>
      {(id) =>
        p.type === "enum" ? (
          <select id={id} className={input} value={value === undefined ? "" : String(value)} onChange={(e) => onChange(e.target.value === "" ? undefined : coerceParam(p, e.target.value))}>
            <option value="">{t.unset}</option>
            {p.options?.map((o) => (
              <option key={String(o)} value={String(o)}>
                {String(o)}
              </option>
            ))}
          </select>
        ) : p.type === "boolean" ? (
          <select id={id} className={input} value={value === undefined ? "" : String(value)} onChange={(e) => onChange(e.target.value === "" ? undefined : e.target.value === "true")}>
            <option value="">{t.unset}</option>
            <option value="true">true</option>
            <option value="false">false</option>
          </select>
        ) : p.type === "int" || p.type === "float" ? (
          <input id={id} type="number" step={p.type === "int" ? 1 : "any"} className={input} value={value === undefined ? "" : String(value)} onChange={(e) => onChange(e.target.value === "" ? undefined : coerceParam(p, e.target.value))} />
        ) : p.type === "string" ? (
          <input id={id} className={input} value={typeof value === "string" ? value : ""} onChange={(e) => onChange(e.target.value === "" ? undefined : coerceParam(p, e.target.value))} />
        ) : (
          <>
            <input
              id={id}
              className={cn(input, "font-mono", bad && "border-[var(--warn)]")}
              value={text}
              aria-invalid={bad}
              onChange={(e) => {
                setText(e.target.value);
                if (e.target.value.trim() === "") {
                  setBad(false);
                  return onChange(undefined);
                }
                try {
                  const v = coerceParam(p, JSON.parse(e.target.value));
                  setBad(v === undefined);
                  if (v !== undefined) onChange(v);
                } catch {
                  setBad(true);
                }
              }}
            />
            {bad && <p className="mt-0.5 text-xs text-warn">{t.jsonInvalid}</p>}
          </>
        )
      }
    </Field>
  );
}

export function Inspector({ course, bi, lang, t, onVariant, onRemove }: { course: Course; bi: BlockInstance; lang: Lang; t: BuilderStrings; onVariant: (v: BlockVariant | undefined) => void; onRemove: () => void }) {
  const base = lookupBlock(bi.ref, course);
  const v: BlockVariant = bi.variant ?? {};
  if (!base) return <p className="text-sm text-warn">{bi.ref}</p>;
  const eff = effective(bi, course)!;
  const set = (patch: Partial<BlockVariant>) => {
    const next: BlockVariant = { ...v, ...patch };
    for (const k of Object.keys(next) as (keyof BlockVariant)[]) if (next[k] === undefined || next[k] === "") delete next[k];
    onVariant(next);
  };
  const setConfig = (key: string, value: unknown) => {
    const cfg = { ...(v.config ?? {}) };
    if (value === undefined) delete cfg[key];
    else cfg[key] = value;
    set({ config: Object.keys(cfg).length ? cfg : undefined });
  };
  const labDef = base.lab ? LABS.find((l) => l.id === base.lab) : undefined;
  const isVariant = !!bi.variant && Object.keys(bi.variant).length > 0;
  const labHash = (present: boolean) => {
    const c: LabConfiguration = { l: lang, ...eff.config };
    if (eff.lockedControls.length) c.controls = { locked: eff.lockedControls };
    if (eff.instructions) c.instructions = eff.instructions;
    if (present) c.present = true;
    return encodeJsonHash(c);
  };
  const matched = LIBRARY.questions.filter((q) => q.concepts.some((c) => base.concepts.includes(c)));
  const chosen = v.questions ?? base.questions ?? [];
  const cfg = eff.config;

  return (
    <div className="space-y-4" data-testid="inspector">
      <div>
        <p className="font-mono text-[11px] text-faint">
          {base.type} · {base.id} · v{base.version}
          {course.localBlocks.some((b) => b.id === base.id) && ` · ${t.local}`}
        </p>
        <h3 className="mt-0.5 font-semibold text-ink">{eff.title[lang]}</h3>
        <p className={cn("mt-1 rounded-md px-2 py-1 text-xs", isVariant ? "bg-warn-soft text-ink" : "bg-surface-2 text-muted")}>{isVariant ? t.variant : t.reference}</p>
        {isVariant && (
          <button type="button" className="mt-1 text-xs text-accent underline underline-offset-2" onClick={() => onVariant(undefined)}>
            {t.resetVariant}
          </button>
        )}
      </div>

      <fieldset className="space-y-2">
        <legend className="text-xs font-medium text-muted">{t.titleOverride}</legend>
        {(["en", "hu"] as const).map((l) => (
          <Field key={l} label={t[l]}>
            {(id) => <input id={id} className={input} value={v.title?.[l] ?? ""} placeholder={base.title[l]} onChange={(e) => {
                  const nt = { ...base.title, ...v.title, [l]: e.target.value || base.title[l] };
                  set({ title: nt.en === base.title.en && nt.hu === base.title.hu ? undefined : nt });
                }} />}
          </Field>
        ))}
      </fieldset>

      <Field label={t.notes}>{(id) => <input id={id} className={input} value={v.notes ?? ""} maxLength={600} onChange={(e) => set({ notes: e.target.value })} />}</Field>

      {["concept", "math", "software", "connection", "experiment", "dataset"].includes(base.type) && (
        <Field label={t.body}>{(id) => <textarea id={id} className={cn(input, "min-h-32")} value={v.body ?? ""} placeholder={base.body ?? base.objective} onChange={(e) => set({ body: e.target.value })} />}</Field>
      )}
      {["prediction", "reflection", "experiment", "lab", "assessment"].includes(base.type) && (
        <Field label={t.prompt}>{(id) => <textarea id={id} className={cn(input, "min-h-20")} value={v.prompt ?? ""} placeholder={base.prompt ?? ""} onChange={(e) => set({ prompt: e.target.value })} />}</Field>
      )}

      {labDef && isImplemented(labDef.id) && (
        <fieldset className="space-y-2 rounded-xl border border-line p-3">
          <legend className="px-1 text-sm font-semibold text-ink">{t.labConfig}</legend>
          <p className="text-xs text-muted">{t.labInvariant}</p>
          {labDef.params.map((p) => (
            <ParamInput key={p.key} p={p} value={cfg[p.key]} t={t} onChange={(x) => setConfig(p.key, x)} />
          ))}
          <fieldset>
            <legend className="text-xs font-medium text-muted">{t.locked}</legend>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {labDef.params.map((p) => {
                const on = (v.locked ?? []).includes(p.key);
                return (
                  <label key={p.key} className={cn("flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs", on ? "border-accent bg-surface-2 text-ink" : "border-line text-muted")}>
                    <input type="checkbox" checked={on} onChange={(e) => set({ locked: e.target.checked ? [...(v.locked ?? []), p.key] : (v.locked ?? []).filter((k) => k !== p.key) })} />
                    {p.key}
                  </label>
                );
              })}
            </div>
          </fieldset>
          <Field label={t.instructions}>{(id) => <textarea id={id} className={cn(input, "min-h-20")} maxLength={1200} value={v.instructions ?? ""} onChange={(e) => set({ instructions: e.target.value })} />}</Field>
          <div className="flex flex-wrap gap-3 text-sm">
            <a className="text-accent underline underline-offset-2" target="_blank" rel="noopener" href={`/lab/${labDef.id}${labHash(false)}`}>
              {t.openConfigured}
            </a>
            <a className="text-accent underline underline-offset-2" target="_blank" rel="noopener" href={`/lab/${labDef.id}${labHash(true)}`}>
              {t.openTeach}
            </a>
          </div>
        </fieldset>
      )}

      {base.type === "r" && (
        <fieldset className="space-y-2 rounded-xl border border-line p-3">
          <legend className="px-1 text-sm font-semibold text-ink">{t.rConfig}</legend>
          <p className="text-xs text-muted">{t.rPolicy}</p>
          <div>
            <p className="text-xs font-medium text-muted">{t.rCode}</p>
            <CodeEditor value={String(cfg.code ?? "")} onChange={(code) => setConfig("code", code)} onRun={() => {}} label={t.rCode} minLines={5} />
          </div>
          <Field label={t.rDataset}>
            {(id) => (
              <select id={id} className={input} value={typeof cfg.dataset === "string" ? cfg.dataset : ""} onChange={(e) => setConfig("dataset", e.target.value || undefined)}>
                <option value="">{t.rNoDataset}</option>
                {DATASETS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title[lang]}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" checked={Array.isArray(cfg.packages) && (cfg.packages as string[]).includes("survey")} onChange={(e) => setConfig("packages", e.target.checked ? ["survey"] : [])} />
            {t.rPackages}
          </label>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" checked={cfg.editable !== false} onChange={(e) => setConfig("editable", e.target.checked)} />
            {t.rEditable}
          </label>
          <Field label={t.rExpected}>{(id) => <textarea id={id} className={cn(input, "min-h-16")} value={typeof cfg.expected === "string" ? cfg.expected : ""} onChange={(e) => setConfig("expected", e.target.value || undefined)} />}</Field>
        </fieldset>
      )}

      {base.type === "assessment" && (
        <fieldset className="space-y-1.5 rounded-xl border border-line p-3">
          <legend className="px-1 text-sm font-semibold text-ink">{t.questions}</legend>
          <p className="text-xs text-muted">{fill(t.questionsHint, { n: MAX_MATCHED_QUESTIONS })}</p>
          {matched.map((q) => (
            <label key={q.id} className="flex items-start gap-2 text-sm text-ink">
              <input type="checkbox" className="mt-1" checked={chosen.includes(q.id)} onChange={(e) => set({ questions: e.target.checked ? [...chosen, q.id] : chosen.filter((x) => x !== q.id) })} />
              <span>
                <span className="font-mono text-[11px] text-faint">{q.id}</span> {q.prompt}
              </span>
            </label>
          ))}
        </fieldset>
      )}

      <div className="text-xs text-muted">
        <p>
          {t.concepts}: {base.concepts.join(", ") || "—"}
        </p>
        <p>
          {t.review}: {Object.entries(base.review).map(([k, x]) => `${k} ${x}`).join(" · ")}
        </p>
      </div>
      <button type="button" className="text-sm text-[var(--warn)] underline underline-offset-2" onClick={onRemove}>
        {t.removeFromLesson}
      </button>
    </div>
  );
}
