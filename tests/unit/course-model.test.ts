// Course model: snapshots, versions, immutability, export/import and import validation.
import assert from "node:assert/strict";
import { test } from "node:test";
import { BLOCKS } from "../../src/content/curriculum/blocks";
import { COURSE_TEMPLATES } from "../../src/content/curriculum/courses";
import { addSnapshotVersion, buildSnapshot, courseFromTemplate, effective, exportCourse, lessonOrder, nextVersion, versionOf, type Course } from "../../src/lib/course/model";
import { MAX_IMPORT_BYTES, parseCourseImport, validateCourseExport } from "../../src/lib/course/validate";

const survey = () => courseFromTemplate(COURSE_TEMPLATES.find((c) => c.id === "course.survey")!);
const known = new Set(BLOCKS.map((b) => b.id));
const firstLab = (c: Course) => c.units.flatMap((u) => u.lessons).find((l) => l.id === "s14l0")!.blocks.find((b) => b.ref === "l.sws-weights")!;

test("templates become drafts with unique instance ids; the templates are not changed", () => {
  const before = JSON.stringify(COURSE_TEMPLATES);
  const c = survey();
  const iids = c.units.flatMap((u) => u.lessons.flatMap((l) => l.blocks.map((b) => b.iid)));
  assert.ok(iids.every(Boolean));
  assert.equal(new Set(iids).size, iids.length);
  firstLab(c).variant!.config!.n = 999;
  assert.equal(JSON.stringify(COURSE_TEMPLATES), before);
});

test("version numbers: 1.0.0, then minor bumps", () => {
  assert.equal(nextVersion([]), "1.0.0");
  assert.equal(nextVersion([{ version: "1.0.0" }]), "1.1.0");
  assert.equal(nextVersion([{ version: "1.0.0" }, { version: "1.9.0" }]), "1.10.0");
  let c = survey();
  c = addSnapshotVersion(c).course;
  c = addSnapshotVersion(c).course;
  assert.deepEqual(c.versions.map((v) => v.version), ["1.0.0", "1.1.0"]);
  assert.equal(c.version, "1.1.0");
  assert.equal(versionOf(c.versions)?.version, "1.1.0");
  assert.equal(versionOf(c.versions, "1.0.0")?.version, "1.0.0");
  assert.equal(versionOf(c.versions, "2.0.0"), null);
});

test("a snapshot is immutable: editing the draft afterwards leaves it byte-identical", () => {
  const { course, version } = addSnapshotVersion(survey());
  const frozen = JSON.stringify(version.snapshot);
  const lab = firstLab(course);
  lab.variant!.config!.n = 50;
  lab.variant!.instructions = "changed";
  course.units[0].lessons[0].title.en = "changed";
  course.units[0].lessons[0].blocks.reverse();
  course.localBlocks.push({ ...BLOCKS[0], id: "local.x" });
  assert.equal(JSON.stringify(version.snapshot), frozen);
  assert.ok(Object.isFrozen(version.snapshot) && Object.isFrozen(version.snapshot.blocks));
  assert.throws(() => {
    (version.snapshot.units as unknown as unknown[]).push({});
  });
  const again = addSnapshotVersion(course).course;
  assert.equal(JSON.stringify(again.versions[0].snapshot), frozen, "older versions are carried over unchanged");
  assert.notEqual(JSON.stringify(again.versions[1].snapshot), frozen);
});

test("snapshots embed effective content, pins, concepts, questions, datasets and R starter code", () => {
  const c = survey();
  const snap = buildSnapshot(c);
  assert.deepEqual(snap.missing, []);
  for (const u of snap.units) for (const l of u.lessons) for (const bi of l.blocks) {
    const b = snap.blocks[bi.iid!];
    assert.equal(bi.pin, b.libraryVersion, "every instance is pinned to the library version it was published with");
    assert.equal(b.libraryVersion, BLOCKS.find((x) => x.id === bi.ref)!.version);
  }
  const lab = snap.blocks[firstLab(c).iid!];
  assert.equal(lab.config.n, 120);
  assert.deepEqual(lab.lockedControls, ["design", "allocation"]);
  assert.ok(lab.conceptCards.some((k) => k.id === "survey.inclusion_prob" && k.def.length > 20));
  const r = Object.values(snap.blocks).find((b) => b.type === "r")!;
  assert.equal(typeof r.config.code, "string");
  assert.equal(r.config.dataset, "ds.trust-survey");
  assert.equal(snap.datasets["ds.trust-survey"].rows!.length, 180);
  assert.equal(snap.datasets["ds.trust-survey"].provenance.kind, "synthetic");
  const a = Object.values(snap.blocks).find((b) => b.ref === "a.survey-variance")!;
  assert.deepEqual(a.questionItems.map((q) => q.id).sort(), ["s-deff-meaning", "s-naive-se", "s-neff"]);
  assert.ok(a.questionItems.every((q) => q.explanation && (q.kind !== "choice" || q.options!.some((o) => o.correct))));
});

test("variants never change library blocks; unknown lab config keys are dropped and reported", () => {
  const before = JSON.stringify(BLOCKS);
  const e = effective({ ref: "l.sws-weights", iid: "x1", variant: { config: { n: 50, bogus: 1, design: "nope" }, locked: ["n"] } }, { localBlocks: [] })!;
  assert.equal(e.config.n, 50);
  assert.equal(e.config.bogus, undefined);
  assert.equal(e.config.design, undefined);
  assert.deepEqual(e.rejectedConfig?.sort(), ["bogus", "design"]);
  assert.equal(JSON.stringify(BLOCKS), before);
  assert.equal(effective({ ref: "nope", iid: "x2" }, { localBlocks: [] }), null);
  const snap = buildSnapshot({ ...survey(), units: [{ id: "u", title: { en: "u", hu: "u" }, lessons: [{ id: "l", title: { en: "l", hu: "l" }, blocks: [{ ref: "nope", iid: "z" }] }] }] });
  assert.deepEqual(snap.missing, ["nope"]);
});

test("export → JSON → import round trip keeps the course and its snapshots", () => {
  const { course } = addSnapshotVersion(survey(), new Date("2026-10-23T10:00:00Z"));
  const exp = exportCourse(course, new Date("2026-10-23T11:00:00Z"));
  assert.equal(exp.schema, "qda2-course/2");
  assert.equal(exp.latestSnapshot, "1.0.0");
  assert.equal(exp.libraryPins["l.sws-weights"], "1.0.0");
  const text = JSON.stringify(exp);
  const r = parseCourseImport(text, known);
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.warnings, []);
  assert.equal(JSON.stringify(r.data!.course), JSON.stringify(course));
  assert.equal(lessonOrder(r.data!.course.versions[0].snapshot.units).length, lessonOrder(course.units).length);
});

test("untrusted imports are refused with reasons", () => {
  const base = exportCourse(survey());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the test mutates arbitrary nested fields of a parsed export
  const bad = (mut: (j: Record<string, any>) => void) => {
    const j = JSON.parse(JSON.stringify(base));
    mut(j);
    return validateCourseExport(j, known);
  };
  assert.equal(parseCourseImport("{", known).ok, false);
  assert.equal(parseCourseImport("x".repeat(MAX_IMPORT_BYTES + 1)).ok, false);
  assert.match(bad((j) => (j.schema = "qda2-course/1")).errors.join(), /schema/);
  assert.match(bad((j) => (j.course.id = "../etc")).errors.join(), /slug/);
  assert.match(bad((j) => (j.course.units[0].lessons[0].blocks[0].variant = { body: "<script>alert(1)</script>" })).errors.join(), /HTML or script/);
  assert.match(bad((j) => (j.course.units[0].lessons[0].blocks[0].variant = { notes: "click javascript:alert(1)" })).errors.join(), /HTML or script/);
  assert.match(bad((j) => (j.course.units[0].lessons[0].blocks[1].iid = j.course.units[0].lessons[0].blocks[0].iid)).errors.join(), /duplicate block instance/);
  assert.match(bad((j) => j.course.localBlocks.push({ id: "my.r", type: "r", title: { en: "R", hu: "R" }, config: { code: 1 } })).errors.join(), /code must be a string/);
  assert.match(bad((j) => j.course.localBlocks.push({ id: "my.r", type: "r", title: { en: "R", hu: "R" }, config: { code: "1", packages: ["remotes"] } })).errors.join(), /allow-list/);
  assert.match(bad((j) => (j.course.units[0].lessons[0].blocks[0].variant = { config: [] })).errors.join(), /variant.config/);
  assert.deepEqual(bad((j) => (j.course.units[0].lessons[0].blocks[0].ref = "unknown.block")).warnings, ["unresolved block ref unknown.block"]);
  // R code with comparisons and assignment arrows is fine
  assert.equal(bad((j) => j.course.localBlocks.push({ id: "my.r", type: "r", title: { en: "R", hu: "R" }, config: { code: "x <- 1:10\nx[x<a]\nif (x > 2) print('ok')" } })).ok, true);
});
