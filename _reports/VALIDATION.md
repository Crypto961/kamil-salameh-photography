# Validation log

Date: 16 October 2026 · Branch: `audit-image-seo` · Environment: Linux container, Python 3.11, Node 22, Playwright 1.56 (Chromium), axe-core 4. Pages were served locally with `python3 -m http.server`. The production domain is **not reachable** from this environment (proxy policy), so nothing here was tested against the live site.

## Commands and results

| # | Command / check | Result |
|---|---|---|
| 1 | `python3 _src/build.py` | Pass. 7 pages and `sitemap.xml` built |
| 2 | `python3 _src/validate.py --inventory` | **Pass**: "Checked 7 HTML pages, 6 sitemap URLs, 39 sitemap images, 18 original photographs. All checks passed." |
| 3 | Validator negative test (copy of site with a modified original, a robots rule blocking Googlebot, a changed form endpoint and an emptied alt in generated HTML) | Pass. It reported the fingerprint mismatch, the robots rule, and the out-of-sync generated files (and rebuilt them from `_src/`) |
| 4 | `git diff fb162ff -- 'images/*.avif'` | Pass. 0 originals changed since the pre-audit backup |
| 5 | Derivative changes | Pass. 28 files, all git `R100` (renamed, identical bytes) |
| 6 | axe-core (WCAG 2.0/2.1 A + AA + best practice), 7 pages × desktop 1440px and mobile 390px | **Pass, 14/14 with no violations** (baseline: 6 failing combinations on Privacy, Terms and 404) |
| 7 | Playwright functional suite, 7 pages × desktop and mobile | Pass. No console/CSP errors, no third-party requests, no horizontal overflow. Privacy notice persists dismissal. Mobile menu opens. Contact and order forms are blocked without consent and send with consent (Formspree mocked). Order preview renders. Lightbox opens by keyboard and returns focus |
| 8 | JavaScript disabled | Pass. 15/15 portfolio cards visible; card link opens the original (`200`, `image/avif` from the local server) |
| 9 | Lightbox behaviour | Pass. Shows the loaded derivative, swaps in the original, caption "İstiklal Avenue Tram · Istanbul, Türkiye", Escape restores focus, Ctrl-click does not open the viewer |
| 10 | Performance (emulated phone, 390×844 @3x, ~1.6 Mbps, 150 ms latency, cache disabled) | Before → after: Home LCP 1.32 → 1.24 s, image bytes 5.64 → 5.64 MB (hero unchanged by design). Portfolio LCP 1.09 → 0.96 s. About LCP **5.30 → 1.96 s**, image bytes **0.87 → 0.22 MB**. CLS 0.000 on all pages before and after |
| 11 | Colour fidelity of derivatives (measured during the earlier conversion work, not re-run here because no derivative was re-encoded) | 8 of 14 derivatives measured against Chromium's rendering of the original (Dinant, Kenya, Faqra, Milky Way, Sweden, natural bridge, Armenia, Luxembourg; the Open Graph hero was also checked): mean per-channel difference 2–8 levels out of 255 (JPEG compression/resampling). The other 6 (Sacré-Cœur, Netherlands, Germany, Norway, Nyhavn, product) used the same verified pipeline but were not individually measured. Turkey (HDR) excluded and served as the original |

## Not tested / limitations

- **Live production site**: MIME types, caching headers and HTTPS enforcement on `kamilsalamehphotography.com` could not be checked (domain blocked by this environment's proxy). The local server returned `image/avif` for AVIF files; GitHub Pages is expected to do the same, but this is unverified here.
- **Lighthouse**: not installed; the Playwright measurements above are a substitute, not Lighthouse scores.
- **Real devices and browsers**: tested in Chromium only. Safari/iOS and Firefox are untested; HDR rendering of `turkey.jpg.avif` varies by device.
- **Screen readers**: semantics were checked with axe-core; no manual NVDA/VoiceOver session was run.
- **Google tools**: the Rich Results Test and URL Inspection need the live site and the owner's Search Console access; not run.
- **Formspree**: submissions were mocked; no real message was sent.
