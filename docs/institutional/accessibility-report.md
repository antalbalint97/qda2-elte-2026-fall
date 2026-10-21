# Accessibility report

Target: WCAG 2.2 level AA as a practical goal. **No conformance claim is made.** Automated tools detect only part of
WCAG; screen-reader and cognitive-accessibility testing with real users has not been done (see §5).

## 1. How it was tested (20 October 2026)

| Check | Tool / method | Scope |
| --- | --- | --- |
| Automated rules | axe-core 4.11 via `@axe-core/playwright`, tags `wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa` | All 14 public routes in light mode; 7 routes in dark mode and in presentation mode; quiz after answering; `/variance` with every chart state revealed |
| Keyboard | Playwright tests using only `Tab`, arrow keys and `Enter` | Skip link, focus indicators, sliders, segmented controls, transpose, quiz answers and retry, ordering task, correlation guess, mobile menu, presentation toggle |
| Headings | Script: no skipped levels, exactly one `h1` per page | All routes |
| Reflow | No page-level horizontal scrolling at 320 CSS px; mobile (Pixel 7), 1024 × 768 projector, 1280 × 720 at 150 % | All routes |
| Reduced motion | `prefers-reduced-motion: reduce` disables animations | Spot check |
| Charts | Manual review of every SVG chart's text alternative and adjacent numeric output | All modules |

Baseline on `main` before this work: axe reported serious violations on **every** page (colour contrast on all pages,
target size on all module pages, a missing `<select>` label rated critical on `/go-further`, an invalid definition list
and non-focusable scroll regions on `/crosstabs`). After the changes: **0 violations** on all scanned pages and states.

## 2. Fixes implemented

| Issue (WCAG SC) | Fix |
| --- | --- |
| Secondary text `--faint` at 3.1:1 (1.4.3) | Darkened to 5.0:1 on the page background (light) and 5.8:1 (dark); the Sopranos palette likewise |
| Warning colour 4.4:1 on its tint (1.4.3) | Darkened to 5.4:1 |
| X/Y/Z role chips: orange 3.3:1, blue 4.1:1 (1.4.3) | New `--x-ink/--y-ink/--z-ink` text shades (≥ 5.1:1); chart colours unchanged |
| Inactive rows in SPSS mock-ups at 2.5:1 (1.4.3) | Dimming reduced (≥ 4.5:1) while still showing which row to read |
| Inline links indistinguishable from text (1.4.1) | Links in prose on `/about` and `/privacy` are underlined |
| Dark mode: Sopranos-lab answer options inherited near-white text on cream (1.4.3, usability) | Wrapper re-resolves the text colour; options set their colour explicitly |
| Quiz progress dots 8 × 8 px; ordering arrows 20 × 20 px (2.5.8) | 24 × 24 px hit areas, visual unchanged |
| Two `<select>`s without labels (4.1.2, 1.3.1) | Visible "First group" / "Second group" labels |
| Live results not announced (4.1.3) | `Announce` component: a polite, debounced status message summarises the result after a slider settles (p-value explorer, sample-size demo, χ² demo, correlation playground and guessing game, effect size, ANOVA explorer, ordering task) |
| Quiz correctness shown by colour only (1.4.1) | Hidden text "(correct answer)", "(your answer, incorrect)", "(correct position)" etc.; progress dots carry "answered correctly/incorrectly/not answered yet" |
| Slider locked after reveal looked active (4.1.2) | Uses the native `disabled` state |
| Slider values read as raw factors (e.g. "0.5") (1.1.1) | `aria-valuetext` such as "N = 105" |
| Wide tables scroll but could not be reached by keyboard (2.1.1) | Scroll wrappers are focusable regions with a name |
| Duplicate `id`s in SPSS annotations broke `aria-describedby` (1.3.1) | Unique ids per output table |
| ANOVA table without header cells (1.3.1) | `th scope="col"` / `scope="row"` |
| Skipped heading level on `/anova` (1.3.1) | Visually hidden `h3` before the step list |
| Focus ring animated in from 0 px on some buttons (2.4.7) | Transitions no longer animate the outline |
| Error and 404 states (3.3.1, usability) | Plain-language error and not-found pages |

Already in place before this work and kept: skip link, `lang="en"`, visible `:focus-visible` outline, radiogroup
semantics with arrow keys for segmented controls, `aria-expanded` on disclosures and menu, `role="status"` feedback
that always explains *why*, reduced-motion CSS, KaTeX MathML output alongside the visual formulas, text labels on every
chart and the numeric results printed beside every chart.

## 3. Charts and non-visual access

Every chart is an SVG with `role="img"` and an `aria-label` that states the key numbers (for example "Null distribution
with observed t of 2.20; shaded tail area p = .038"). The statistical conclusion is always also printed as text next to
the chart (p-value and decision, r, χ², V, SS table, F, η²), so no conclusion depends on reading the graphic. Colour is
never the only carrier of meaning in conclusions: decisions are written out ("p < .05: reject H₀"), and correct/incorrect
labels use text and ✓/✗ symbols.

Limitations: scatterplots convey the *shape* of a relationship visually; the text alternative gives r but not the
shape. The U-shape and monotonic examples describe the shape in the surrounding text. Drag-and-drop in the ordering
task has a keyboard alternative (arrow buttons), but drag itself is mouse/touch only.

Module 08 (`/variance`, added 21 October 2026) follows the same pattern: every chart has an `aria-label` with the key numbers, a
polite live summary, numeric tiles and (for the squares and trust charts) a full data table. The draggable dots in the
squares chart have a keyboard alternative (a respondent selector plus a slider), covered by a keyboard test. Meaning is
never carried by colour alone: mean and median are marked with a ▲ and a labelled dashed line, the residual squares
change from dashed (prediction = mean) to solid (a line), and the X/Y/Z role colours are used only for their roles.
The charts are static SVG with no animation, so reduced motion needs no special handling.

## 4. Classroom presentation mode

A header button (also `?present=1` in any URL, `?present=0` to switch off) enlarges page content by 20 %, raises
secondary text to full strength and switches off animation. It reuses the normal layout (no separate application) and
is remembered in the browser. Tests confirm it fits a 1024 × 768 projector without horizontal scrolling on every page
and passes the same axe checks.

## 5. Manual tests still to do

These require people and assistive technology that were not available in the review environment.

| # | Test | Why automated checks cannot cover it |
| --- | --- | --- |
| M1 | NVDA + Firefox and JAWS + Chrome (Windows), VoiceOver + Safari (macOS, iOS): complete one module end to end | Announcement quality, reading order, verbosity of live regions |
| M2 | Browser zoom 200 % and 400 % on desktop | Reflow is tested at 320 px width; zoomed text spacing is not |
| M3 | Windows High Contrast / forced colours mode | SVG charts use theme colours; behaviour in forced colours is untested |
| M4 | Text spacing override (WCAG 1.4.12 bookmarklet) | Clipping in fixed-height elements |
| M5 | Keyboard-only walkthrough of the Sopranos bonus lab and Go Further | Tests cover representative controls, not every exercise |
| M6 | Projector check in an actual classroom (distance legibility, colour on a washed-out projector) | Depends on hardware |
| M7 | Plain-language review with students, including non-native English speakers | Cognitive accessibility |

Record results in this file with date, tester, browser/AT version and outcome.
