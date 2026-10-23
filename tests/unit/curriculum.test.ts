import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { BLOCKS } from "@/content/curriculum/blocks";
import { CONCEPTS } from "@/content/curriculum/concepts";
import { COURSE_TEMPLATES } from "@/content/curriculum/courses";
import { DATASETS, datasetById, datasetCsv, datasetR, rName } from "@/content/curriculum/datasets";
import { LAB_STATUS, maturityLabel } from "@/content/curriculum/lab-status";
import { LABS } from "@/content/curriculum/labs";
import { QUESTION_BANK } from "@/content/curriculum/question-bank";
import { LIBRARY, findPrereqCycle, validateAll, validateCourse, validateLibrary } from "@/content/curriculum/validate";

const errors = <T extends { level: string }>(xs: T[]) => xs.filter((x) => x.level === "error");

test("curriculum counts (programmatic, reported in docs/integration)", () => {
  assert.equal(CONCEPTS.length, 169);
  assert.equal(LABS.length, 20);
  assert.equal(BLOCKS.length, 122);
  assert.equal(QUESTION_BANK.length, 41);
  assert.deepEqual(COURSE_TEMPLATES.map((c) => c.id), ["course.qda2", "course.survey"]);
});

test("the shipped curriculum has no reference errors", () => {
  assert.deepEqual(errors(validateAll()), []);
});

test("validator catches duplicates, missing references and prerequisite cycles", () => {
  const [a, b] = CONCEPTS;
  const lib = {
    ...LIBRARY,
    concepts: [{ ...a }, { ...a, prereq: [b.id] }, { ...b, prereq: [a.id] }, { ...b, id: "x.y", labs: ["no-such-lab"], prereq: [], related: [] }],
    blocks: [{ ...BLOCKS[0], concepts: ["no.such.concept"] }],
  };
  const msgs = errors(validateLibrary(lib)).map((e) => e.message);
  assert.ok(msgs.includes("duplicate concept id"));
  assert.ok(msgs.includes("missing lab no-such-lab"));
  assert.ok(msgs.includes("missing concept no.such.concept"));
  assert.ok(msgs.some((m) => m.startsWith("prerequisite cycle")));
});

test("findPrereqCycle returns the cycle path", () => {
  assert.equal(findPrereqCycle(new Map([["a", ["b"]], ["b", ["c"]], ["c", []]])), null);
  assert.deepEqual(findPrereqCycle(new Map([["a", ["b"]], ["b", ["c"]], ["c", ["a"]]])), ["a", "b", "c", "a"]);
});

test("validateCourse flags missing blocks and duplicate lesson ids", () => {
  const c = structuredClone(COURSE_TEMPLATES[0]);
  c.units[0].lessons[0].blocks.push({ ref: "no.such.block" });
  c.units[1].lessons[0].id = c.units[0].lessons[0].id;
  const msgs = errors(validateCourse(c)).map((e) => e.message);
  assert.ok(msgs.includes("missing block no.such.block"));
  assert.ok(msgs.some((m) => m.startsWith("duplicate lesson")));
});

test("the survey course contains the acceptance lesson s14l0", () => {
  const survey = COURSE_TEMPLATES.find((c) => c.id === "course.survey")!;
  assert.ok(survey.units.flatMap((u) => u.lessons).some((l) => l.id === "s14l0"));
});

test("question bank matches the original quiz (ids, options, correct answers)", () => {
  const src = readFileSync(new URL("../../src/content/questions.tsx", import.meta.url), "utf8");
  // Top-level question fields are indented by two spaces; option ids sit at four (inline) or six spaces.
  const helpers = new Map<string, string[]>();
  for (const m of src.matchAll(/\nconst (\w+) = \([^)]*\) => \[([\s\S]*?)\n\];/g)) helpers.set(m[1], [...m[2].matchAll(/id: "([^"]+)"/g)].map((x) => x[1]));
  const legacy = new Map<string, { kind: string; correct?: string; options: string[] }>();
  for (const chunk of src.split(/\n  kind: "/).slice(1)) {
    const kind = chunk.slice(0, chunk.indexOf('"'));
    const id = /\n  id: "([^"]+)"/.exec(chunk)?.[1];
    if (!id) continue;
    const correct = /\n  correct: "([^"]+)"/.exec(chunk)?.[1];
    const helper = /\n  options: (\w+)\(/.exec(chunk)?.[1];
    const options = helper ? helpers.get(helper) ?? [] : [...(/\n  options: \[([\s\S]*?)\n  \],/.exec(chunk)?.[1] ?? "").matchAll(/\n {4}\.\.\.(\w+)\(|\n {4,6}(?:\{ )?id: "([^"]+)"/g)].flatMap((m) => (m[1] ? helpers.get(m[1]) ?? [] : [m[2]]));
    legacy.set(id, { kind, correct, options });
  }
  assert.ok(legacy.size >= 40, `parsed ${legacy.size} legacy questions`);
  let compared = 0;
  for (const q of QUESTION_BANK) {
    const old = legacy.get(q.id);
    if (!old) continue;
    compared++;
    assert.equal(q.kind, old.kind, q.id);
    if (q.kind === "choice") {
      assert.equal(q.correct, old.correct, `${q.id} correct answer`);
      assert.deepEqual(q.options!.map((o) => o.id), old.options, `${q.id} options`);
      assert.equal(q.options!.find((o) => o.correct)?.id, q.correct, `${q.id} correct flag`);
    }
  }
  assert.ok(compared >= 30, `compared ${compared}`);
});

test("datasets are deterministic, rectangular and exportable", () => {
  assert.equal(new Set(DATASETS.map((d) => d.id)).size, DATASETS.length);
  const trust = datasetById("ds.trust-survey")!;
  assert.equal(trust.rows.length, 180);
  assert.deepEqual(trust.rows.slice(0, 3), datasetById("ds.trust-survey")!.rows.slice(0, 3));
  assert.equal(datasetById("ds.index-120")!.rows.length, 120);
  assert.equal(datasetById("nope"), null);
  const csv = datasetCsv({ columns: [{ name: "a", type: "string", label: "" }, { name: "b", type: "number", label: "" }], rows: [['say "hi"', 1]] });
  assert.equal(csv, 'a,b\n"say ""hi""",1');
  assert.equal(rName("ds.trust-survey"), "trust_survey");
  const r = datasetR({ ...trust, rows: trust.rows.slice(0, 2), title: { en: "x\n<script>", hu: "" } });
  assert.match(r, /^# x <script>/);
  assert.match(r, /stratum = factor\(c\("Budapest", "Budapest"\), levels = c\("Budapest", "Towns", "Villages"\)\)/);
  assert.ok(!r.split("\n").slice(1).some((l) => l.startsWith("#")));
});

test("no lab is marked pilot-ready without every maturity dimension", () => {
  assert.equal(Object.keys(LAB_STATUS).length, 20);
  for (const [id, m] of Object.entries(LAB_STATUS)) {
    if (m.pilotReady) assert.ok(m.integrated && m.numericallyValidated && m.accessibilityChecked && m.teachingReviewed, id);
    assert.equal(m.teachingReviewed, false, `${id}: teaching review is a human decision`);
    if (maturityLabel(m) === "pilot-ready") assert.fail(`${id} must not be pilot-ready`);
  }
});
