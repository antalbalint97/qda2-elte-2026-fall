# Canvas / Moodle integration

StatisztikaMetis complements the university's learning management system (LMS); it does not replace it. It has no
accounts, grades or submissions, so no LTI, grade passback or plugin is needed or provided. Nothing below assumes that
embedding is permitted by the institution.

## Level A: external learning resource (supported now)

An instructor adds a link (Canvas: *External URL* module item or a link in a Page; Moodle: *URL* resource or a link in
a Page/Label). This needs no configuration and no approval beyond the course's normal practice.

- Every module and the main sections have stable addresses that survive refresh and direct entry (tested):

  | Module | Address | Useful section anchors |
  | --- | --- | --- |
  | Measurement levels | `/measurement` | `#understand`, `#roles`, `#spss`, `#test` |
  | Crosstabs | `/crosstabs` | `#understand`, `#try`, `#chi`, `#spss`, `#test` |
  | Lazarsfeld paradigm | `/lazarsfeld` | `#understand`, `#try`, `#scenarios`, `#test` |
  | p-values | `/p-values` | `#understand`, `#try`, `#spss`, `#test` |
  | Correlation | `/correlation` | `#try`, `#choose`, `#spss`, `#test` |
  | t-tests | `/t-tests` | `#understand`, `#spss`, `#test` |
  | ANOVA lab | `/anova` | `#understand`, `#foundations`, `#try`, `#spss`, `#test` |
  | Spread, variance & error | `/variance` | `#understand`, `#squares`, `#residuals`, `#try`, `#hetero`, `#spss`, `#test` |
  | Quick review | `/review` | |
  | Optional: Go Further | `/go-further` | `#residuals`, `#pairwise`, `#pvalue`, `#spss` |

- Add `?present=1` for the projector-friendly presentation mode, e.g. `https://statisztikametis.site/anova?present=1#try`.
- Opening in a new tab is recommended so the LMS stays open alongside.
- Progress is stored in the student's browser under the site's own origin, so it persists across visits on the same
  device and browser.

## Level B: controlled embedded resource (prepared, off by default)

A module shown inside an LMS page with an `<iframe>`.

### Technical status

| Requirement | Status |
| --- | --- |
| Framing policy | Off by default (`frame-ancestors 'none'`, `X-Frame-Options: DENY`). Enabled only for origins listed in the build-time variable `EMBED_ALLOWED_ORIGINS` |
| Allow-list validation | Exact `https://` origins only (plus `http://localhost` / `http://127.0.0.1` for local testing). Wildcards, paths and other plain-HTTP entries are rejected with a build warning, so a typo cannot open framing to every site |
| Verified behaviour | Browser test: default build refuses to render in a cross-origin iframe; a build with the parent origin listed renders the module (`E2E_EXPECT_EMBED=1`) |
| Third-party cookies | Not needed: the site uses no cookies, so browsers' third-party-cookie blocking does not break it |
| Storage in an iframe | Modern browsers partition storage for embedded third-party content (Chrome, Firefox, Safari). Progress saved inside the LMS iframe is kept separately from progress on the standalone site and may be cleared more aggressively (Safari). The site works either way |
| Cross-origin communication | None. The site never reads or writes the parent page |
| Responsive rendering | Layouts work from 320 px wide; an iframe of at least 800 × 700 px is comfortable. The site does not auto-resize the iframe |
| Accessibility | Give the iframe a `title`; keyboard focus moves into the frame normally |
| Reduced-navigation embed view | Not implemented. The full header is shown inside the frame. If embedding is approved and used, a `?embed=1` view without header and footer would be a small, low-risk addition |

### Configuration (owner, after approval)

1. Obtain the exact LMS origin(s) from university IT, for example `https://canvas.example.edu` (no path, no wildcard).
   Do not guess: Canvas pages may be served from a different host than the login page.
2. In the Vercel project settings, add the environment variable
   `EMBED_ALLOWED_ORIGINS="https://<lms-origin-1> https://<lms-origin-2>"` for Production.
3. Redeploy (headers are computed at build time). Check:
   `curl -sI https://statisztikametis.site/anova | grep -i -E 'content-security-policy|x-frame-options'` should show
   `frame-ancestors 'self' https://<lms-origin>` and no `X-Frame-Options`.

Suggested embed code:

```html
<iframe src="https://statisztikametis.site/p-values#try" title="StatisztikaMetis: p-value explorer"
        width="100%" height="760" loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe>
```

### What institutional approval would be needed

- Permission to embed external content in course pages (Canvas administrators may restrict iframe sources; Moodle
  sites may strip iframes from content unless the author has the "trusted content" capability).
- Confirmation of the exact origin(s) to allow, and whether embedding a non-university site requires a data protection
  or accessibility review. No student data flows to the developer (see [privacy-and-data-flow.md](privacy-and-data-flow.md)),
  but students' browsers will connect to the external host.
- A decision on wording: the embedded page carries the independent-project disclaimer in its footer; the LMS page
  should not present it as a university service.

### Not provided, by design

LTI launch, single sign-on, roster or grade synchronisation, Moodle/Canvas plugins, analytics. None is needed for the
teaching purpose, and each would introduce student data processing that the project deliberately avoids.
