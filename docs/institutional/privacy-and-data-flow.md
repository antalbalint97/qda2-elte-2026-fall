# Privacy and data flow

This describes the technical behaviour of the site as verified on 20 October 2026. It is not a legal assessment. The
public summary is the `/privacy` page (`src/app/privacy/page.tsx`); this document gives the evidence behind it.

## 1. Data flow

```
 Student's browser                                   Hosting (Vercel)                 Developer
 ┌──────────────────────────────────┐   HTTPS GET    ┌──────────────────────────┐
 │ pages, scripts, fonts (cached)   │ ◄────────────► │ static files, edge cache │    no access to
 │                                  │  request data: │ request logs (IP, URL,   │    browser data;
 │ localStorage (this browser only):│  IP, URL, time,│ time, user agent)        │    no analytics
 │  · quiz progress                 │  user agent    └──────────────────────────┘    endpoint exists
 │  · notes (bonus lab)             │
 │  · theme / presentation setting  │   nothing else is sent: no answers, notes, IDs
 └──────────────────────────────────┘
```

## 2. The eight questions

| Question | Answer | Evidence |
| --- | --- | --- |
| 1. What interaction data is processed? | Answers to quiz questions, slider positions, self-ratings, typed notes. All processed in the browser's memory by client-side JavaScript | Code: `src/lib/progress.ts`, `src/components/**` |
| 2. What is saved locally? | Four localStorage keys: `qda2-lab-progress-v1` (per answered question: question id, concept, first-attempt correctness, attempt count, timestamp of first answer; streaks; self-ratings; "explored" flags for optional topics), `qda2-lab-theme`, `qda2-lab-present`, `qda2-sopranos-notes-v1` (free text the student types in the bonus lab) | Code; e2e test "only documented localStorage keys are written" |
| 3. Does interaction data leave the browser? | No. The code contains no `fetch`, XHR, beacon or WebSocket calls. The only network traffic is same-origin requests for site files | Code search; e2e test "no page contacts any host other than the site itself" |
| 4. Does the host process request metadata or IP addresses? | Yes, necessarily. Vercel receives each HTTP request (IP address, URL, time, user agent, referrer per the site's `strict-origin-when-cross-origin` policy) and may log it for delivery, security and abuse prevention. Retention and legal basis are set by Vercel's terms and the owner's plan | Inherent to web hosting; specifics need the owner's Vercel dashboard (**O**) |
| 5. Cookies or tracking technologies? | No cookies from the application; no analytics, fingerprinting, advertising or social plugins | e2e test asserts no `Set-Cookie` and an empty cookie jar; no tracking packages in `package.json`. If Vercel firewall challenge mode were enabled by the owner, Vercel could set a security cookie during an attack (**O**) |
| 6. Do third-party services process information? | Only the hosting provider (and its CDN). Fonts are self-hosted; no CDN, no external scripts. The "explain my mistake" feature is a local mock and calls no AI service | e2e network test; `src/lib/ai.ts` |
| 7. Is any personal information collected, even incidentally? | The site asks for none. Incidental: (a) IP addresses and user agents in the host's logs; (b) whatever a student chooses to type into the bonus-lab notes, which stays in their browser; (c) on shared computers, the next user of the same browser profile can see stored progress | Analysis |
| 8. How can users reset local data? | `/privacy` shows which keys are present and offers "Reset learning progress" and "Delete everything this site stored here" (two-step confirmation). Progress can also be reset on `/review`, or via the browser's site-data settings | e2e test "the privacy page shows local data and resets progress" |

## 3. What the site does not claim

- It does not claim to collect "no data", to be "completely anonymous" or to be "GDPR-compliant". Request data handled by
  the host may count as personal data under the GDPR.
- It does not name a data controller or contact: these have not been supplied by the owner. The privacy page shows a
  neutral sentence until `src/content/site.ts` is filled in.

## 4. Changes made

- New `/privacy` page with the information above in plain language, a live view of the stored keys and the reset
  controls (`src/components/privacy/LocalDataControls.tsx`).
- All storage keys are now declared in one place (`STORAGE_KEYS` in `src/lib/theme.ts`) so the page, the reset control
  and the tests cannot drift apart.
- No tracking or external requests needed removing: there were none.

## 5. Questions for human review (not answered here)

1. Who is the data controller for the hosting logs (the developer as site operator), and what contact should be
   published? (owner)
2. Is a formal privacy notice under GDPR Art. 13 needed for this site, and in which languages? (owner, possibly the
   university's data protection officer if the site is recommended officially)
3. Which Vercel region and plan apply, and what are the log retention settings? (owner, Vercel dashboard)
4. If the university links or embeds the site, does it need a data processing assessment even though no student data
   is transmitted to the developer? (institution)
