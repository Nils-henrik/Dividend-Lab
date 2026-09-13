# AdSense strict CSP measurement

Date: 2026-09-13  
Issue: #305  
Parent: #303  
Rejected architecture: PR #304 static Google/AdSense domain allowlist  
Risk: `manual-only`

This document records the production-build measurement required before enabling Google AdSense under a Content-Security-Policy.

**Automatic merge is forbidden.** Enabling AdSense or attaching nonce CSP to `proxy.ts` / the root layout requires explicit Product Owner approval.

## Official constraints

Google AdSense CSP guidance ([support.google.com/adsense/answer/16283098](https://support.google.com/adsense/answer/16283098?hl=en-GB)):

- AdSense domains change over time.
- Google **only supports strict CSP** (`nonce` + `'strict-dynamic'`), not a rolling domain allowlist.
- Documented `script-src`: `'nonce-{random}' 'unsafe-inline' 'unsafe-eval' 'strict-dynamic' https: http:`
- Google recommends `Content-Security-Policy-Report-Only` before enforcement.

Next.js CSP guidance ([nextjs.org/docs/app/guides/content-security-policy](https://nextjs.org/docs/app/guides/content-security-policy)):

- Generate a request nonce in Proxy and set CSP on both the request and the response.
- Next.js applies that nonce to framework scripts only during **dynamic** rendering.
- Static optimization and ISR are disabled for nonce CSP.
- Pages cannot be CDN-cached without additional configuration.
- Partial Prerendering is incompatible because static-shell scripts never receive the nonce.

## How the measurement was taken

1. Production build on latest `main` (`3d70adb`, Next.js 16.2.10) with no layout/Proxy CSP changes. Route table saved as **baseline**.
2. Temporary experiment: root layout became an async Server Component and called `headers().get("x-nonce")` — the exact Next.js-documented way to read the request nonce for theme + AdSense scripts.
3. Production build again. Route table saved as **after**.
4. The experiment was reverted. Production rendering is unchanged.

No AdSense script was mounted. The rendering cost of the supported model is the `headers()` / per-request nonce read in the root layout, not the publisher tag itself.

## Baseline route rendering (current `main`)

Legend: `○` static, `●` SSG (`generateStaticParams`), `ƒ` dynamic.

| Route | Mode |
| --- | --- |
| `/` | ○ static |
| `/news` | ƒ dynamic (`searchParams`) |
| `/news/[slug]` | ● SSG (84+ prerendered articles) |
| `/learning` | ƒ dynamic (`searchParams`) |
| `/learning/[slug]` | ● SSG (21+ prerendered articles) |
| `/forum` | ƒ dynamic |
| `/forum/[threadId]`, `/forum/bolag`, `/forum/kategorier/[slug]`, `/forum/new` | ƒ dynamic |
| `/forum/kategorier`, `/forum/populart`, `/forum/regler`, `/forum/senaste` | ○ static |
| `/about`, `/contact`, `/cookies`, `/disclaimer`, `/editorial`, `/features`, `/privacy`, `/terms` | ○ static |
| `/frihetsmaskinen`, `/verktyg`, `/verktyg/gav-kalkylator` | ○ static |
| `/login`, `/register` | ƒ dynamic |
| `/forgot-password`, `/reset-password` | ○ static |
| `/account`, `/dashboard/*`, `/settings`, `/watchlist`, `/portfolio`, `/calendar`, `/goals`, `/brain`, `/contacts` | ○ static shells |
| `/messages/*`, `/portfolios`, `/portfolios/[slug]`, `/profile/[username]`, `/report` | ƒ dynamic |
| `/robots.txt`, `/icon.png`, `/apple-icon.png` | ○ static |

Build also reported `Generating static pages (164/164)`.

## After supported nonce CSP (`headers()` in root layout)

| Route | Mode |
| --- | --- |
| `/` | ƒ dynamic |
| `/news` | ƒ dynamic |
| `/news/[slug]` | ƒ dynamic — **SSG children gone** |
| `/learning` | ƒ dynamic |
| `/learning/[slug]` | ƒ dynamic — **SSG children gone** |
| `/forum` and every forum subroute | ƒ dynamic |
| All legal / marketing / tool pages | ƒ dynamic |
| Auth pages | ƒ dynamic |
| Dashboard / account / settings shells | ƒ dynamic |
| Remaining static | only `/robots.txt`, `/icon.png`, `/apple-icon.png` |

The `●` SSG legend disappeared. Next.js no longer lists prerendered news or learning paths.

## Routes that changed from static/SSG to dynamic

Every HTML route that was `○` or `●` became `ƒ`, including:

- Home
- Every prerendered `/news/[slug]` article
- Every prerendered `/learning/[slug]` article
- Legal and marketing pages
- Static forum index pages
- Dashboard and account shells
- `/forgot-password` and `/reset-password`

Already-dynamic routes (`/news` list, `/learning` list, `/forum` overview, login/register, messages, model portfolios) stayed `ƒ`.

## ISR / static HTML / CDN

- Incremental Static Regeneration and static HTML for editorial URLs stop.
- CDN edge cache of article HTML stops. Each request must hit a Next.js server function to stamp a fresh nonce.
- `Cache-Control` for these pages becomes request-bound rather than public static/ISR HTML.

## Cache Components / other supported mitigations

Evaluated and rejected as a responsible mitigation:

| Mechanism | Why it cannot preserve caching without weakening nonce correctness |
| --- | --- |
| Next.js Cache Components (`cacheComponents: true` + `'use cache'`) | Official guidance: use `connection()` for CSP nonces, which opts the **entire route** into dynamic rendering. GitHub [next.js#89754](https://github.com/vercel/next.js/issues/89754): `headers()` in the root layout with Cache Components streams the `<head>` theme script after the static shell, causing FOUC and breaking the theme bootstrap contract. |
| Partial Prerendering | Official Next.js CSP guide: PPR is incompatible because static-shell scripts never receive the per-request nonce. |
| Experimental SRI hashes | Build-time hashes cannot authorize Google's dynamically loaded AdSense graph. Next.js marks SRI experimental. |
| Static Google/AdSense host allowlist | Explicitly unsupported by Google. Rejected in PR #304. Must not be marked Accepted. |

## Practical performance / cost consequence

If the supported model were enabled:

- TTFB for `/`, news articles and learning articles would move from static/CDN to per-request SSR.
- Vercel cost would scale with HTML request volume on the highest-traffic public URLs.
- Googlebot and social crawlers would receive dynamically rendered HTML instead of prerendered article documents.
- Theme bootstrap would still work only if the nonce is available before first paint — which Cache Components cannot do.

This is a material site-wide product regression, not an isolated ads-route change.

## Fail-closed decision

Because the officially supported integration necessarily forces that regression, and no supported Next.js mechanism preserves meaningful caching without weakening nonce correctness:

1. **Do not enable AdSense in production.**
2. **Do not attach nonce CSP in `proxy.ts` or the root layout.**
3. **Do not replace the gap with a static Google domain allowlist.**
4. Leave `public/ads.txt` unchanged so publisher verification can continue.
5. Keep the current static production CSP.
6. Require Product Owner approval (ADR-007) before any enablement.

## Runtime / Preview evidence for this review-fix

AdSense is not loaded, so browser/network proof that the publisher script reaches Google is **not applicable** and must not be claimed.

Preserved production behavior that tests lock:

- Exactly zero AdSense publisher tags in `app/` and `components/`.
- Theme bootstrap and Vercel Analytics remain in the root layout.
- TradingView hosts remain in the production CSP.
- Proxy still only calls `updateSession(request)`.
- `/ads.txt` remains the exact 59-byte line from `main`.

Vercel Preview cannot validate AdSense bootstrap, CMP, or enforced nonce CSP because those are intentionally not shipped.

<!-- divlab-risk: manual-only -->
