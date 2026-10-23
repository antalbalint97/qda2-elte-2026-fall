# 12 · Course Builder V2

Prototype: `QDA2 Course Builder.dc.html`. Student side: `QDA2 Lesson.dc.html`. Both read `data/*.js` and share `localStorage` key `qda2-course-drafts-v1`.

## A. Laboratory configuration (shared interface)

The Inspector renders a form from `LabDefinition.params` (enum → select, boolean → checkbox, int/float → number, string → text; array/object/range params are not editable in the prototype). Added in V2 per instance: **locked controls** (checkbox chips from `lockKeys(labId)`), **student instructions**, and **Teach-mode link**. Everything is stored as `BlockInstance.variant{config, locked, instructions, title, notes, prompt}`; the library block is never written.

Validation: unknown config keys are dropped by the form (only schema keys are offered); values are coerced by type. Invariant kept: configuration reaches the lab as a URL-hash `LabConfiguration` and only presets, hides or locks — the lab's engine functions take no configuration input.

URL contracts: VRA `#s=&l=&p=&ly=&sc=&m=&av=&sq=&pv=&cmp=&present=`; all other labs `#<urlencoded JSON>` with `{…params, l, controls:{locked:[…]}, instructions, present}`. The Studio additionally accepts the flat block keys (`design:"srs"`, `n`, `allocation`, `rho`, `nonresponse`, `adjustment`) used by `data/blocks.js`.

## B. Interactive lab preview

Student preview and the Lesson renderer embed the **actual** lab in an iframe at the configured hash (5 labs). Designed labs render a labelled "specified, not yet built" card with the lab's views — never a placeholder chart.

## C. Block-to-lab integration (the vertical slice)

Walkthrough performed in the prototype (Survey Statistics → Week 5 lesson):
1. Library → search "inclusion" → add `c.inclusion-weights` (Concept).
2. Add `p.representative` (Prediction).
3. Add `l.sws-weights` (Lab, Survey Weighting Studio). Inspector: `design` stratified → `n` 200 → lock `design`, `mech` → instructions "Hover three units and write down their π." → **Open configured lab** shows stage 5 with the locked controls disabled.
4. Add `m.ht-hajek` (Math) and `a.survey-midterm` (Assessment) — the Inspector lists matched bank questions by concept id.
5. Student view → the same iframe hash → publish → `QDA2 Lesson.dc.html#course.survey/s5/s5l1` shows the published snapshot, the same lab hash, and "Reset to preset" reloads the iframe at the instructor's configuration.
Same lab, different settings: `l.sws-weights` appears in weeks 5 and 6 (variant: cluster design) — verified in `data/courses.js`.

## D. Publishing and versioning — audit

| Requirement | Prototype behaviour | Verified by |
|---|---|---|
| Published versions immutable | `course.versions[]` holds `{version, publishedAt, snapshot{units,outcomes,title}}`; never edited | code read; Lesson renders `versions[last]` |
| Editing creates a draft | any `up()` sets `state="draft"` | code |
| Republish → new version | minor bump when state was published | code |
| Previous versions accessible | kept in `versions[]`; UI to pick an older version **not built** | — |
| Shared block versions pinned | `pin = block.version` on every instance at publish | code |
| Snapshot renders independently of library | snapshot stores structure + variants, **not** block bodies → the Lesson still resolves `ref` against the live library. Gap: copy `title/objective/body/config` into the snapshot on publish | open issue |
| Local variants preserved | `localBlocks[]` in course, exported | code |
| Import/export round trip | schema `qda2-course/1`; unresolved refs reported as a count | manual |
| No cross-device claim | copy says "Published locally (no server)" | UI |

## E. Assessment integration

`data/questions.js` indexes 38 repo questions (id, legacy concept, graph concepts, format, prompt, source line, provenance). Assessment blocks and the Lesson list matched items; options/feedback remain in `src/content/questions.tsx` (not duplicated). Prediction and reflection answers are kept in `qda2-student-progress-v1` (local; export/delete in the Lesson privacy panel). Two items are flagged for revision (Levene-first wording).

## F. Review states

`block.review = {content, scientific, numerical, pedagogical, accessibility, translation, pilot}` with values such as draft/complete, unreviewed/internal-review/peer-reviewed, unvalidated/validated/n/a, unverified/checked, titles-only/full, none/planned/run. Current library: no block is peer-reviewed; "internal-review" marks content that exists in the production repo. The Inspector shows all seven chips; the library filter reads "Scientifically reviewed + validated only".

## G. Usability changes

Drawer layout under 1100 px; Alt+↑/↓ reordering; drag handles; search over title/id/objective/concept names in both languages; prerequisite advisory ranked reviewed-first; "saved HH:MM · local draft" and storage-failure warning; toast feedback on add/import/publish.

## Open issues
- Snapshot must embed block content (D above).
- Version picker for older published versions.
- Array/object params (e.g. `groups`, `outcomes`) need dedicated editors.
- Lint rules from `11-statistical-validation-matrix.md` not implemented.
