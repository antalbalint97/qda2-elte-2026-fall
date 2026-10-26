# QDA2 V3 — site design and structure refactor

PR #9 integrated the V3 laboratories, Atlas, Builder and R but kept the old site design and navigation. This change
applies the V3 design package (`QDA2 Landing`, `Topics`, `Labs`, `Lab`, `Lesson`, `Design System` prototypes and
`HANDOFF.md` §10) to the whole site. No prototype runtime (`support.js`, `.dc.html`) is shipped; every page is a
React component in this repository.

## Design system

- Tokens (`src/app/globals.css`): midnight ink `#101B2B` on warm off-white `#F7F6F1`, white cards with `#E1DFD7`
  borders, the `#ECEAE3` segmented well, and the role colours teal (model), blue (data), coral (residual),
  violet (explained) and amber (attention). New `night-*` tokens style the dark landing hero and header.
- Text colours were darkened where the prototype values fail WCAG AA: the teal link colour is `#096F61` (the
  design's `#0F8C7B` gives 3.8:1 on the background), `pos` is `#1A7050`, coral ink is `#A2472F`. All three reach
  4.5:1 on `bg`, `surface` and `surface-2`.
- Fonts: Instrument Sans (interface), Source Serif 4 (mathematics, lesson titles), Fira Code (numerals).
  Instrument Sans is self-hosted (`src/app/fonts/`, SIL OFL 1.1, licence in `public/fonts/InstrumentSans-OFL.txt`)
  as a latin/latin-ext subset without combining diacritics: its combining macron has no anchor and drew `x̄` with
  the bar beside the x. Such clusters now fall back to Source Serif 4.
- Primary buttons are midnight on light pages and teal on dark ones; headings are sans with tight tracking.

## Information architecture

| Route | Before | Now |
|---|---|---|
| `/` | module list, review checklist | V3 landing: dark hero with a live least-squares fit (engine `fit()`, draggable and keyboard-operable points), philosophy, featured VRA lab, topic grid, Explore/Learn/Teach, practice links, academic-use note |
| `/topics` | — | new curriculum map: 22 topics in five domains (data, relationships, inference, survey statistics, mathematical foundations), each linking its module and labs; filter and EN/HU |
| `/labs` | text cards | portfolio with per-lab thumbnails, concept chips linking the Atlas, learning-block counts and a maturity filter |
| `/lab/*` | site header + title row | full-screen app bar (brand, lab title, stage tabs, scenario, Teach/Reset/Share, language); no site header or footer |
| `/course/…/lesson` | site header, narrow outline | lesson app bar (course, version, review state, Atlas, Privacy & data, language), full-height outline sidebar, serif title, coloured block-type pills and numbered typed section labels |
| `/builder` | site header | its own app bar; still served only where `QDA2_AUTHORING` allows it |

Site header: Topics, a Modules dropdown (the nine modules, Go Further, Sopranos), Labs, Concept Atlas, R, Quick
review, presentation and theme toggles; a mobile menu below `lg`. The header bar no longer lists every module, so it
fits at every width. The footer links Topics, Labs, Atlas, R, About, Privacy and Quick review and keeps the
endorsement disclaimer.

Not changed: module pages, review, Go Further, Sopranos, About, Privacy, the Atlas and R pages (they take the new
tokens and fonts), lab and engine behaviour, URLs. The Specification button of the Labs prototype is not shown,
because two of the twenty specification documents are missing and they are not published on the site.

## Tests

- `tests/e2e/routes.ts` includes `/topics`, so smoke, layout, axe and heading checks cover it.
- New: topics map (five domains, filter, language, every link is a module or a lab), app-bar pages do not render the
  site header, landing hero recomputes r when a point is moved by keyboard and resets.
- Updated: client-side module navigation opens the Modules menu first; the link checker treats `/lab/*` hashes as
  lab state, not fragment ids.
- Results on this branch: `npm run lint`, `npx tsc --noEmit`, `npm run test:unit` (339 pass), `npm run build`,
  `node scripts/check-build.mjs` and the Playwright suite (249 pass, 1 skipped). The only failure is the
  network-privacy framing test, which fails in this sandbox and passes in CI. An extra axe pass in light and dark
  on `/topics`, `/labs`, labs, a lesson, the course page, Atlas, R and Builder found no violations.
