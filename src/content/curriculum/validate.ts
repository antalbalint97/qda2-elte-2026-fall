// Reference validation for the curriculum graph. Run by tests/unit/curriculum.test.ts and by the Course
// Builder before export/publish; the same function checks a draft course against the library.
import { BLOCKS } from "./blocks";
import { CONCEPTS } from "./concepts";
import { COURSE_TEMPLATES } from "./courses";
import { DATASETS } from "./datasets";
import { LABS } from "./labs";
import { QUESTION_BANK } from "./question-bank";
import type { Block, CourseTemplate } from "./types";

export interface CurriculumIssue {
  level: "error" | "warning";
  where: string;
  message: string;
}

export interface Library {
  concepts: typeof CONCEPTS;
  labs: typeof LABS;
  blocks: Block[];
  questions: typeof QUESTION_BANK;
  datasets: typeof DATASETS;
}

export const LIBRARY: Library = { concepts: CONCEPTS, labs: LABS, blocks: BLOCKS, questions: QUESTION_BANK, datasets: DATASETS };

function duplicates(ids: string[]): string[] {
  const seen = new Set<string>();
  const dup = new Set<string>();
  for (const id of ids) (seen.has(id) ? dup : seen).add(id);
  return [...dup];
}

/** Returns one cycle (as a list of ids, first = last) in the prerequisite graph, or null. */
export function findPrereqCycle(edges: Map<string, string[]>): string[] | null {
  const state = new Map<string, 1 | 2>();
  const stack: string[] = [];
  const visit = (v: string): string[] | null => {
    state.set(v, 1);
    stack.push(v);
    for (const w of edges.get(v) ?? []) {
      if (state.get(w) === 1) return [...stack.slice(stack.indexOf(w)), w];
      if (!state.has(w)) {
        const c = visit(w);
        if (c) return c;
      }
    }
    stack.pop();
    state.set(v, 2);
    return null;
  };
  for (const v of edges.keys()) if (!state.has(v)) {
    const c = visit(v);
    if (c) return c;
  }
  return null;
}

/** Datasets that are referenced by blocks but generated or fetched elsewhere, not stored in DATASETS. */
export const EXTERNAL_DATASETS: Record<string, string> = {
  "ds.sopranos": "src/content/sopranos/dataset.ts (used by /bonus/sopranos)",
  "ds.finite-pop": "generated in the browser by src/lib/engine/sampling.ts makePopulation",
};

export function validateLibrary(lib: Library = LIBRARY): CurriculumIssue[] {
  const out: CurriculumIssue[] = [];
  const err = (where: string, message: string) => out.push({ level: "error", where, message });
  const warn = (where: string, message: string) => out.push({ level: "warning", where, message });

  for (const [name, ids] of [
    ["concept", lib.concepts.map((c) => c.id)],
    ["lab", lib.labs.map((l) => l.id)],
    ["block", lib.blocks.map((b) => b.id)],
    ["question", lib.questions.map((q) => q.id)],
    ["dataset", lib.datasets.map((d) => d.id)],
  ] as const) for (const d of duplicates([...ids])) err(`${name}:${d}`, `duplicate ${name} id`);

  const concept = new Set(lib.concepts.map((c) => c.id));
  const lab = new Set(lib.labs.map((l) => l.id));
  const question = new Set(lib.questions.map((q) => q.id));
  const dataset = new Set(lib.datasets.map((d) => d.id));

  for (const c of lib.concepts) {
    for (const p of c.prereq) if (!concept.has(p)) err(`concept:${c.id}`, `missing prerequisite ${p}`);
    for (const r of [...c.related, ...(c.gen ?? []), ...(c.alt ?? [])]) if (!concept.has(r)) err(`concept:${c.id}`, `missing related concept ${r}`);
    for (const l of c.labs) if (!lab.has(l)) err(`concept:${c.id}`, `missing lab ${l}`);
    if (c.prereq.includes(c.id)) err(`concept:${c.id}`, "concept is its own prerequisite");
  }
  const cycle = findPrereqCycle(new Map(lib.concepts.map((c) => [c.id, c.prereq])));
  if (cycle) err(`concept:${cycle[0]}`, `prerequisite cycle ${cycle.join(" → ")}`);

  for (const l of lib.labs) for (const c of l.concepts) if (!concept.has(c)) err(`lab:${l.id}`, `missing concept ${c}`);

  for (const b of lib.blocks) {
    for (const c of b.concepts) if (!concept.has(c)) err(`block:${b.id}`, `missing concept ${c}`);
    if (b.type === "lab" || b.type === "experiment") {
      if (b.lab && !lab.has(b.lab)) err(`block:${b.id}`, `missing lab ${b.lab}`);
      if (b.type === "lab" && !b.lab) err(`block:${b.id}`, "lab block without a lab");
    }
    for (const q of b.questions ?? []) if (!question.has(q)) err(`block:${b.id}`, `missing question ${q}`);
    const ds = (b.config?.dataset as string | undefined) || b.datasetId;
    if (ds && !dataset.has(ds)) err(`block:${b.id}`, `missing dataset ${ds}`);
    if (b.type === "dataset" && !dataset.has(b.id) && !EXTERNAL_DATASETS[b.id] && b.provenance?.kind !== "real")
      err(`block:${b.id}`, "dataset block has no registered rows");
  }

  for (const q of lib.questions) {
    for (const c of q.concepts) if (!concept.has(c)) err(`question:${q.id}`, `missing concept ${c}`);
    if (q.kind === "choice") {
      const opts = q.options ?? [];
      if (opts.length < 2) err(`question:${q.id}`, "fewer than two options");
      if (!opts.some((o) => o.id === q.correct)) err(`question:${q.id}`, `correct answer ${q.correct} is not an option`);
      if (opts.filter((o) => o.correct).length !== 1) err(`question:${q.id}`, "exactly one option must be flagged correct");
      for (const d of duplicates(opts.map((o) => o.id))) err(`question:${q.id}`, `duplicate option ${d}`);
    } else {
      const items = (q.items ?? []).map((i) => i.id);
      const init = q.initial ?? [];
      if (items.length < 2 || init.length !== items.length || !init.every((i) => items.includes(i))) err(`question:${q.id}`, "order question: initial must be a permutation of items");
    }
    if (q.flag) warn(`question:${q.id}`, `review flag: ${q.flag}`);
  }

  for (const d of lib.datasets) {
    const w = d.columns.length;
    d.rows.forEach((r, i) => { if (r.length !== w) err(`dataset:${d.id}`, `row ${i + 1} has ${r.length} cells, expected ${w}`); });
    if (d.provenance.n !== null && d.provenance.n !== d.rows.length) err(`dataset:${d.id}`, `provenance n ${d.provenance.n} ≠ ${d.rows.length} rows`);
    d.columns.forEach((c, j) => {
      if (c.type === "factor" && c.levels) for (const r of d.rows) if (!c.levels.includes(String(r[j]))) { err(`dataset:${d.id}`, `value ${r[j]} not a level of ${c.name}`); break; }
      if (c.type === "number") for (const r of d.rows) if (typeof r[j] !== "number" || !Number.isFinite(r[j] as number)) { err(`dataset:${d.id}`, `non-numeric value in ${c.name}`); break; }
    });
    if (d.design) for (const k of [d.design.strata, d.design.psu, d.design.weight]) if (!d.columns.some((c) => c.name === k)) err(`dataset:${d.id}`, `design column ${k} missing`);
  }
  return out;
}

/** Checks a course (template or draft) against a library: block refs, unique unit/lesson/instance ids. */
export function validateCourse(course: CourseTemplate, lib: Pick<Library, "blocks"> = LIBRARY, localBlocks: Block[] = []): CurriculumIssue[] {
  const out: CurriculumIssue[] = [];
  const err = (where: string, message: string) => out.push({ level: "error", where, message });
  const known = new Set([...lib.blocks.map((b) => b.id), ...localBlocks.map((b) => b.id)]);
  if (!course.id) err("course", "course without id");
  if (!course.units.length) err(`course:${course.id}`, "course has no units");
  for (const d of duplicates(course.units.map((u) => u.id))) err(`course:${course.id}`, `duplicate unit ${d}`);
  const lessons = course.units.flatMap((u) => u.lessons);
  for (const d of duplicates(lessons.map((l) => l.id))) err(`course:${course.id}`, `duplicate lesson ${d}`);
  const iids: string[] = [];
  for (const u of course.units) for (const l of u.lessons) {
    if (!l.blocks.length) out.push({ level: "warning", where: `lesson:${l.id}`, message: "lesson has no blocks" });
    for (const bi of l.blocks) {
      if (!known.has(bi.ref)) err(`lesson:${l.id}`, `missing block ${bi.ref}`);
      if (bi.iid) iids.push(bi.iid);
    }
  }
  for (const d of duplicates(iids)) err(`course:${course.id}`, `duplicate block instance ${d}`);
  return out;
}

export function validateAll(): CurriculumIssue[] {
  return [...validateLibrary(), ...COURSE_TEMPLATES.flatMap((c) => validateCourse(c))];
}
