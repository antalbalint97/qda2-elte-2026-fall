// Browser-local stores for course work. Nothing here is sent anywhere; every key is listed on /privacy
// (STORAGE_KEYS) and can be deleted there. Storage can be unavailable (private windows, blocked site data), so
// every access is guarded and callers get a status they can show.
import { STORAGE_KEYS } from "../theme";
import type { Course } from "./model";

export type StoreStatus = "ok" | "unavailable" | "full";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown): StoreStatus {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return "ok";
  } catch (e) {
    return e instanceof DOMException && /quota/i.test(e.name + e.message) ? "full" : "unavailable";
  }
}
function remove(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* nothing stored */
  }
}

// ── Course Builder drafts ──────────────────────────────────────────────────────

/** Draft metadata the Builder shows next to a course. */
export interface DraftMeta {
  savedAt: string;
  /** When this draft was last exported; an edit after that makes it a plain draft again. */
  exportedAt: string | null;
  /** Revision counter, bumped on every save; `exportedRev` records which revision was exported. */
  rev: number;
  exportedRev: number | null;
}
export interface DraftStore {
  v: 1;
  current: string | null;
  courses: Record<string, { course: Course; meta: DraftMeta }>;
}
const EMPTY_DRAFTS: DraftStore = { v: 1, current: null, courses: {} };

export function loadDrafts(): DraftStore {
  const s = read<DraftStore>(STORAGE_KEYS.courseDrafts, EMPTY_DRAFTS);
  return s && s.v === 1 && s.courses && typeof s.courses === "object" ? s : EMPTY_DRAFTS;
}
export const saveDrafts = (s: DraftStore): StoreStatus => write(STORAGE_KEYS.courseDrafts, s);

// ── Atlas → Builder hand-off ────────────────────────────────────────────────────

export function setAtlasPending(blockId: string): StoreStatus {
  return write(STORAGE_KEYS.atlasPending, { blockId, at: new Date().toISOString() });
}
/** Returns and clears the block picked in the Atlas. */
export function takeAtlasPending(): string | null {
  const v = read<{ blockId?: unknown } | null>(STORAGE_KEYS.atlasPending, null);
  remove(STORAGE_KEYS.atlasPending);
  return v && typeof v.blockId === "string" ? v.blockId : null;
}

// ── Student answers in lessons ──────────────────────────────────────────────────

/**
 * Typed answers (predictions, reflections) and quiz picks, keyed "courseId@version/lessonId/iid". Kept only in
 * this browser; the student can export them as a file to hand in, or delete them.
 */
export interface LessonAnswers {
  v: 1;
  answers: Record<string, { text?: string; choice?: string; order?: string[]; correct?: boolean; at: string }>;
}
const EMPTY_ANSWERS: LessonAnswers = { v: 1, answers: {} };
export function loadAnswers(): LessonAnswers {
  const s = read<LessonAnswers>(STORAGE_KEYS.lessonAnswers, EMPTY_ANSWERS);
  return s && s.v === 1 && s.answers && typeof s.answers === "object" ? s : EMPTY_ANSWERS;
}
export const saveAnswers = (s: LessonAnswers): StoreStatus => write(STORAGE_KEYS.lessonAnswers, s);
export const deleteAnswers = () => remove(STORAGE_KEYS.lessonAnswers);
