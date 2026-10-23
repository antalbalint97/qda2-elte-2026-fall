// Pure editing operations on a draft course, used by the Course Builder. Each returns a new course and leaves
// its input (and every snapshot version, which is frozen) untouched.
import type { Bilingual, Block, BlockInstance, BlockType, BlockVariant, Lesson, Unit } from "../../content/curriculum/types";
import { allIids, newIid, type Course } from "./model";

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
/** Copies the editable part; versions are shared (they are immutable). */
function edit(c: Course, f: (units: Unit[], local: Block[]) => void): Course {
  const units = clone(c.units);
  const local = clone(c.localBlocks);
  f(units, local);
  return { ...c, units, localBlocks: local };
}
const findLesson = (units: Unit[], lessonId: string) => {
  for (const u of units) {
    const i = u.lessons.findIndex((l) => l.id === lessonId);
    if (i >= 0) return { unit: u, index: i, lesson: u.lessons[i] };
  }
  return null;
};
const nextId = (taken: string[], prefix: string) => {
  for (let i = 1; ; i++) if (!taken.includes(`${prefix}${i}`)) return `${prefix}${i}`;
};

export function newCourse(id: string, title: Bilingual): Course {
  return { id, version: "0.0.0", state: "draft", title, description: "", outcomes: [], units: [{ id: "u1", title: { en: "Unit 1", hu: "1. egység" }, lessons: [{ id: "u1l1", title: { en: "Lesson 1", hu: "1. lecke" }, blocks: [] }] }], localBlocks: [], versions: [] };
}

export function addUnit(c: Course): { course: Course; unitId: string } {
  const unitId = nextId(c.units.map((u) => u.id), "u");
  const n = c.units.length + 1;
  return { course: edit(c, (units) => units.push({ id: unitId, title: { en: `Unit ${n}`, hu: `${n}. egység` }, lessons: [] })), unitId };
}
export function removeUnit(c: Course, unitId: string): Course {
  return edit(c, (units) => {
    const i = units.findIndex((u) => u.id === unitId);
    if (i >= 0 && units.length > 1) units.splice(i, 1);
  });
}
export function addLesson(c: Course, unitId: string): { course: Course; lessonId: string } {
  const lessonId = nextId(c.units.flatMap((u) => u.lessons.map((l) => l.id)), `${unitId}l`);
  return {
    course: edit(c, (units) => {
      const u = units.find((x) => x.id === unitId);
      u?.lessons.push({ id: lessonId, title: { en: `Lesson ${u.lessons.length + 1}`, hu: `${u.lessons.length + 1}. lecke` }, blocks: [] });
    }),
    lessonId,
  };
}
export function removeLesson(c: Course, lessonId: string): Course {
  return edit(c, (units) => {
    const f = findLesson(units, lessonId);
    if (f) f.unit.lessons.splice(f.index, 1);
  });
}
/** Moves a lesson up or down; at the edge of a unit it moves into the neighbouring unit. */
export function moveLesson(c: Course, lessonId: string, dir: -1 | 1): Course {
  return edit(c, (units) => {
    const ui = units.findIndex((u) => u.lessons.some((l) => l.id === lessonId));
    if (ui < 0) return;
    const ls = units[ui].lessons;
    const i = ls.findIndex((l) => l.id === lessonId);
    const j = i + dir;
    if (j >= 0 && j < ls.length) [ls[i], ls[j]] = [ls[j], ls[i]];
    else if (units[ui + dir]) {
      const [l] = ls.splice(i, 1);
      if (dir < 0) units[ui - 1].lessons.push(l);
      else units[ui + 1].lessons.unshift(l);
    }
  });
}
export function setTitle(c: Course, target: { unitId?: string; lessonId?: string }, title: Bilingual): Course {
  return edit(c, (units) => {
    if (target.lessonId) {
      const f = findLesson(units, target.lessonId);
      if (f) f.lesson.title = title;
    } else if (target.unitId) {
      const u = units.find((x) => x.id === target.unitId);
      if (u) u.title = title;
    }
  });
}

export function addBlock(c: Course, lessonId: string, ref: string, at?: number): { course: Course; iid: string } {
  const iid = newIid(allIids(c));
  return {
    course: edit(c, (units) => {
      const f = findLesson(units, lessonId);
      if (!f) return;
      const bi: BlockInstance = { ref, iid };
      f.lesson.blocks.splice(at ?? f.lesson.blocks.length, 0, bi);
    }),
    iid,
  };
}
export function removeBlock(c: Course, iid: string): Course {
  return edit(c, (units) => {
    for (const u of units) for (const l of u.lessons) l.blocks = l.blocks.filter((b) => b.iid !== iid);
  });
}
export function moveBlock(c: Course, iid: string, dir: -1 | 1): Course {
  return edit(c, (units) => {
    for (const u of units)
      for (const l of u.lessons) {
        const i = l.blocks.findIndex((b) => b.iid === iid);
        const j = i + dir;
        if (i >= 0 && j >= 0 && j < l.blocks.length) [l.blocks[i], l.blocks[j]] = [l.blocks[j], l.blocks[i]];
      }
  });
}
/** Copies an instance (with its variant) right after itself under a new iid. */
export function duplicateBlock(c: Course, iid: string): { course: Course; iid: string } {
  const copy = newIid(allIids(c));
  return {
    course: edit(c, (units) => {
      for (const u of units)
        for (const l of u.lessons) {
          const i = l.blocks.findIndex((b) => b.iid === iid);
          if (i >= 0) l.blocks.splice(i + 1, 0, { ...clone(l.blocks[i]), iid: copy, pin: undefined });
        }
    }),
    iid: copy,
  };
}
/** Replaces an instance's variant; an empty variant is removed (the instance is a plain reference again). */
export function setVariant(c: Course, iid: string, variant: BlockVariant | undefined): Course {
  const empty = !variant || Object.values(variant).every((v) => v === undefined || (Array.isArray(v) && !v.length) || (typeof v === "object" && v !== null && !Array.isArray(v) && !Object.keys(v).length));
  return edit(c, (units) => {
    for (const u of units)
      for (const l of u.lessons)
        for (const b of l.blocks)
          if (b.iid === iid) {
            if (empty) delete b.variant;
            else b.variant = clone(variant);
          }
  });
}

const LOCAL_DEFAULTS: Partial<Record<BlockType, Partial<Block>>> = {
  r: { software: ["R"], config: { code: "# R code\n", packages: [], editable: true } },
};
/** A course-local block (never added to the shared library). */
export function addLocalBlock(c: Course, type: BlockType, title: Bilingual): { course: Course; id: string } {
  const id = nextId(c.localBlocks.map((b) => b.id), `local.${type}-`);
  const block: Block = {
    id,
    type,
    title,
    version: "1.0.0",
    min: 5,
    lvl: 1,
    concepts: [],
    software: [],
    objective: "",
    src: "course-local",
    review: { content: "draft", scientific: "unreviewed", numerical: "n/a", pedagogical: "unreviewed", accessibility: "unverified", translation: "titles-only", pilot: "none" },
    ...LOCAL_DEFAULTS[type],
  };
  return { course: { ...c, localBlocks: [...clone(c.localBlocks), block] }, id };
}

export const lessonById = (c: Course, lessonId: string): Lesson | null => findLesson(c.units, lessonId)?.lesson ?? null;
export const unitOfLesson = (c: Course, lessonId: string): Unit | null => findLesson(c.units, lessonId)?.unit ?? null;
