# QDA2 V3 — deployment readiness

Status: **ready for a Vercel preview, not verified on a preview.** Nothing has been merged or deployed. Merging to
`main` and promoting to production need Bálint's explicit approval.

## What the deployment needs

| Item | Requirement | Status |
| --- | --- | --- |
| Hosting | the existing Vercel project; static pages + a few server-rendered routes; no new services | unchanged |
| Server-side R | none; R runs in the visitor's browser | — |
| Build | `npm ci` then `npm run build`. `postinstall` and `prebuild` run `scripts/copy-webr.mjs`, which copies the webR runtime from `node_modules/webr/dist` to `public/webr/0.4.2/` (git-ignored) | PASS locally; NOT RUN on Vercel |
| Static assets | `public/webr/0.4.2/`: about 40 MB on disk, largest file `R.bin.wasm` 11.3 MB; served with `Cache-Control: public, max-age=31536000, immutable` | PASS locally |
| Environment variables | none required. `QDA2_AUTHORING` must stay **unset** in Production (see below). `EMBED_ALLOWED_ORIGINS` unchanged | — |
| Outbound network from browsers | `https://repo.r-wasm.org` only when a lesson or `/r` loads the `survey` package; everything else is same-origin | — |
| Cross-origin isolation | not needed (webR PostMessage channel); no COOP/COEP headers | — |

### Course Builder access

`/builder` is a 404 unless `NODE_ENV=development` or the server has `QDA2_AUTHORING=local`. This is a deployment
switch, not authentication: anyone who can open a deployment with it set can use the Builder. The Builder only
edits drafts in the visitor's own browser and cannot change published content, but per the brief it should not
be public before institutional sign-in exists. Recommended: author locally with `npm run dev`; if a hosted
Builder is wanted, set `QDA2_AUTHORING=local` only for the Preview environment and only while Vercel deployment
protection keeps previews private.

### Content security policy

Per route, in `next.config.ts` via `src/lib/security-headers.ts`:

- pages: no `unsafe-eval`;
- `/r`, `/course/*`: `'wasm-unsafe-eval'`, `worker-src 'self' blob:`, `connect-src 'self' https://repo.r-wasm.org`;
- `/webr/*`: the worker's own CSP, additionally `'unsafe-eval'` (Emscripten dynamic linking); confined to the R
  worker. Verified in a local production build: without it R does not start.

## Checks run (local production build, Chromium)

| Check | Result |
| --- | --- |
| lint, typecheck, unit tests (338) | PASS |
| `npm run build`, `scripts/check-build.mjs` (secrets, source maps, external scripts) | PASS |
| e2e (Playwright, 244 tests), sandbox | 242 PASS, 1 BLOCKED/skipped (survey package download), 1 FAIL (framing test; fails identically on the untouched baseline in this sandbox) |
| CI on the PR (GitHub Actions run 40013398546 on f813008) | PASS: 243 passed incl. survey in webR and the framing test, 1 skipped by design |
| axe WCAG 2.2 AA on V3 pages, light and dark | PASS |
| CSP and worker loading on `/r`, `/webr/*`, `/` | PASS |
| Firefox / WebKit | BLOCKED (browsers not installed here) |
| Vercel preview | build PASS (Vercel reported the preview Ready); pages NOT RUN from here (the preview domain is blocked in this environment) |

### Measured locally (production build on localhost, sandbox machine; not representative of classroom networks)

| Measurement | Value |
| --- | --- |
| First-load JS shared by all routes | 103 kB (from `next build`) |
| First-load JS: `/lab/<id>` | 140–164 kB; `/course/…/<lesson>` 147 kB; `/atlas` 170 kB; `/builder` 249 kB |
| webR requests on page load (`/`, `/labs`, a lab, the s14l0 lesson, `/atlas`, `/r`) | 0 (R loads on the first Run) |
| R cold start + first run (`/r`, fresh browser context, localhost) | 1.87–1.88 s (3 runs) |
| Warm run: `mean(rnorm(1e5))` / `lm` on `mtcars` | 134–140 ms / 67–81 ms |
| Survey Weighting Studio long tasks on load | 51 ms, 53 ms |

On a real network the first R start also has to download the runtime (the 11.3 MB WebAssembly binary plus the
files it loads); later visits use the browser cache.

## Preview verification to do (on the Vercel preview of this PR)

1. The deployment succeeded and `/webr/0.4.2/R.bin.wasm` is served (200, `application/wasm`, immutable cache).
2. Open `/`, `/labs`, three labs (e.g. `/lab/survey-weighting-studio`, `/lab/anova-studio`, `/lab/ci-explorer`),
   `/atlas`, `/course/course.survey`, `/course/course.survey/s14/s14l0`, and the existing modules (`/anova`,
   `/t-tests`, `/variance`, `/indices`).
3. On `/r` press Run on the default code and on the "Survey design (needs survey)" example. The second checks that
   `repo.r-wasm.org` is reachable from the network you test on. Expected: `svymean` 5.4308 with SE 0.1822, and the Towns row of `svyby` 5.233333 / 0.3595264. In the s14l0 lesson the R block prints `trust 5.43083 0.18221 2.3872`.
4. In the browser console there are no CSP violations; in the network panel there are no third-party requests
   other than `repo.r-wasm.org` after the survey run.
5. `/builder` returns 404 on the preview (unless the Preview environment deliberately sets `QDA2_AUTHORING`).
6. Narrow-window check (≈ 375 px) of a lab, a lesson and the Atlas.
7. Repeat step 3 from the university network: if `repo.r-wasm.org` is filtered there, base R still works but the
   `survey` blocks will report that the package could not be installed.

## Production release steps (after approval)

1. Bálint reviews the PR and the preview (above) and decides on the open items in `known-limitations.md`.
2. Make sure `QDA2_AUTHORING` is not set for Production in the Vercel project settings.
3. Merge the PR into `main`. The production site is expected to deploy from `main` through the existing Vercel integration; this was not verified from here, so confirm the production deployment in the Vercel dashboard.
4. On the production domain repeat steps 1–4 of the preview verification.
5. If anything fails, roll back with Vercel's "Promote" on the previous production deployment (instant, no rebuild).
