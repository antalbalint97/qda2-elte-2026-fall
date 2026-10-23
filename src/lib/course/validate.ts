// Validation of course JSON that arrives from outside the code: Builder imports (untrusted files) and the
// published snapshots in src/content/published (checked in CI). Returns readable errors; never throws.
//
// Content is rendered as text nodes everywhere, so these checks are defence in depth: they reject markup and
// script URLs in any string, cap sizes, and make sure every reference a lesson needs is embedded.
import { BLOCK_TYPES, type Block } from "../../content/curriculum/types";
import { LABS } from "../../content/curriculum/labs";
import { isImplemented } from "../../content/curriculum/implemented-labs";
import { ALLOWED_PACKAGES } from "../r/webr-adapter";
import { COURSE_SCHEMA, SNAPSHOT_SCHEMA, type CourseExport, type Snapshot } from "./model";

export const MAX_IMPORT_BYTES = 2_000_000;
const MAX_TEXT = 20_000;
const SLUG = /^[A-Za-z0-9][\w.-]{0,79}$/;
const VERSION = /^\d{1,4}\.\d{1,4}\.\d{1,4}$/;
const DANGEROUS = /<\s*\/?\s*(script|iframe|object|embed|style|link|meta|img|svg|form)\b|javascript:|data:text\/html|\bon(click|load|error|focus|blur|submit|change|input|key\w+|mouse\w+|pointer\w+)\s*=/i;

export interface ValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const isBilingual = (v: unknown) => isObj(v) && typeof v.en === "string" && typeof v.hu === "string";

/** Walks every string in a JSON value. */
function strings(v: unknown, path: string, out: [string, string][] = [], depth = 0): [string, string][] {
  if (depth > 40) return out;
  if (typeof v === "string") out.push([path, v]);
  else if (Array.isArray(v)) v.forEach((x, i) => strings(x, `${path}[${i}]`, out, depth + 1));
  else if (isObj(v)) for (const [k, x] of Object.entries(v)) strings(x, `${path}.${k}`, out, depth + 1);
  return out;
}

function checkText(root: unknown, label: string, errors: string[]) {
  for (const [path, s] of strings(root, label)) {
    if (s.length > MAX_TEXT) errors.push(`${path}: text longer than ${MAX_TEXT} characters`);
    // R code may legitimately contain "<-" and comparisons; only markup/script patterns are refused
    if (DANGEROUS.test(s)) errors.push(`${path}: HTML or script content is not allowed`);
  }
  if (strings(root, label).some(([p]) => /__proto__|\.constructor\b|\.prototype\b/.test(p))) errors.push(`${label}: forbidden key`);
}

function checkBlockShape(b: unknown, where: string, errors: string[]) {
  if (!isObj(b)) return void errors.push(`${where}: not an object`);
  if (typeof b.id !== "string" || !SLUG.test(b.id)) errors.push(`${where}: id must be a short slug`);
  if (!BLOCK_TYPES.includes(b.type as Block["type"])) errors.push(`${where}: unknown block type ${String(b.type)}`);
  if (!isBilingual(b.title)) errors.push(`${where}: title must be {en, hu}`);
  if (b.lab !== undefined && (typeof b.lab !== "string" || !LABS.some((l) => l.id === b.lab))) errors.push(`${where}: unknown lab ${String(b.lab)}`);
  if (b.config !== undefined && !isObj(b.config)) errors.push(`${where}: config must be an object`);
  if (b.type === "r") {
    const c = isObj(b.config) ? b.config : {};
    if (typeof c.code !== "string") errors.push(`${where}: R block code must be a string`);
    const pk = c.packages;
    if (pk !== undefined && (!Array.isArray(pk) || pk.some((p) => !(ALLOWED_PACKAGES as readonly unknown[]).includes(p)))) errors.push(`${where}: R packages must come from the allow-list (${ALLOWED_PACKAGES.join(", ")})`);
  }
}

/** Validates an exported course (qda2-course/2). Size is checked by the caller on the raw text (MAX_IMPORT_BYTES). */
export function validateCourseExport(j: unknown, knownBlockIds?: ReadonlySet<string>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const done = () => ({ ok: !errors.length, errors, warnings });
  if (!isObj(j)) return { ok: false, errors: ["not a JSON object"], warnings };
  if (j.schema !== COURSE_SCHEMA) errors.push(`schema must be ${COURSE_SCHEMA}`);
  const c = j.course;
  if (!isObj(c)) {
    errors.push("missing course");
    return done();
  }
  checkText(j, "export", errors);
  if (typeof c.id !== "string" || !SLUG.test(c.id)) errors.push("course.id must be a short slug");
  if (!isBilingual(c.title)) errors.push("course.title must be {en, hu}");
  if (!Array.isArray(c.units)) {
    errors.push("course.units must be an array");
    return done();
  }
  const localIds = new Set<string>();
  if (c.localBlocks !== undefined && !Array.isArray(c.localBlocks)) errors.push("course.localBlocks must be an array");
  ((c.localBlocks as unknown[]) ?? []).forEach((b, i) => {
    checkBlockShape(b, `localBlocks[${i}]`, errors);
    if (isObj(b) && typeof b.id === "string") localIds.add(b.id);
  });
  const iids = new Set<string>();
  const unitIds = new Set<string>();
  const lessonIds = new Set<string>();
  (c.units as unknown[]).forEach((u, ui) => {
    if (!isObj(u) || typeof u.id !== "string" || !SLUG.test(u.id)) return void errors.push(`unit ${ui}: id must be a short slug`);
    if (unitIds.has(u.id)) errors.push(`duplicate unit ${u.id}`);
    unitIds.add(u.id);
    if (!isBilingual(u.title)) errors.push(`unit ${u.id}: title must be {en, hu}`);
    if (!Array.isArray(u.lessons)) return void errors.push(`unit ${u.id}: lessons must be an array`);
    u.lessons.forEach((l: unknown, li: number) => {
      if (!isObj(l) || typeof l.id !== "string" || !SLUG.test(l.id)) return void errors.push(`lesson ${ui}/${li}: id must be a short slug`);
      if (lessonIds.has(l.id)) errors.push(`duplicate lesson ${l.id}`);
      lessonIds.add(l.id);
      if (!Array.isArray(l.blocks)) return void errors.push(`lesson ${l.id}: blocks must be an array`);
      l.blocks.forEach((b: unknown, bi: number) => {
        const where = `lesson ${l.id} block ${bi}`;
        if (!isObj(b) || typeof b.ref !== "string") return void errors.push(`${where}: ref missing`);
        if (typeof b.iid !== "string" || !SLUG.test(b.iid)) errors.push(`${where}: iid missing`);
        else if (iids.has(b.iid)) errors.push(`duplicate block instance ${b.iid}`);
        else iids.add(b.iid);
        if (knownBlockIds && !knownBlockIds.has(b.ref) && !localIds.has(b.ref)) warnings.push(`unresolved block ref ${b.ref}`);
        if (b.variant !== undefined) {
          if (!isObj(b.variant)) errors.push(`${where}: variant must be an object`);
          else {
            if (b.variant.config !== undefined && !isObj(b.variant.config)) errors.push(`${where}: variant.config must be an object`);
            if (b.variant.locked !== undefined && !(Array.isArray(b.variant.locked) && b.variant.locked.every((x) => typeof x === "string"))) errors.push(`${where}: variant.locked must be a list of keys`);
            if (b.variant.title !== undefined && !isBilingual(b.variant.title)) errors.push(`${where}: variant.title must be {en, hu}`);
          }
        }
      });
    });
  });
  if (c.versions !== undefined && !Array.isArray(c.versions)) errors.push("course.versions must be an array");
  const seen = new Set<string>();
  ((c.versions as unknown[]) ?? []).forEach((v, i) => {
    if (!isObj(v) || typeof v.version !== "string" || !VERSION.test(v.version)) return void errors.push(`version ${i}: malformed`);
    if (seen.has(v.version)) errors.push(`version ${v.version} appears twice`);
    seen.add(v.version);
    const r = validateSnapshot(v.snapshot);
    for (const e of r.errors) errors.push(`version ${v.version}: ${e}`);
  });
  return done();
}

/** Checks that a snapshot renders on its own: every block instance is embedded, every dataset and lab exists. */
export function validateSnapshot(s: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!isObj(s)) return { ok: false, errors: ["snapshot missing"], warnings };
  if (s.schema !== SNAPSHOT_SCHEMA) errors.push(`snapshot schema must be ${SNAPSHOT_SCHEMA}`);
  if (!Array.isArray(s.units) || !isObj(s.blocks) || !isObj(s.datasets)) return { ok: false, errors: [...errors, "snapshot units, blocks or datasets missing"], warnings };
  const snap = s as unknown as Snapshot;
  if (snap.missing?.length) errors.push(`unresolved blocks: ${snap.missing.join(", ")}`);
  for (const u of snap.units) for (const l of u.lessons) for (const bi of l.blocks) {
    const b = bi.iid ? snap.blocks[bi.iid] : undefined;
    if (!b) {
      errors.push(`lesson ${l.id}: block ${bi.ref} (${bi.iid}) is not embedded`);
      continue;
    }
    checkBlockShape(b, `block ${bi.iid}`, errors);
    if (b.lab && (b.type === "lab" || b.type === "experiment") && !isImplemented(b.lab)) errors.push(`block ${bi.iid}: lab ${b.lab} is not implemented`);
    const ds = [b.type === "dataset" ? b.datasetId ?? b.id : null, typeof b.config?.dataset === "string" ? (b.config.dataset as string) : null].filter((x): x is string => !!x);
    for (const id of ds) {
      const ref = snap.datasets[id];
      if (!ref) warnings.push(`block ${bi.iid}: dataset ${id} is not embedded`);
      else if (!ref.embedded) errors.push(`dataset ${id} is too large to embed`);
    }
    if (b.type === "r" && typeof b.config?.dataset === "string" && !snap.datasets[b.config.dataset as string]) errors.push(`block ${bi.iid}: R dataset ${b.config.dataset} is not embedded`);
    if (b.type === "assessment" && !b.questionItems?.length) warnings.push(`block ${bi.iid}: assessment without items`);
  }
  for (const [id, d] of Object.entries(snap.datasets)) {
    if (d.embedded && d.rows) {
      const w = d.columns.length;
      if (d.rows.some((r) => r.length !== w)) errors.push(`dataset ${id}: ragged rows`);
    }
  }
  checkText(s, "snapshot", errors);
  return { ok: !errors.length, errors, warnings };
}

/** Parses and validates an import file's text. */
export function parseCourseImport(text: string, knownBlockIds?: ReadonlySet<string>): ValidationResult & { data?: CourseExport } {
  if (text.length > MAX_IMPORT_BYTES) return { ok: false, errors: [`file is larger than ${MAX_IMPORT_BYTES / 1_000_000} MB`], warnings: [] };
  let j: unknown;
  try {
    j = JSON.parse(text);
  } catch {
    return { ok: false, errors: ["not valid JSON"], warnings: [] };
  }
  const r = validateCourseExport(j, knownBlockIds);
  return r.ok ? { ...r, data: j as CourseExport } : r;
}
