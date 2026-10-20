# University network access and diagnostics

The site may be unreachable from university-managed classroom computers. The cause has **not** been confirmed: no
error message or test result from a classroom machine has been captured yet. DNS filtering is a hypothesis, not a
finding. A university DNS or firewall policy cannot be fixed by changing the website, and this document deliberately
contains no workaround (alternative domains, proxies, DNS-over-HTTPS, VPNs or similar). Its purpose is to give IT staff
the facts they need to decide.

## 1. Required hostnames

| Hostname | Purpose | Required |
| --- | --- | --- |
| `statisztikametis.site` | Every page, script, stylesheet, font and data file | Yes, the only one |
| `www.statisztikametis.site` | Possibly configured as an alias that redirects to the apex domain | Unverified; not needed if users type the apex address |

Verified in a local production build with an automated browser test: across all pages and interactions the site makes
**no requests to any other hostname** (no CDN, font service, analytics, API or AI service). Fonts and mathematical
notation are served from the same origin. All requests are ordinary HTTPS `GET`s on port 443; there are no WebSockets,
no long polling and no uploads.

Hosting: Vercel's edge network. The domain's DNS records point at Vercel; the IP addresses behind them are Vercel's
shared, anycast infrastructure and **can change without notice**, so IP allow-listing is not recommended. Allow-listing
by hostname (DNS filter, web proxy category or SNI) is the appropriate mechanism.

## 2. Network dependency diagram

```
 Classroom PC (browser)
      │ 1. DNS query: statisztikametis.site  ──►  university DNS resolver / filter  ──►  public DNS
      │ 2. TLS on 443, SNI = statisztikametis.site
      ▼
 university firewall / web proxy / content filter (may inspect SNI or decrypt TLS)
      │
      ▼
 Vercel edge network (CDN) ──► static files of this site (no further back-end, no third parties)
```

## 3. HTTPS requirements

- TLS on port 443 to `statisztikametis.site`; certificates are issued and renewed automatically by the host (expected
  issuer: a public CA such as Let's Encrypt; to be confirmed with the commands below).
- The site sends HSTS (`max-age=31536000`, no `includeSubDomains`), so after the first successful visit browsers refuse
  plain HTTP for a year. A TLS-inspecting proxy must therefore present a certificate trusted by the classroom machines.
- Any modern browser (current Chrome, Edge, Firefox or Safari) works; JavaScript is needed for the interactive parts.
  Text, tables and formulas are readable without JavaScript.

## 4. Diagnostic commands

These read public information only; they change nothing and need no credentials. Run them on a classroom machine and,
for comparison, on a machine outside the university network.

**DNS**

```bash
nslookup statisztikametis.site
nslookup www.statisztikametis.site
dig +short A statisztikametis.site
dig +short AAAA statisztikametis.site
dig +short CNAME www.statisztikametis.site
dig +dnssec statisztikametis.site          # look for the "ad" flag and RRSIG records
```

Windows PowerShell:

```powershell
Resolve-DnsName statisztikametis.site
Resolve-DnsName statisztikametis.site -Type AAAA
```

If the university resolver returns `NXDOMAIN`, `0.0.0.0`, `127.0.0.1` or the address of a block page while an
outside machine gets a normal answer, a DNS filter is acting on the name.

**TCP and TLS**

```powershell
Test-NetConnection statisztikametis.site -Port 443
```

```bash
openssl s_client -connect statisztikametis.site:443 -servername statisztikametis.site </dev/null 2>/dev/null \
  | openssl x509 -noout -subject -issuer -dates
```

An issuer that is the university's or a security vendor's CA indicates TLS inspection. A reset or timeout here, with
correct DNS, points at a firewall or proxy rule.

**HTTP and redirects**

```bash
curl -sI https://statisztikametis.site/
curl -sIL http://statisztikametis.site/            # follow the redirect chain from plain HTTP
curl -sIL https://www.statisztikametis.site/
```

Windows: use `curl.exe` (not the PowerShell alias). Expected: `HTTP/2 200` with the security headers listed in
[security-review.md](security-review.md); plain HTTP should redirect to HTTPS.

## 5. Browser checks for a technician

1. Open `https://statisztikametis.site/` and note the **exact** error text and code, e.g.
   `DNS_PROBE_FINISHED_NXDOMAIN` (name not resolved), `ERR_CONNECTION_RESET` / `ERR_CONNECTION_TIMED_OUT` (blocked
   connection), `NET::ERR_CERT_AUTHORITY_INVALID` (TLS inspection with an untrusted certificate), or a branded block page
   (content filter: note the category it shows).
2. Click the padlock → certificate: record issuer and validity.
3. Developer tools (F12) → Network → reload: confirm that only `statisztikametis.site` appears in the domain column and
   note any request that fails.
4. Chrome/Edge: `chrome://net-internals/#dns` (or `edge://net-internals/#dns`) → look up the hostname; `chrome://net-export`
   can capture a log for IT if needed.
5. Try a private window to rule out a cached block or extension.

Possible causes worth checking (hypotheses, not findings): content filters often block or warn on **newly registered**
or **uncategorised** domains, and some apply stricter rules to less common top-level domains such as `.site`. If the
filter vendor's block page shows such a category, the legitimate remedy is a recategorisation request to the vendor or an
allow-list entry for the hostname, made by university IT.

## 6. Reproducible test from a university-managed machine

1. Record: date and time, building and room, machine type, operating system, browser and version, wired or Wi-Fi
   (network name), whether logged in as student or staff.
2. Open `https://statisztikametis.site/` and take a screenshot of the full window, including the address bar.
3. Open `https://statisztikametis.site/about` (direct deep link) and note the result.
4. Run the commands in §4 that the machine allows, and save the output.
5. Repeat on the university Wi-Fi with a personal device, and on a mobile network, to separate machine policy from
   network policy.
6. Enter the results in §8.

## 7. Összefoglaló az ELTE informatikai támogatás számára (magyarul)

A StatisztikaMetis (<https://statisztikametis.site/>) egy önállóan fejlesztett, statikus oktatási weboldal a
Kvantitatív adatelemzés 2 kurzushoz. Nem hivatalos egyetemi szolgáltatás. Nincs felhasználói fiók, bejelentkezés,
süti (cookie), analitika vagy harmadik féltől betöltött tartalom; a hallgatók haladása kizárólag a saját böngészőjükben
(localStorage) tárolódik.

**Hálózati igény:** egyetlen hosztnév, a `statisztikametis.site`, HTTPS-en (443-as port). Minden oldal, szkript,
betűtípus és adat erről a címről töltődik be; más domainhez a webhely nem kapcsolódik (ezt automatizált böngészőteszttel
ellenőriztük). A tárhelyszolgáltató a Vercel; az IP-címek dinamikusak (anycast CDN), ezért IP-alapú engedélyezés
helyett hosztnév-alapú engedélyezést javaslunk.

**Jelenlegi helyzet:** egyes tantermi gépekről a webhely állítólag nem érhető el. A pontos hibaüzenetet még nem
rögzítettük, ezért nem tudjuk, hogy DNS-szűrés, tűzfal, proxy vagy tartalomszűrő kategória okozza-e. Nem kérünk és nem
javaslunk semmilyen megkerülő megoldást.

**Kérés:** kérjük, ellenőrizzék egy tantermi gépről a 4. pontban felsorolt parancsokkal (`nslookup`,
`Test-NetConnection`, `curl.exe -I`), hogy a név feloldódik-e, és ha a webhelyet szabály blokkolja, mérlegeljék a
`statisztikametis.site` hosztnév engedélyezését, vagy a szűrőszolgáltatónál az "oktatás" kategóriába sorolás kérését.
A kapcsolattartó adatait a projekt tulajdonosa adja meg (lásd [open-issues.md](open-issues.md)).

## 8. Recorded classroom results

*To be filled in. Do not include personal data, internal IP addresses or internal hostnames when this file is public.*

| Date | Location / machine | Network | Browser | Error text / code (exact) | DNS result | TLS issuer | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| | | | | | | | |

## 9. What was and was not verified in this review

| Item | Status |
| --- | --- |
| Single-hostname dependency, no third-party requests | Verified on a local production build (automated test) |
| Pages work on direct navigation and refresh of nested routes | Verified (automated test) |
| DNS records, DNSSEC, live certificate, live redirect chain, `www` alias | Not verifiable: the review sandbox's egress proxy refused connections to the domain and had no DNS access for it. To be run with §4 |
| Behaviour when the network is slow | Verified: a module page is usable on an emulated 750 kbit/s, 400 ms RTT connection |
| Offline use | No service worker (deliberately: stale cached versions on shared classroom machines would be hard to update). Fallback: an instructor can run the site from a laptop without internet: `npm ci && npm run build` once while online (fonts are fetched at build time), then `npm start` serves `http://localhost:3000` offline. This was verified to make no external requests |
