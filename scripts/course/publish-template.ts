// Creates a published course version from a course template, as an instructor's Builder export would:
//   node --import ./tests/unit/register.mjs --experimental-strip-types scripts/course/publish-template.ts course.survey 1.0.0
// Writes src/content/published/<courseId>/<version>.json and refuses to overwrite an existing version
// (published versions are immutable; publish a new version instead). Register the file in
// src/content/published/index.ts and record its hash in LOCK.json (the unit tests say how).
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { COURSE_TEMPLATES } from "../../src/content/curriculum/courses";
import { addSnapshotVersion, courseFromTemplate, exportCourse } from "../../src/lib/course/model";
import { validateCourseExport } from "../../src/lib/course/validate";

const [templateId, version] = process.argv.slice(2);
const t = COURSE_TEMPLATES.find((c) => c.id === templateId);
if (!t || !/^\d+\.\d+\.\d+$/.test(version ?? "")) {
  console.error("usage: publish-template.ts <templateId> <version>");
  process.exit(2);
}
const dir = new URL(`../../src/content/published/${t.id}/`, import.meta.url);
const file = new URL(`${version}.json`, dir);
if (existsSync(file)) {
  console.error(`${t.id}/${version}.json exists; published versions are never replaced`);
  process.exit(1);
}
const draft = courseFromTemplate(t);
const { course } = addSnapshotVersion(draft);
const v = course.versions.at(-1)!;
const fixed = { ...course, versions: [{ ...v, version, snapshot: v.snapshot }] , version };
const exp = exportCourse(fixed, new Date(), "static-build");
const check = validateCourseExport(JSON.parse(JSON.stringify(exp)));
if (!check.ok) {
  console.error(check.errors.join("\n"));
  process.exit(1);
}
mkdirSync(dir, { recursive: true });
const text = JSON.stringify(exp, null, 1) + "\n";
writeFileSync(file, text);
console.log(`wrote ${t.id}/${version}.json (${(text.length / 1024).toFixed(0)} kB) sha256 ${createHash("sha256").update(text).digest("hex")}`);
for (const w of check.warnings) console.log("warning:", w);
