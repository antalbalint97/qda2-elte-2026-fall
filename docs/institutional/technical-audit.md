# Technical and dependency audit

Date: 20 October 2026. Scope: the repository `antalbalint97/qda2-elte-2026-fall` at commit `34392be` (main, before this
work) and the changes on branch `claude/project-thread-odu6d9`.

Legend: **V** verified (code inspection, local production build, or automated test), **U** unverified from the review
environment, **O** needs the owner's dashboard/credentials or institutional access.

## 1. Architecture

| Item | Finding | |
| --- | --- | --- |
| Framework | Next.js 15 (App Router), React 19.1, TypeScript 5 (strict) | V |
| Styling | Tailwind CSS v4 via `@tailwindcss/postcss`; colour tokens in `src/app/globals.css` | V |
| Charts | Hand-written SVG components (`src/components/viz`, module folders); no charting library | V |
| Maths | KaTeX, rendered to HTML + MathML at build time (`src/components/learning/Tex.tsx`) | V |
| Package manager / build | npm with `package-lock.json` (lockfile v3); `next build` | V |
| Rendering | All 18 routes are prerendered static pages (`○ (Static)` in the build output) | V |
| Server-side code | None at runtime: no API routes, no middleware, no server actions, no database | V |
| Client-side code | Interactive components (sliders, quizzes, simulations) run in the browser; statistics in `src/lib/stats.ts` | V |
| Environment variables | Only `NODE_ENV` and the optional build-time `EMBED_ALLOWED_ORIGINS` (new). No secrets are needed | V |
| Hosting | Vercel. The repository's GitHub commit statuses come from the Vercel integration (production and per-PR previews) | V (from GitHub status) |
| Vercel project settings | Domains, redirects, firewall, analytics toggles, log retention: not visible without dashboard access | O |
| `vercel.json` | None; Vercel defaults apply | V |
| DNS records, DNSSEC, certificate | Could not be queried: the review sandbox's egress proxy refused connections to `statisztikametis.site` (HTTP 403 from the proxy) and its fetch tool had no DNS. This says nothing about the domain itself | U |

## 2. External resources and network behaviour

| Item | Finding | |
| --- | --- | --- |
| External scripts, CDNs, iframes | None. A Playwright test loads every route, exercises sliders and the AI-explainer preview, and asserts that no request leaves the site's origin | V |
| Fonts | Inter, Source Serif 4 and JetBrains Mono via `next/font/google`, which downloads them **at build time** and serves them from `/_next/static/media`. No request to Google at runtime | V |
| KaTeX fonts | Bundled with the KaTeX stylesheet, served from the same origin | V |
| Analytics, telemetry, trackers | None in the code; no `@vercel/analytics` or Speed Insights package; no tracking pixels | V |
| Vercel-side additions | Vercel Web Analytics needs a package that is not installed. Whether firewall/challenge features are enabled on the project cannot be seen | O |
| Next.js build telemetry | Next.js sends anonymous build telemetry from the build machine unless disabled (`NEXT_TELEMETRY_DISABLED=1`). This concerns the developer's build, not visitors | V |
| Runtime requests | Same-origin GET requests for HTML, JS/CSS chunks, fonts and React Server Component payloads (prefetched when links scroll into view) | V |

## 3. Browser storage

| Mechanism | Use | |
| --- | --- | --- |
| Cookies | None set by the application or by `next start`. A test asserts no `Set-Cookie` and an empty cookie jar | V |
| localStorage | `qda2-lab-progress-v1` (quiz progress), `qda2-lab-theme`, `qda2-lab-present` (new), `qda2-sopranos-notes-v1` (free-text notes in the bonus lab) | V |
| sessionStorage, IndexedDB, Cache Storage, service worker | None | V |
| Robustness | Every storage access is wrapped in `try/catch`; with storage blocked the site works and progress lasts for the page view | V |

Details: [privacy-and-data-flow.md](privacy-and-data-flow.md).

## 4. Security headers and embedding (before this work)

Measured on a local production build of `main` (`next start`): only Next.js defaults were sent (`X-Powered-By: Next.js`,
caching headers). There was no Content-Security-Policy, no `X-Frame-Options`, no `X-Content-Type-Options`, no Referrer-
or Permissions-Policy, so any site could frame any page. Vercel may add HSTS for its domains; this could not be checked
on the live site (**U**). Changes: [security-review.md](security-review.md).

## 5. Dependencies and known vulnerabilities

`npm audit` before: 8 advisories (1 low, 1 moderate, 6 high). After patch upgrades: 7 (1 moderate, 6 high), of which 2
affect runtime dependencies.

| Package | Advisory | Exposure | Action |
| --- | --- | --- | --- |
| `katex` < 0.18.2 | Prototype pollution can bypass `trust` restrictions (low) | Low: KaTeX renders only author-written formulas at build time, `trust` is off | Upgraded 0.16.47 → 0.18.11; rendered output compared and visually checked |
| `next` 15.5.27 | Patch release available | — | Upgraded to 15.5.28 (pinned, same minor) |
| `postcss` < 8.5.23 inside `next` | XSS in CSS stringify, source-map file read (high) | Build time only, on this repository's own CSS; nothing user-supplied is processed | Not fixable within Next 15 (Next pins its PostCSS copy). Resolved by a Next 16 upgrade: a major change, left as an owner decision ([open-issues.md](open-issues.md)) |
| `eslint-config-next` → `fast-glob` → `micromatch` → `braces` | ReDoS / stack exhaustion (high) | Development tooling only; never shipped | Will clear with the Next 16 toolchain; no action now |

React 19.1.0 is listed in `package.json`; Next.js uses its own bundled React server packages, which in 15.5.x include the
fixes for the December 2025 React Server Components advisories. The site uses no server functions in any case.

## 6. Error handling and failure states

| Before | After |
| --- | --- |
| No `error.tsx`, `global-error.tsx` or custom 404. A runtime error in a client component would leave a blank page; unknown URLs showed the default Next.js 404 | Added an error boundary with "Try again", a last-resort global error page that does not depend on site styles, and a 404 page listing all modules (`src/app/error.tsx`, `global-error.tsx`, `not-found.tsx`) |
| Clipboard and storage failures already caught | Unchanged |
| Mocked AI explainer has no network failure mode | Unchanged (it makes no requests) |

## 7. Tests and CI

Before: `npm run lint`, `npm run typecheck` (manual), the Vercel build as the only automated check, and two Python/Node
scripts that verify the Sopranos dataset. After: see [README.md](README.md#how-to-reproduce-the-checks) and the CI
workflow. Results of the run on 20 October 2026 are in the final report of the pull request.

## 8. Copyright, licences and provenance

| Material | Status |
| --- | --- |
| Application code | Owner's work; no licence file in the repository (all rights reserved by default). The owner decides whether to add one (**O**) |
| Fonts (Inter, Source Serif 4, JetBrains Mono) | SIL Open Font License 1.1; self-hosting permitted |
| KaTeX and its fonts | MIT licence (KaTeX fonts: SIL OFL 1.1) |
| Next.js, React, Tailwind | MIT licence |
| Teaching datasets in core modules | Constructed or simulated values (see [statistical-validation.md](statistical-validation.md#6-data-provenance)); some SPSS output mock-ups use variable names that follow European Social Survey naming (`stfedu`, `stfhlth`, `trustprl`), but no ESS data file is included. Owner to confirm the numbers are not copied from a dataset (**O**) |
| ANOVA lab | Reproduces eleven observations from a course calculation video (numbers only, no video material) |
| Sopranos bonus lab | Fully synthetic dataset from a seeded script (`scripts/sopranos/generate.py`). Uses the series title and character names as a theme and states that it is not affiliated with HBO. Use of a commercial series' name and characters in a teaching exercise is a question for the owner and, if relevant, the institution (**O**) |
| University names and logos | No logos or insignia are used. The site names the course, not the institution |

## 9. Risk summary (Phase 1 classification)

| # | Finding | Severity | Status |
| --- | --- | --- | --- |
| 1 | No security headers; any site could frame any page (clickjacking surface, uncontrolled embedding) | High | Fixed |
| 2 | Small text below WCAG AA contrast site-wide (`--faint`, `--warn`, X/Y/Z chips) | High (accessibility) | Fixed |
| 3 | Dark mode made answer options in the Sopranos lab near-invisible (inherited text colour) | High (usability) | Fixed |
| 4 | No privacy information, no visible way to delete local progress except quiz reset | Medium | Fixed (`/privacy`) |
| 5 | No about/provenance page; no independent-project disclaimer | Medium | Fixed (`/about`, footer) |
| 6 | No error boundary or 404 page | Medium | Fixed |
| 7 | Go Further p-value simulation drew from the normal, not the t distribution | Medium (correctness) | Fixed |
| 8 | Live results not announced to screen readers; quiz state partly colour-only; small targets; unlabelled selects | Medium | Fixed |
| 9 | Broken in-page links (`/p-values#try`, `/lazarsfeld#try`) | Low | Fixed |
| 10 | Build-time PostCSS advisory inside Next 15 | Low (build only) | Open: Next 16 upgrade |
| 11 | No automated tests or CI beyond the Vercel build | Medium | Fixed |
| 12 | Live DNS/TLS/redirect behaviour unknown | — | Unverified; see [network-access.md](network-access.md) |
