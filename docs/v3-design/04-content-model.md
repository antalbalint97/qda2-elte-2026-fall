# 04 · Content model, learning block system, course model, versioning

All entities are plain JSON-serialisable objects. The prototype stores them in the browser (`localStorage` key `qda2-course-drafts-v1`); the same shapes are meant for `src/content/*.ts` and for file export/import. No proprietary backend is assumed.

## Entities

```ts
type Lang = "en" | "hu";
type L10n = Record<Lang, string>;
type SemVer = `${number}.${number}.${number}`;

interface Concept {                      // Layer 1 — data/concepts-*.js
  id: string;                            // "domain.slug", stable forever
  domain: "A"|"B"|"C"|"D"|"E"|"F"|"G"|"H"|"I"|"J"|"K";
  name: L10n; def: string; notation: string;
  level: 1|2|3|4;
  prereq: string[];                      // hard conceptual prerequisites (acyclic)
  related: string[]; gen?: string[]; alt?: string[];
  apps: string[]; misconceptions: string[]; activities: string[];
  labs: string[];                        // LabDefinition ids
  existing?: string;                     // route in the current site
}

interface LabDefinition {                // Layer 2 — data/labs.js
  id: string; name: L10n; status: "built"|"repo"|"spec"; file?: string;
  engine: string;                        // which pure functions it calls
  concepts: string[]; interaction: string; views: string[]; outputs: string[];
  params: { key: string; type: "enum"|"int"|"float"|"boolean"|"range"|"array"|"object"|"string"; options?: unknown[] }[];
  instructorOptions: string[]; a11y: string[]; components: string[]; tests: string[];
}

interface LabConfiguration {             // what a block or a share URL pins
  lab: string;                           // LabDefinition id
  params: Record<string, unknown>;       // subset of LabDefinition.params keys
  dataset?: string;                      // Dataset id
  controls?: { hidden?: string[]; locked?: string[] };
  outputs?: { visible?: string[] };      // StatisticReadout keys
  formulas?: { visible?: string[]; level: "none"|"result"|"terms"|"derivation" };
  sequence?: string[];                   // suggested experiment steps (block ids or free text)
  instructions?: L10n; prompts?: L10n[];
  lang?: Lang; present?: { zoom?: number; hidePanels?: boolean };
}
// Invariant: a LabConfiguration can hide, lock or preset — it can never change how a statistic is computed.

interface Dataset {
  id: string; title: L10n; schema: { name: string; level: "nominal"|"ordinal"|"scale"; label: L10n }[];
  provenance: { kind: "synthetic"|"real"; n: number|null; generator: string; license: string; limits: string; seed?: number };
  data?: unknown[][];                    // inline for small synthetic sets; otherwise `url` or "instructor supplies"
}

type BlockType = "concept"|"lab"|"math"|"dataset"|"prediction"|"experiment"|"assessment"|"software"|"reflection"|"connection";

interface LearningBlock {                // Layer 3 — data/blocks.js (shared library)
  id: string; type: BlockType; version: SemVer; reviewed: boolean;
  title: L10n; objective: string; min: number; lvl: 1|4;
  concepts: string[]; software: ("SPSS"|"R"|"Python")[];
  lab?: string; config?: LabConfiguration["params"];   // for lab/experiment/connection blocks
  prompt?: string;                       // prediction/reflection
  items?: string[];                      // AssessmentItem ids
  body?: L10n;                           // concept/math/software text (markdown + KaTeX)
  src?: string;                          // repo file or route the content comes from
  provenance?: Dataset["provenance"];    // dataset blocks
}

interface AssessmentItem {               // = repo ChoiceQuestion | OrderQuestion + graph ids
  id: string; kind: "choice"|"order"; concepts: string[]; format: string; prompt: string;
  options?: { id: string; label: string; why?: string }[]; correct?: string; items?: {id:string;label:string;why?:string}[];
  explanation: string; evidence: string; // what a correct answer demonstrates
}

interface BlockInstance {                // inside a Lesson
  iid: string;                           // instance id, unique in the course
  ref: string;                           // LearningBlock id
  pin?: SemVer;                          // library version frozen at publish
  variant?: { title?: L10n; notes?: string; body?: L10n; config?: Record<string, unknown>; prompt?: string };
}
interface Lesson { id: string; title: L10n; blocks: BlockInstance[] }
interface Unit   { id: string; title: L10n; lessons: Lesson[] }
interface Course {                       // Layer 4 — data/courses.js
  id: string; version: SemVer; state: "draft"|"preview"|"published"; lang: Lang;
  title: L10n; description: string; audience: string; prerequisites: string[]; outcomes: string[];
  workload: string; software: string[]; assessment: { formative: string; final: string }; instructorNotes: string;
  units: Unit[];
}
interface CourseVersion { courseId: string; version: SemVer; publishedAt: string; snapshot: Course; libraryPins: Record<string, SemVer> }
```

## Learning block system

| Type | Purpose | Renders as (student) | Needs |
|---|---|---|---|
| concept | explain an idea | prose + one still of the linked lab | body, concepts |
| lab | open experiment | embedded lab at `config`, Explore/Learn modes | lab, config |
| math | notation ↔ picture | formula with term inspector synced to lab | body or inspector keys |
| dataset | load data with provenance card | card + variable list | provenance, schema |
| prediction | commit before seeing | text/choice input, answer stored locally, revealed after the next lab block | prompt |
| experiment | structured task in a lab | lab + numbered steps + checkpoints | lab, config, sequence |
| assessment | check understanding | QuizRunner | items |
| software | menu path / syntax / output | Spss component, R/Python tabs | software |
| reflection | interpret | free text saved locally | prompt |
| connection | link to earlier/later concept | one-paragraph bridge + atlas jump | concepts |

Lesson sequence template `Predict → Experiment → Explain → Formalize → Apply → Transfer` maps to `prediction → lab/experiment → concept → math → software/assessment → connection/reflection`. The Course Builder suggests this order when a lesson is created but never enforces it.

## Reference vs variant

- **Reference** (`{ref}`): the lesson renders the library block at `pin` (or latest while draft).
- **Variant** (`{ref, variant}`): the library block is rendered with the overrides merged on top; `config` overrides are validated against `LabDefinition.params` (unknown keys dropped, values coerced). The shared block is never mutated; the Builder shows a "variant of …" chip and a diff.
- **Detach**: converting a variant into a new course-local block copies the whole block into `course.localBlocks[]` with id `local.<uuid>`; it then stops receiving library updates.

## Versioning and update behaviour

- Library blocks use SemVer. Patch = wording/typo; minor = new config options or added material; major = changed learning objective, changed computation, removed options.
- A draft course follows `latest`. On **publish**, every instance gets `pin = block.version` and the `CourseVersion` snapshot stores the full rendered block bodies, so a published course never changes when the library does.
- When a pinned block has a newer version, the Builder shows an "update available" chip per instance with the changelog; the instructor accepts per instance or for the whole course. Major updates require re-review of variants (the config diff is shown).
- Lab engines are versioned separately (`qda2-stats.js` → `lab-stats@x.y.z`); a block records the engine range it was validated against.

## Publishing states

draft (editable, local) → preview (read-only student render from the draft, shareable within the browser) → published (immutable `CourseVersion`, exportable JSON). Republishing creates version n+1; older versions remain openable. Ownership model for later: `owner`, `editors[]`, `library: "personal"|"department"|"institution"`; not implemented in the prototype.

## Export / import

`Export` downloads `{ course, localBlocks, libraryPins, datasets: [inline only], exportedAt, schema: "qda2-course/1" }`. `Import` validates the schema, re-links `ref`s to the local library, and lists unresolved refs (kept as placeholders, never silently dropped).

## Share URLs

Lab: `/lab/<labId>#<base64url(LabConfiguration)>`. Lesson: `/course/<courseId>/<unitId>/<lessonId>` (published) or `/preview/<draftKey>/…` (local only). Both work without login; progress is local.
