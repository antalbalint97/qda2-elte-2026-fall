# StatisztikaMetis: institutional review package

StatisztikaMetis (QDA2 Interactive Lab, <https://statisztikametis.site/>) is an independently developed, browser-based
companion for the undergraduate course *Quantitative Data Analysis 2*. It is a static website: no accounts, no backend,
no cookies, no analytics. This folder collects the information a university reviewer would ask for before allowing
instructors to use it in teaching.

StatisztikaMetis is an independently developed educational resource. References to university courses or
institutions do not imply official institutional endorsement. Nothing in this package is a formal security
certification, legal assessment or pedagogical validation.

Status of this package: prepared on 20 October 2026 from the repository at branch `claude/project-thread-odu6d9`.
Findings are marked **verified** (checked in code, a local production build or an automated test), **unverified**
(could not be checked from the review environment) or **owner/institution** (needs information or approval that only
the owner or the university can give).

## Documents

| File | What it answers |
| --- | --- |
| [technical-audit.md](technical-audit.md) | Stack, hosting, dependencies, network behaviour, storage, risks found and their status |
| [privacy-and-data-flow.md](privacy-and-data-flow.md) | What data exists, where it lives, what leaves the browser, what the host processes |
| [statistical-validation.md](statistical-validation.md) | How each module's calculations were checked, content corrections, data provenance |
| [accessibility-report.md](accessibility-report.md) | WCAG 2.2 AA-oriented checks, fixes, and the remaining manual test plan |
| [security-review.md](security-review.md) | Headers, CSP, XSS surface, dependencies, secrets, residual risks |
| [lms-integration.md](lms-integration.md) | Linking from Canvas/Moodle (works today) and optional controlled embedding |
| [network-access.md](network-access.md) | Hostnames, HTTPS, diagnostics for university IT, Hungarian summary |
| [teaching-pilot.md](teaching-pilot.md) | A proposal for a small, privacy-preserving teaching pilot |
| [open-issues.md](open-issues.md) | What the owner must supply, what needs institutional approval, what is not done |

## How to reproduce the checks

```bash
npm ci
npm run lint && npm run typecheck
npm run test:unit                 # statistics vs SciPy reference values, analytical identities, header config
npm run build
node scripts/check-build.mjs      # no secrets, source maps or external scripts in the build output
npx playwright install chromium   # once
npm run test:e2e                  # routes, keyboard, axe (WCAG 2.2 A/AA rules), viewports, network, links, headers
python3 scripts/validation/reference.py   # optional: regenerate SciPy reference values (needs numpy, scipy)
python3 scripts/sopranos/verify.py        # optional: re-check the bonus lab's synthetic dataset statistics
```

The same steps (except the optional Python scripts) run in GitHub Actions on every pull request
(`.github/workflows/ci.yml`).
