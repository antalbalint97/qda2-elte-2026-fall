# Teaching pilot proposal

A proposal for a small, low-risk pilot. It is a suggestion for discussion with the course leader, not an approved
plan, and it does not claim that the site improves learning outcomes: that is what a pilot could begin to explore.

## 1. Objective

To find out whether the interactive modules are a useful supplement to the SPSS-based seminars of *Quantitative Data
Analysis 2*, from the perspective of students and instructors, and what should be improved before wider use.

## 2. Expected benefits (to be tested, not assumed)

- Students can manipulate a statistical idea (sample size, effect size, a control variable) and see the consequence
  immediately, which a static SPSS output cannot show.
- The fixed Understand → Try → SPSS → Test structure connects each concept to the SPSS menu path and output the course
  uses, so the site prepares students for the software work instead of replacing it.
- Every wrong quiz answer explains the specific misconception, which supports self-study between seminars.
- Instructors get projector-ready demonstrations (presentation mode, `?present=1`) without installing software.

## 3. Intended users

- Undergraduate students taking the course, using the site voluntarily for revision.
- Seminar instructors, for in-class demonstrations.
- Not intended for assessment, grading or attendance.

## 4. How it supplements SPSS

SPSS remains the reference tool for analysis and inference in the course. The site explains what an SPSS output means
and which line to read; it does not compute analyses on students' own data, and its simulations illustrate principles
rather than produce findings.

## 5. Suggested seminar demonstration (about 15 minutes)

1. Before class: check that the site opens on the classroom computer ([network-access.md](network-access.md) §6).
   Fallback if it is blocked: run it from a laptop (§9 there) or show the SPSS-only version of the seminar.
2. Open `https://statisztikametis.site/p-values?present=1#try`.
3. Move the effect and sample-size sliders; ask students to predict the p-value before revealing it.
4. Switch to the SPSS step and read the same quantities in the mock output.
5. Point students to the module's Test step for self-study after class.

The same pattern works for `/crosstabs` (V stays constant as N grows) and `/anova#try` (spreading individuals changes
SSW, not SSB).

## 6. Limited pilot scope

- One or two seminar groups, one semester, two or three modules.
- Use is voluntary; no student is required to use the site, and nothing is graded through it.
- Linked from the course page (Level A in [lms-integration.md](lms-integration.md)); embedding only if separately
  approved.
- The site itself is unchanged during the pilot apart from bug fixes, so experiences are comparable.

## 7. Optional conceptual check (pre/post)

If the course leader wishes, a short conceptual questionnaire (for example eight items on p-values, Cramér's V and the
Lazarsfeld paradigm) could be given at the start and end of the pilot period. It should:

- run in a tool the university already approves (for example the LMS quiz tool), not on this site;
- be anonymous or reported only in aggregate;
- be treated as exploratory, since there is no control group and many other factors change over a semester.

## 8. Aggregated feedback

Collect feedback through an institutionally approved survey tool, separately approved by the course leader and, if
required, the faculty's data protection contact. Suggested questions:

- Which module did you use, and for what (preparation, revision, in class)?
- Did it help you read an SPSS output? (5-point scale)
- What was confusing or wrong?
- Would you recommend it to next year's students?

Instructors: a short written note on what worked in class and any technical problems (with the exact error text if
the site did not open).

## 9. Why no individual tracking is needed

The pilot questions are about usefulness and clarity, which aggregate, voluntary feedback answers. Individual tracking
would require accounts, a backend and a legal basis for processing student data, and it would change the site from a
low-risk static resource into a data-processing service. Progress therefore stays in each student's browser, and the
site never reports it anywhere. The site will not be modified to collect usage data for the pilot.

## 10. What the results can and cannot show

| Can show (exploratory) | Cannot show |
| --- | --- |
| Whether students and instructors find it usable and relevant | That the site causes better learning or exam results |
| Which explanations are confusing or contain errors | Effects that generalise to other courses or cohorts |
| Technical problems in real classrooms | Comparative effectiveness against other materials |

A claim of learning effectiveness would need a separately designed and approved study (control or comparison group,
pre-registered outcomes, ethics review where required). This proposal does not attempt that.
