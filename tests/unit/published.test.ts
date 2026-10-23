// Published course versions: registered, unchanged since publication, and renderable from the snapshot alone.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { test } from "node:test";
import { PUBLISHED, publishedVersion } from "../../src/content/published/index";
import { validateCourseExport, validateSnapshot } from "../../src/lib/course/validate";

const DIR = new URL("../../src/content/published/", import.meta.url);
const LOCK = JSON.parse(readFileSync(new URL("LOCK.json", DIR), "utf8")) as Record<string, string>;
const files = readdirSync(DIR).filter((d) => statSync(new URL(d, DIR)).isDirectory()).flatMap((d) => readdirSync(new URL(`${d}/`, DIR)).map((f) => `${d}/${f}`));

test("every published file is registered and locked, and nothing else is", () => {
  assert.deepEqual(files.sort(), PUBLISHED.map((p) => p.file).sort());
  assert.deepEqual(Object.keys(LOCK).sort(), files.sort());
});

test("published files are byte-identical to the version that was reviewed (LOCK.json)", () => {
  // To publish a NEW version, add its file and its hash. Changing an existing hash means rewriting a published
  // version, which is not allowed: publish the change as a new version instead.
  for (const f of files) assert.equal(createHash("sha256").update(readFileSync(new URL(f, DIR))).digest("hex"), LOCK[f], `${f} changed after publication`);
});

test("each file is a valid qda2-course/2 export whose single version matches its file name", () => {
  for (const p of PUBLISHED) {
    const r = validateCourseExport(p.data);
    assert.deepEqual(r.errors, [], p.file);
    assert.equal(p.data.course.id, p.courseId);
    assert.equal(p.file, `${p.courseId}/${p.version}.json`);
    assert.deepEqual(p.data.course.versions.map((v) => v.version), [p.version]);
    assert.equal(p.data.latestSnapshot, p.version);
    const s = validateSnapshot(p.data.course.versions[0].snapshot);
    assert.deepEqual(s.errors, [], p.file);
  }
});

test("versions resolve by number and 'latest'; unknown versions do not fall back silently", () => {
  assert.equal(publishedVersion("course.survey")?.version, "1.0.0");
  assert.equal(publishedVersion("course.survey", "latest")?.version, "1.0.0");
  assert.equal(publishedVersion("course.survey", "9.9.9"), null);
  assert.equal(publishedVersion("course.nope"), null);
});

test("the acceptance lesson is embedded with everything it needs", () => {
  const snap = publishedVersion("course.survey")!.data.course.versions[0].snapshot;
  const lesson = snap.units.flatMap((u) => u.lessons).find((l) => l.id === "s14l0")!;
  const blocks = lesson.blocks.map((b) => snap.blocks[b.iid!]);
  assert.deepEqual(blocks.map((b) => b.type), ["concept", "prediction", "lab", "math", "r", "assessment", "reflection"]);
  const lab = blocks[2];
  assert.equal(lab.lab, "survey-weighting-studio");
  assert.deepEqual(lab.config, { design: "stratified", n: 120, allocation: "disproportionate", stage: 4 });
  assert.deepEqual(lab.lockedControls, ["design", "allocation"]);
  const r = blocks[4];
  assert.match(String(r.config.code), /svydesign/);
  assert.equal(snap.datasets["ds.trust-survey"].embedded, true);
  assert.equal(snap.datasets["ds.trust-survey"].rows!.length, 180);
  assert.ok(blocks[5].questionItems.length >= 1);
  assert.ok(blocks.every((b) => b.libraryVersion && b.iid));
  assert.match(blocks[0].body!, /inclusion probability/);
});
