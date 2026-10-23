// Course publication model (port of the V3 design package's course-model.js, schemas qda2-course/2 and
// qda2-snapshot/2). Shared by the Course Builder, the published-course registry and the lesson renderer.
//
// A draft course holds references to library blocks plus per-course variants; it never changes a library
// block. A snapshot is the effective content of every block at the time it was taken (library body ⊕ variant),
// with the concepts, assessment items and datasets it needs embedded, so a published lesson renders from the
// snapshot alone. Snapshots are deep-copied and frozen when they are created; editing the draft afterwards
// cannot change them. Configuration only presets, hides or locks lab controls: it never reaches an estimator.
import { CONCEPTS } from "../../content/curriculum/concepts";
import { DATASETS } from "../../content/curriculum/datasets";
import { isImplemented } from "../../content/curriculum/implemented-labs";
import { labMaturity, maturityLabel } from "../../content/curriculum/lab-status";
import { LABS } from "../../content/curriculum/labs";
import { QUESTION_BANK } from "../../content/curriculum/question-bank";
import type { BankQuestion, Bilingual, Block, BlockInstance, CourseTemplate, Dataset, DatasetColumn, DatasetProvenance, Unit } from "../../content/curriculum/types";
import { BLOCKS } from "../../content/curriculum/blocks";
import { sanitizeConfig } from "../lab-config";

export const COURSE_SCHEMA = "qda2-course/2";
export const SNAPSHOT_SCHEMA = "qda2-snapshot/2";
/** Datasets up to this many rows are embedded in a snapshot (the browser-R limit); larger ones cannot be published. */
export const EMBED_ROWS = 5_000;
/** Assessment blocks without an explicit list show at most this many concept-matched items. */
export const MAX_MATCHED_QUESTIONS = 4;

export interface ConceptCard {
  id: string;
  name: Bilingual;
  def: string;
  notation: string;
  misconceptions: string[];
}

/** A block as it renders in a snapshot: the library block with the course variant applied and its dependencies embedded. */
export interface EmbeddedBlock extends Block {
  iid: string;
  ref: string;
  libraryId: string;
  libraryVersion: string;
  config: Record<string, unknown>;
  lockedControls: string[];
  instructions: string;
  notes?: string;
  conceptCards: ConceptCard[];
  questionItems: BankQuestion[];
  /** Lab config keys the lab does not accept (dropped from `config`). */
  rejectedConfig?: string[];
}

export interface DatasetRef {
  id: string;
  title: Bilingual;
  provenance: DatasetProvenance;
  columns: DatasetColumn[];
  rows?: (number | string)[][];
  rowCount?: number;
  embedded: boolean;
  design?: Dataset["design"] | null;
}

export interface Snapshot {
  schema: typeof SNAPSHOT_SCHEMA;
  courseId: string;
  title: Bilingual;
  description: string;
  outcomes: string[];
  units: Unit[];
  blocks: Record<string, EmbeddedBlock>;
  datasets: Record<string, DatasetRef>;
  /** Lab id → route that renders it in this application. */
  labFiles: Record<string, string>;
  engine: Record<string, string>;
  /** Lab id → maturity label when the snapshot was taken (informational). */
  labStatus: Record<string, string>;
  /** Block refs that could not be resolved (a snapshot with any is not publishable). */
  missing: string[];
}

export interface PublishedVersion {
  version: string;
  publishedAt: string;
  immutable: true;
  blockCount: number;
  missing: string[];
  snapshot: Snapshot;
}

/** A course being edited in the Builder (V3 `Course`). */
export interface Course {
  id: string;
  /** Version of the newest snapshot ("0.0.0" before the first). */
  version: string;
  state: "draft" | "published";
  title: Bilingual;
  description: string;
  outcomes: string[];
  audience?: string;
  workload?: string;
  instructorNotes?: string;
  units: Unit[];
  localBlocks: Block[];
  versions: PublishedVersion[];
  /** Template the draft was started from, if any. */
  fromTemplate?: string;
}

export interface CourseExport {
  schema: typeof COURSE_SCHEMA;
  exportedAt: string;
  publishMode: "local-browser-snapshot" | "static-build";
  course: Course;
  /** Library block id → version, for every block the course uses. */
  libraryPins: Record<string, string>;
  /** Version of the newest snapshot in `course.versions`, or null. */
  latestSnapshot: string | null;
}

export interface Library {
  blocks: readonly Block[];
  questions: readonly BankQuestion[];
  datasets: readonly Dataset[];
}
export const LIBRARY: Library = { blocks: BLOCKS, questions: QUESTION_BANK, datasets: DATASETS };

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
export function deepFreeze<T>(v: T): T {
  if (v && typeof v === "object" && !Object.isFrozen(v)) {
    Object.freeze(v);
    for (const k of Object.keys(v as object)) deepFreeze((v as Record<string, unknown>)[k]);
  }
  return v;
}

/** Instance ids: short, unique within a course, safe in URLs and DOM ids. */
export function newIid(taken: Iterable<string>, prefix = "b"): string {
  const used = new Set(taken);
  for (let i = used.size + 1; ; i++) {
    const id = `${prefix}${i.toString(36)}`;
    if (!used.has(id)) return id;
  }
}
export const allIids = (c: Pick<Course, "units">): string[] => c.units.flatMap((u) => u.lessons.flatMap((l) => l.blocks.map((b) => b.iid ?? "")));

/** A draft from a course template; every block instance gets an iid. */
export function courseFromTemplate(t: CourseTemplate): Course {
  const units = clone(t.units);
  const taken: string[] = [];
  for (const u of units) for (const l of u.lessons) for (const b of l.blocks) {
    if (!b.iid) b.iid = newIid(taken);
    taken.push(b.iid);
  }
  return { id: t.id, version: "0.0.0", state: "draft", title: clone(t.title), description: t.description, outcomes: [...t.outcomes], audience: t.audience, workload: t.workload, instructorNotes: t.instructorNotes, units, localBlocks: [], versions: [], fromTemplate: t.id };
}

export function lookupBlock(ref: string, course: Pick<Course, "localBlocks">, lib: Library = LIBRARY): Block | null {
  return course.localBlocks.find((b) => b.id === ref) ?? lib.blocks.find((b) => b.id === ref) ?? null;
}

const conceptCard = (id: string): ConceptCard | null => {
  const c = CONCEPTS.find((k) => k.id === id);
  return c ? { id: c.id, name: c.name, def: c.def, notation: c.notation, misconceptions: c.misconceptions } : null;
};

/** Assessment items for a block: the explicit list (variant first), otherwise items sharing a concept. */
export function questionsFor(block: Pick<Block, "type" | "concepts" | "questions">, variantQuestions: string[] | undefined, lib: Library = LIBRARY): BankQuestion[] {
  if (block.type !== "assessment") return [];
  const explicit = variantQuestions ?? block.questions;
  if (explicit?.length) return explicit.map((id) => lib.questions.find((q) => q.id === id)).filter((q): q is BankQuestion => !!q);
  return lib.questions.filter((q) => q.concepts.some((c) => block.concepts.includes(c))).slice(0, MAX_MATCHED_QUESTIONS);
}

/** Library block ⊕ variant (never mutates either). Returns null for an unresolved ref. */
export function effective(bi: BlockInstance, course: Pick<Course, "localBlocks">, lib: Library = LIBRARY): EmbeddedBlock | null {
  const base = lookupBlock(bi.ref, course, lib);
  if (!base) return null;
  const v = bi.variant ?? {};
  const b = clone(base);
  const rawConfig = { ...(b.config ?? {}), ...(v.config ?? {}) };
  let config: Record<string, unknown> = rawConfig;
  let rejectedConfig: string[] | undefined;
  const labDef = b.lab ? LABS.find((l) => l.id === b.lab) : undefined;
  if (labDef && (b.type === "lab" || b.type === "experiment" || b.type === "connection")) {
    const s = sanitizeConfig(rawConfig, labDef.params);
    config = { ...s.config };
    delete config.controls;
    delete config.instructions;
    if (s.rejected.length) rejectedConfig = s.rejected;
  }
  return {
    ...b,
    title: v.title ?? b.title,
    prompt: v.prompt ?? b.prompt,
    body: v.body ?? b.body,
    notes: v.notes,
    config,
    lockedControls: v.locked ?? [],
    instructions: v.instructions ?? "",
    questions: v.questions ?? b.questions,
    iid: bi.iid ?? "",
    ref: bi.ref,
    libraryId: base.id,
    libraryVersion: base.version,
    conceptCards: b.concepts.map(conceptCard).filter((c): c is ConceptCard => !!c),
    questionItems: questionsFor(b, v.questions, lib),
    ...(rejectedConfig ? { rejectedConfig } : {}),
  };
}

function datasetRef(ds: Dataset): DatasetRef {
  return ds.rows.length <= EMBED_ROWS
    ? { id: ds.id, title: ds.title, provenance: ds.provenance, columns: ds.columns, rows: ds.rows, design: ds.design ?? null, embedded: true }
    : { id: ds.id, title: ds.title, provenance: ds.provenance, columns: ds.columns, rowCount: ds.rows.length, embedded: false };
}

export const ENGINE_VERSIONS = { "qda2-engine": "3.0", "survey-stats": "3.0", webR: "0.4.2" } as const;

/** The effective content of a course, frozen. Unresolved refs are listed in `missing`. */
export function buildSnapshot(course: Course, lib: Library = LIBRARY): Snapshot {
  const blocks: Record<string, EmbeddedBlock> = {};
  const datasets: Record<string, DatasetRef> = {};
  const missing: string[] = [];
  const units = clone(course.units);
  for (const u of units) for (const l of u.lessons) for (const bi of l.blocks) {
    const e = effective(bi, course, lib);
    if (!e || !bi.iid) {
      missing.push(bi.ref);
      continue;
    }
    bi.pin = e.libraryVersion;
    blocks[bi.iid] = e;
    const ids = [e.type === "dataset" ? e.datasetId ?? e.id : null, typeof e.config.dataset === "string" ? e.config.dataset : null].filter((x): x is string => !!x);
    for (const id of ids) {
      const ds = lib.datasets.find((d) => d.id === id);
      if (ds && !datasets[id]) datasets[id] = datasetRef(ds);
    }
  }
  const labFiles: Record<string, string> = {};
  for (const b of Object.values(blocks)) if (b.lab && isImplemented(b.lab)) labFiles[b.lab] = `/lab/${b.lab}`;
  const labStatus = Object.fromEntries(Object.keys(labFiles).map((id) => [id, maturityLabel(labMaturity(id))]));
  return deepFreeze(
    clone({
      schema: SNAPSHOT_SCHEMA,
      courseId: course.id,
      title: course.title,
      description: course.description,
      outcomes: course.outcomes,
      units,
      blocks,
      datasets,
      labFiles,
      engine: { ...ENGINE_VERSIONS },
      labStatus,
      missing,
    } satisfies Snapshot),
  );
}

/** "1.0.0" for the first snapshot, then minor bumps ("1.1.0", "1.2.0", …). */
export function nextVersion(versions: readonly Pick<PublishedVersion, "version">[]): string {
  if (!versions.length) return "1.0.0";
  const [maj, min] = versions[versions.length - 1].version.split(".").map((x) => parseInt(x, 10));
  return `${Number.isFinite(maj) ? maj : 1}.${(Number.isFinite(min) ? min : 0) + 1}.0`;
}

/**
 * Appends an immutable snapshot version. Returns a new course object; earlier versions are reused as they are
 * (they are frozen), so nothing that was snapshotted before can change.
 */
export function addSnapshotVersion(course: Course, now: Date = new Date(), lib: Library = LIBRARY): { course: Course; version: PublishedVersion } {
  const snapshot = buildSnapshot(course, lib);
  const version: PublishedVersion = deepFreeze({ version: nextVersion(course.versions), publishedAt: now.toISOString(), immutable: true, blockCount: Object.keys(snapshot.blocks).length, missing: [...snapshot.missing], snapshot });
  return { course: { ...course, version: version.version, versions: [...course.versions, version] }, version };
}

export function versionOf<T extends Pick<PublishedVersion, "version">>(versions: readonly T[], v?: string | null): T | null {
  if (!versions.length) return null;
  if (!v || v === "latest") return versions[versions.length - 1];
  return versions.find((x) => x.version === v) ?? null;
}

export function libraryPins(course: Course, lib: Library = LIBRARY): Record<string, string> {
  const pins: Record<string, string> = {};
  for (const u of course.units) for (const l of u.lessons) for (const bi of l.blocks) {
    const b = lookupBlock(bi.ref, course, lib);
    if (b) pins[b.id] = b.version;
  }
  return pins;
}

export function exportCourse(course: Course, now: Date = new Date(), publishMode: CourseExport["publishMode"] = "local-browser-snapshot", lib: Library = LIBRARY): CourseExport {
  return { schema: COURSE_SCHEMA, exportedAt: now.toISOString(), publishMode, course: clone(course), libraryPins: libraryPins(course, lib), latestSnapshot: course.versions.at(-1)?.version ?? null };
}

/** Lesson navigation inside a snapshot. */
export function lessonOrder(units: readonly Unit[]): { unitId: string; lessonId: string; title: Bilingual; unitTitle: Bilingual }[] {
  return units.flatMap((u) => u.lessons.map((l) => ({ unitId: u.id, lessonId: l.id, title: l.title, unitTitle: u.title })));
}
