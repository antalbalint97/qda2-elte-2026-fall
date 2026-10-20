# Open issues

Everything here is outstanding: information only the owner can supply, decisions that need the owner or the
university, and checks that could not be done from the review environment. Placeholders are written as
`[[OWNER: ...]]`; nothing in this repository invents contact, registration or data-controller details.

## 1. Owner to supply

| # | Item | Where it is used | Placeholder / current state |
| --- | --- | --- | --- |
| O1 | Public contact address for questions and accessibility or privacy requests | `src/content/site.ts` → `SITE.contact`; shown on `/privacy` and `/about` | `[[OWNER: contact e-mail]]`. Currently `null`: the pages show a neutral sentence and no address |
| O2 | Author / maintainer name as it should appear publicly | `SITE.author`; `/about` | `[[OWNER: name or "not shown"]]`. Currently `null` |
| O3 | Data controller identity for the hosting logs, and whether a formal privacy notice is needed | `/privacy`, [privacy-and-data-flow.md](privacy-and-data-flow.md) | `[[OWNER: controller name and address, or confirmation that none is published]]`. The pages make no GDPR-compliance claim; a qualified person should review the wording before any formal approval |
| O4 | Licence for code and content | Repository root (no `LICENSE` file at present) | `[[OWNER: licence choice]]`. Without a licence, reuse by others is not permitted by default |
| O5 | Vercel account settings: log retention, firewall / DDoS settings, two-factor authentication, who can deploy | [security-review.md](security-review.md) §7 | Not visible from the repository |
| O6 | Domain: auto-renewal, registrar lock, two-factor at the registrar, DNSSEC, whether `www` redirects to the apex | [network-access.md](network-access.md) | Not verifiable from the review environment |
| O7 | Branch protection on `main` (required CI check, review) | GitHub settings | Recommended, not configured by this work |

## 2. Owner to confirm

| # | Question | Why it matters |
| --- | --- | --- |
| C1 | Are any numbers in the core modules copied from the European Social Survey or another real dataset? | The site now says the examples are constructed or simulated. If any table reproduces real data, the label and a source citation must change |
| C2 | Should the site name ELTE or the course code at all? | Currently it names the course title only and carries the independence disclaimer. Naming the institution more prominently increases the risk of implied endorsement |
| C3 | Is the ANOVA dataset (11 observations from the course video) cleared for reuse? | It is attributed to the course video on the page |

## 3. Content questions

| # | Question |
| --- | --- |
| K1 | The Sopranos bonus lab uses a TV series theme and character names (no images, logos or real episode data; the dataset is synthetic and the page states non-affiliation). Is the owner comfortable with this for institutional use, or should it stay an unlisted extra? It is already `noindex` and not in the navigation |
| K2 | The bonus lab contains a hypothetical "HBO policy" scenario. It is clearly fictional, but a reviewer may prefer a neutral organisation name |

## 4. Technical decisions

| # | Decision | Recommendation |
| --- | --- | --- |
| T1 | Upgrade to Next.js 16 to clear the remaining PostCSS advisory | Do it as a separate PR after the pilot decision; the advisory affects build-time CSS processing of the repository's own files only |
| T2 | Enable LMS embedding (`EMBED_ALLOWED_ORIGINS`) and for which origins | Keep it off until university IT supplies the exact origins and confirms embedding is allowed ([lms-integration.md](lms-integration.md)) |
| T3 | Add a `?embed=1` view without header and footer | Only if T2 is approved; small change |
| T4 | Error reporting from classrooms | No error tracking service was added (it would send data to a third party). Instructors report exact error text manually ([network-access.md](network-access.md) §8) |

## 5. Still to run or verify

| # | Item |
| --- | --- |
| V1 | Manual accessibility tests M1–M7 ([accessibility-report.md](accessibility-report.md) §5) |
| V2 | Live DNS, TLS certificate, HTTP→HTTPS redirect and response headers on the production domain, after this branch is deployed ([network-access.md](network-access.md) §4) |
| V3 | A test from a university-managed classroom machine, with the exact error text if it fails ([network-access.md](network-access.md) §6) |
| V4 | Cross-browser check in Firefox and Safari (automated tests ran in Chromium only) |

## 6. Accepted deviations

| Item | Reason |
| --- | --- |
| Levene's test mock-up prints Sig. `.412`; recomputing from the printed F = 0.67 gives `.413` | Consistent with F being rounded to two decimals in the mock-up; not a content error |
| `script-src 'unsafe-inline'` in the CSP | Required for static rendering; see [security-review.md](security-review.md) §2 |
| Vercel preview toolbar is blocked by the CSP on preview deployments | Production is unaffected; preview comments are not needed for teaching |
| `npm audit` still lists high-severity advisories in build tooling | See T1; CI fails on critical advisories only, and prints all others |
