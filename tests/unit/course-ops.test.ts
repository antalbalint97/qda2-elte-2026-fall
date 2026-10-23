// Course Builder editing operations and the authoring switch.
import assert from "node:assert/strict";
import { test } from "node:test";
import { COURSE_TEMPLATES } from "../../src/content/curriculum/courses";
import { authoringEnabled } from "../../src/lib/authoring";
import { addSnapshotVersion, courseFromTemplate, type Course } from "../../src/lib/course/model";
import { addBlock, addLesson, addLocalBlock, addUnit, duplicateBlock, moveBlock, moveLesson, newCourse, removeBlock, removeUnit, setVariant } from "../../src/lib/course/ops";

const lessons = (c: Course) => c.units.map((u) => u.lessons.map((l) => l.id));
const blocks = (c: Course, lessonId: string) => c.units.flatMap((u) => u.lessons).find((l) => l.id === lessonId)!.blocks;

test("lessons move within a unit and across unit boundaries", () => {
  let c = newCourse("course.t", { en: "T", hu: "T" });
  c = addLesson(c, "u1").course;
  c = addUnit(c).course;
  assert.deepEqual(lessons(c), [["u1l1", "u1l2"], []]);
  c = moveLesson(c, "u1l1", 1);
  assert.deepEqual(lessons(c), [["u1l2", "u1l1"], []]);
  c = moveLesson(c, "u1l1", 1);
  assert.deepEqual(lessons(c), [["u1l2"], ["u1l1"]]);
  c = moveLesson(c, "u1l1", -1);
  assert.deepEqual(lessons(c), [["u1l2", "u1l1"], []]);
  assert.equal(removeUnit(removeUnit(c, "u2"), "u1").units.length, 1, "the last unit is kept");
});

test("blocks are added, moved, duplicated and removed without touching the input", () => {
  const start = newCourse("course.t", { en: "T", hu: "T" });
  const before = JSON.stringify(start);
  const a = addBlock(start, "u1l1", "c.inclusion-weights");
  const b = addBlock(a.course, "u1l1", "m.ht-hajek");
  let c = b.course;
  assert.equal(JSON.stringify(start), before);
  assert.notEqual(a.iid, b.iid);
  c = moveBlock(c, b.iid, -1);
  assert.deepEqual(blocks(c, "u1l1").map((x) => x.iid), [b.iid, a.iid]);
  c = moveBlock(c, b.iid, -1);
  assert.deepEqual(blocks(c, "u1l1").map((x) => x.iid), [b.iid, a.iid], "moving past the edge does nothing");
  c = setVariant(c, a.iid, { notes: "keep" });
  const d = duplicateBlock(c, a.iid);
  assert.deepEqual(blocks(d.course, "u1l1").map((x) => x.iid), [b.iid, a.iid, d.iid]);
  assert.equal(blocks(d.course, "u1l1")[2].variant?.notes, "keep");
  assert.equal(blocks(removeBlock(d.course, a.iid), "u1l1").length, 2);
});

test("an empty variant turns the instance back into a plain reference", () => {
  const a = addBlock(newCourse("course.t", { en: "T", hu: "T" }), "u1l1", "c.inclusion-weights");
  const withVariant = setVariant(a.course, a.iid, { config: { n: 50 } });
  assert.deepEqual(blocks(withVariant, "u1l1")[0].variant, { config: { n: 50 } });
  for (const empty of [undefined, {}, { config: {} }, { lockedControls: [] }]) assert.equal(blocks(setVariant(withVariant, a.iid, empty), "u1l1")[0].variant, undefined);
});

test("course-local blocks get unique ids; snapshot versions stay frozen while the draft is edited", () => {
  let c = courseFromTemplate(COURSE_TEMPLATES.find((t) => t.id === "course.survey")!);
  const r1 = addLocalBlock(c, "r", { en: "My R", hu: "Saját R" });
  const r2 = addLocalBlock(r1.course, "r", { en: "My R 2", hu: "Saját R 2" });
  assert.deepEqual([r1.id, r2.id], ["local.r-1", "local.r-2"]);
  c = addSnapshotVersion(c, new Date("2026-10-23T00:00:00Z")).course;
  const snap = c.versions[0].snapshot;
  const edited = setVariant(c, c.units[0].lessons[0].blocks[0].iid!, { notes: "changed" });
  assert.equal(edited.versions[0].snapshot, snap);
  assert.ok(Object.isFrozen(snap));
});

test("the Builder is served only in development or with QDA2_AUTHORING=local", () => {
  const env = process.env as Record<string, string | undefined>;
  const saved = { NODE_ENV: env.NODE_ENV, QDA2_AUTHORING: env.QDA2_AUTHORING };
  try {
    env.NODE_ENV = "production";
    delete env.QDA2_AUTHORING;
    assert.equal(authoringEnabled(), false);
    env.QDA2_AUTHORING = "1";
    assert.equal(authoringEnabled(), false);
    env.QDA2_AUTHORING = "local";
    assert.equal(authoringEnabled(), true);
    delete env.QDA2_AUTHORING;
    env.NODE_ENV = "development";
    assert.equal(authoringEnabled(), true);
  } finally {
    for (const [k, v] of Object.entries(saved)) if (v === undefined) delete env[k];
    else env[k] = v;
  }
});
