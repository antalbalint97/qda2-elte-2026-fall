# Security review

Scope: a static educational website with no accounts, no server-side code at runtime, no database and no secrets.
The measures below are proportionate to that: they limit what a compromised third party or a hostile page could do,
and they make the site's behaviour explicit for reviewers. No formal penetration test was performed.

## 1. Attack surface

| Area | Finding |
| --- | --- |
| Server-side code | None at runtime. All 18 routes are prerendered; there are no API routes, middleware, server actions or form handlers |
| User input | Quiz clicks, sliders, two `<select>`s, free-text notes in the bonus lab. Input is rendered by React as text (escaped); none is sent anywhere |
| `dangerouslySetInnerHTML` | Three uses: the inline theme script (a constant) and KaTeX output (`Tex.tsx`), rendered at build time from formulas written in the source code with `trust` disabled and `throwOnError: true`. No user or URL input reaches them |
| URL parameters | Only `?present=0/1`, compared against fixed strings in the inline script |
| Local browser state | JSON from localStorage is parsed in `try/catch` and merged into a fixed shape; a corrupted or hostile value can only affect that browser's own progress display |
| Downloads | The bonus lab builds its CSV in the browser from the bundled synthetic dataset (Blob URL) |
| Secrets | None needed. `.env*` is git-ignored. `scripts/check-build.mjs` scans the client bundle and HTML for key/token patterns and source maps (none found) |

## 2. HTTP security headers (new)

Defined in `src/lib/security-headers.ts`, applied to every path by `next.config.ts`, unit-tested and checked against
the running production build by Playwright.

| Header | Value | Purpose |
| --- | --- | --- |
| `Content-Security-Policy` | `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; media-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-src 'none'; worker-src 'self'; manifest-src 'self'; frame-ancestors 'none'; upgrade-insecure-requests` | Only the site's own origin may supply scripts, styles, fonts and connections; no plugins; no framing |
| `X-Frame-Options` | `DENY` (omitted when an embedding allow-list is configured) | Clickjacking protection for older browsers |
| `X-Content-Type-Options` | `nosniff` | No MIME sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | External sites see only the origin |
| `Permissions-Policy` | camera, microphone, geolocation, payment, USB, sensors, autoplay, display capture, MIDI, Topics API all disabled | The site needs none of them (clipboard write for "Copy link" is unaffected) |
| `Cross-Origin-Opener-Policy` | `same-origin` | Isolates the browsing context from cross-origin openers |
| `Strict-Transport-Security` | `max-age=31536000` (production only) | HTTPS for one year. Deliberately without `includeSubDomains` and `preload`, which would bind all of the owner's subdomains and are the owner's decision |
| `X-Powered-By` | removed | Avoids advertising the framework version |

**Why `'unsafe-inline'` for scripts.** Next.js delivers page data in inline `<script>` tags, and the theme script must
run before first paint. A nonce-based CSP would force every page to render on the server per request, giving up static
hosting and edge caching for a site with no user-generated HTML. The policy still blocks every third-party script
origin, `eval` (in production), plugins, `<base>` hijacking and framing. If the site ever renders untrusted HTML, this
trade-off must be revisited.

**Vercel preview deployments.** The Vercel toolbar and comments on preview URLs load from Vercel's own domains and are
blocked by this CSP; the page itself works. Production is unaffected.

## 3. HTTPS and redirects

The site is served by Vercel, which provisions TLS certificates automatically and redirects HTTP to HTTPS by default.
These could not be verified against the live domain from the review environment (outbound access to the domain was
refused by the sandbox proxy). Verification commands: [network-access.md](network-access.md#4-diagnostic-commands).

## 4. Embedding

Framing is denied by default. The owner can allow specific LMS origins at build time with `EMBED_ALLOWED_ORIGINS`
(exact `https://` origins; wildcards, paths and plain HTTP are rejected with a build warning). Verified in a browser:
with the default build an iframe from another origin is refused; with the parent origin listed it renders. Details:
[lms-integration.md](lms-integration.md).

## 5. Dependencies

See [technical-audit.md §5](technical-audit.md#5-dependencies-and-known-vulnerabilities). Patch upgrades applied
(Next 15.5.28, KaTeX 0.18.11). Residual: a high-severity PostCSS advisory in the copy bundled inside Next 15. It affects
CSS processing at build time on this repository's own stylesheets, so it is not exploitable by visitors; the fix is the
Next 16 major upgrade (owner decision). CI runs `npm audit --omit=dev` on every pull request, prints all advisories, and
fails on critical ones.

## 6. Checks added to CI

`.github/workflows/ci.yml`: lint, type check, unit tests (including header configuration), dependency audit, production
build, build-output scan (`scripts/check-build.mjs`: secret patterns, published source maps, external script or
stylesheet references), and browser tests that assert the headers, the absence of cookies, the absence of third-party
requests and the framing policy.

## 7. Residual risks and recommendations

| Risk | Rating | Recommendation |
| --- | --- | --- |
| Account takeover of the GitHub or Vercel account would allow publishing arbitrary content | Medium (impact) | Owner: enable two-factor authentication on both, restrict who can deploy, protect `main` with required reviews and the CI check (**O**) |
| Build-time supply chain (npm packages) | Low–medium | Lockfile committed; CI uses `npm ci`; keep Dependabot or a monthly `npm audit` review; upgrade to Next 16 when convenient |
| `'unsafe-inline'` scripts | Low (no untrusted HTML) | Revisit if user-generated content is ever added |
| Domain expiry or DNS hijack | Medium (impact) | Owner: auto-renew the domain, registrar lock, 2FA at the registrar, consider DNSSEC if the registrar supports it (**O**) |
| Vercel firewall / DDoS settings unknown | Low | Owner: review in the Vercel dashboard (**O**) |
