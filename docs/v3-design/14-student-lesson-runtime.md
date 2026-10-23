# 14 · Student lesson runtime

Prototype: `QDA2 Lesson.dc.html` (`#courseId/unitId/lessonId`). Repo target: `src/app/course/[courseId]/[unitId]/[lessonId]/page.tsx` + `src/components/lesson/*`.

## Rendering model
- Source of truth: the **last published `CourseVersion` snapshot** if one exists; otherwise the draft with a visible "draft — not yet published" badge (prototype convenience; production hides drafts from students unless `?preview=`).
- Block renderers by type: concept (objective or concept definitions + atlas chips), math (definitions + notation strip), dataset (provenance card), prediction/reflection (textarea, local), lab/experiment/connection with a lab (iframe at the configured hash; "Reset to preset" re-mounts the iframe; "Open full lab" / "Teach mode" links), lab without a prototype (labelled spec card), assessment (matched bank questions; options render in the course app), software (menu-path line).
- Step rail maps block types to Predict → Experiment → Explain → Formalize → Apply → Transfer.
- Previous/next lesson; left outline of units and lessons; narrow layout hides the outline.

## State synchronisation
- The instructor's `LabConfiguration` is serialised into the lab URL hash. Student interaction changes only the lab's internal state; the hash (and therefore the preset) is unchanged. "Reset to preset" reloads the iframe → exact initial state reproduced. Labs read `controls.locked` and disable those controls, and show `instructions` in a Task panel.
- The Course Builder preview and the Lesson renderer compute the hash with the same function (`labHref`) → identical rendering in instructor and student views.

## Progress and privacy
- `qda2-student-progress-v1`: `{answers:{[course/lesson/instance]: text}, last:{cid,u,l}}`. No accounts, no server, nothing sent.
- Privacy panel lists every key with size, offers **Export my answers (JSON)** (student-controlled hand-in) and **Delete my answers**. Register the key in `STORAGE_KEYS` on port so `/privacy` shows it.
- Research participation (pre/post items) is a separate, consented flow per `docs/07-evaluation-plan.md`; the runtime never collects it silently.

## Teaching mode
Every lab block offers "Teach mode": the lab opens with `present=true` (zoom 1.15, side panel hidden) at the same preset and visible outputs. VRA uses `present=1` and its existing demo strip.

## Not done
- Quiz runner with options/feedback (repo `QuizRunner` to be mounted with items from the bank).
- Keyboard shortcut for next/previous block; print stylesheet.
- Per-block completion state (optional, local).
