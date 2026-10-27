# Website audit — Kamil Salameh Photography

Date: 16 October 2026 · Branch: `audit-image-seo` · Base: `main` @ `3c7e73e`

This report covers the full-repository audit, what was changed and why, what was deliberately left alone, and what still needs the owner. Validation commands and results are in [`VALIDATION.md`](VALIDATION.md); the photograph inventory is [`image-inventory.csv`](image-inventory.csv) (generated from `_src/photos.json`).

## 1. Repository inventory

Every tracked file was inspected (81 files on `main` before this change).

| Area | Files | Role |
|---|---|---|
| Source templates | `_src/{index,about,portfolio,order,privacy,terms,404}.html`, `_src/{head,header,footer}.html` | Source of truth for pages |
| Build | `_src/build.py` | Generates the 7 root pages and `sitemap.xml` |
| Generated pages | `index.html`, `about.html`, `portfolio.html`, `order.html`, `privacy.html`, `terms.html`, `404.html` | Published output; never edited by hand |
| Scripts | `site.js` (header, menu, motion, privacy notice, Formspree submission), `portfolio.js` (lightbox), `order.js` (order form options/preview) | Vanilla JS, external files (CSP `script-src 'self'`) |
| Styles | `style.css` (CRLF line endings, shared), page-specific CSS inside each template | |
| Fonts | `fonts/inter-latin-var.woff2`, `fonts/OFL.txt` | Self-hosted Inter, SIL OFL 1.1 |
| Images | 18 AVIF originals, `logo.png`, 4 Open Graph JPEGs, 14 × 600px + 14 × 1200px JPEG derivatives | See §4 |
| Discovery | `sitemap.xml`, `sitemap.xsl`, `robots.txt`, `llms.txt` | |
| Hosting | `CNAME` (`kamilsalamehphotography.com`) | GitHub Pages, Jekyll default build (no `.github/` workflows, no `.nojekyll`), so `_src/` and `_reports/` are not published |

Architecture confirmed: static HTML/CSS/vanilla JS, no runtime dependencies, no build dependencies beyond Python 3. The documented `python3 _src/build.py` workflow is valid. This audit kept that architecture.

## 2. Verified problems (baseline)

| # | Severity | Problem | Evidence | Status |
|---|---|---|---|---|
| 1 | High (accuracy) | `kfardebian.jpg.avif` was described as a "Neowise comet" (portfolio alt text, Open Graph alt, About page, FAQ, `llms.txt`). The photograph shows a natural limestone rock bridge over a stream; no comet appears in any photo. The label came from an older sitemap title. | Pixel inspection | Fixed |
| 2 | High (accuracy) | Several alt texts did not describe the photo: Norway was "Calm Norwegian landscape" (it is a clock tower on a pier); France "Parisian architecture in soft evening light" (Sacré-Cœur under a blue sky); generic "Travel photography in Turkey", "Architecture photography in Germany", etc. | Pixel inspection | Fixed: all 15 rewritten from the pixels |
| 3 | Medium (SEO) | Portfolio captions were generic ("Location", "Specialty"), with country-only titles | Markup | Fixed: verified subject + place |
| 4 | Medium (image search) | Derivative filenames carried no meaning (`images/web/france.jpg`) | File names | Fixed: descriptive names (see §5) |
| 5 | Medium (crawlability) | Full-resolution originals were only reachable through a JavaScript-only `data-full` attribute; cards were `<figure role="button">` | Markup | Fixed: each card is a real `<a href>` to its original; JS upgrades it to the lightbox |
| 6 | Medium (SEO) | `ImageObject.contentUrl` pointed to the AVIF original while the page displayed the JPEG; 15 items shared a generic name pattern | JSON-LD | Fixed: `contentUrl` = displayed image, `thumbnailUrl` = 600px, unique `name`/`caption`, dimensions |
| 7 | Medium (SEO) | Sitemap `lastmod` was reset to the build date for every page on every build | Build sync check showed only `sitemap.xml` changing | Fixed: content-hash tracking (`_src/lastmod.json`) |
| 8 | Medium (accessibility) | Header text failed WCAG AA contrast on light pages (Privacy, Terms, 404): white on a translucent header over a light background, 2.98–4.31:1 | axe-core | Fixed |
| 9 | Low (accessibility) | Scrollable tables on the Privacy page could not be reached by keyboard on small screens | axe-core | Fixed (`tabindex="0"`, `role="region"`, labels, focus ring) |
| 10 | Low (accuracy) | About page and FAQ said "much of his Lebanese work is made around Kfardebian"; three photographs do not support "much of" | Copy review | Softened to what the photos show |
| 11 | Low (accuracy) | Homepage polaroid titled "Gothic Alleyways" shows a riverside panorama | Pixel inspection | Retitled "Riverside Dinant" |
| 12 | Low (performance) | About page loaded the 871 KB AVIF original for a ~480px portrait card (LCP 5.30 s on emulated slow 4G) | Measurement | Fixed: responsive 600/1200px derivatives (LCP 1.96 s) |
| 13 | Low (performance) | Order-page preview used the 871 KB original as a small CSS background | Markup | Fixed: 600px derivative |
| 14 | Low | Lightbox `<img>` shipped with `src="data:,"` | Markup | Fixed: no `src` until opened |
| 15 | Info | `lebanon-1.jpg.avif` and `lebanon-2.jpg.avif` were not referenced anywhere | Reference scan | Published in the portfolio after the owner's confirmation (16 Oct) with neutral, pixel-based descriptions |

No broken links, missing files, invalid JSON-LD, inline scripts or third-party requests were found at baseline.

## 3. Photographic content review

All 18 originals were rendered in Chromium (which colour-manages the `nclx` box) and inspected visually, including zoomed crops where needed (for example the Turkey tram's destination sign, which reads "TAKSİM").

Evidence levels recorded per photo in `_src/photos.json`:

- **owner caption**: the place was stated on the site before this audit (Paris, Masai Mara, Oslo, Copenhagen, Dinant, Kfardebian, Faqra).
- **visual identification**: a landmark or species recognised in the pixels: Sacré-Cœur, Nyhavn, Dinant citadel and collegiate church, Mount Ararat over Yerevan, İstiklal Avenue tram, vervet monkey.
- **unverified**: not named on the site. The text stays neutral:
  - Netherlands windmills: exact site unknown.
  - Germany church: town unknown.
  - Sweden spire: resembles Riddarholmen Church, Stockholm, but not named.
  - Luxembourg valley: resembles the Grund, but not named.

## 4. Image pipeline and colour fidelity

- **Originals untouched.** All 18 AVIF originals are byte-identical to the pre-audit backup (`fb162ff`). Each now carries a SHA-256 fingerprint in `photos.json`, and `validate.py` fails if any original changes.
- **No recompression.** No photograph was re-encoded in this audit. The 28 derivative changes are pure renames (git `R100`).
- **Hero image removed (owner decision, 16 Oct).** The 5.3 MB `hero-bg.jpg.avif` was the largest transfer (5.64 MB of images on homepage load). The owner chose to drop the hero photograph; the hero now uses a dark, atmospheric background in the brand blues. Homepage image transfer fell to 0.29 MB. The original file stays in the repository, unpublished and fingerprinted.
- **Turkey stays as the original.** `turkey.jpg.avif` is HDR (PQ transfer). It is served as-is (401 KB); no faithful SDR derivative was attempted.

## 5. Filename changes

Originals keep their URLs, which may already be indexed. Derivatives (about 12 days old) were renamed `subject-place-kamil-salameh.jpg`, for example `images/web/nyhavn-copenhagen-denmark-kamil-salameh.jpg`. GitHub Pages cannot redirect, so the 28 old derivative URLs now return 404. They were live for under two weeks and were never listed in the sitemap, which listed only the AVIFs. All references (HTML, JSON-LD, sitemap) are generated from the manifest, and `validate.py` confirms every one resolves.

## 6. Collection pages: considered, not created

The repository holds one photograph per destination: 3 of Lebanon, 8 of Europe, 1 each of Türkiye, Armenia and Kenya, and 1 product shot. Dedicated collection pages would be thin near-duplicates of the portfolio, with no verified narrative to add. The portfolio page with unique captions, alt text and per-image structured data is the stronger option today. Reconsider when a series has about 6+ photographs.

## 7. Owner decisions and remaining items

Resolved on 16 October 2026: the two Lebanon photographs were published; the hero image was removed; "Enforce HTTPS" was turned on by the owner (not independently verifiable from this environment).

On 16 October 2026 the owner also confirmed the remaining places: Bekaa Valley (field), statue of Saint Charbel in Faraya, Zaanse Schans in Zaandam (windmills), Stockholm (spire), Grund in Luxembourg (valley) and Saarburg, Germany (church; written "Saaburg" by the owner and read as Saarburg). Captions, alt text, filenames and structured data were updated from `_src/photos.json`.

Still open: none from the audit.

Previously open (now resolved):

1. **Unverified places**: confirm the windmill site, German town, Swedish church and Luxembourg district. Edit `_src/photos.json`, then build.
2. **Lebanon photographs**: if the field and the statue can be located (town or monument name), add it to their `place`/`alt` in `_src/photos.json`.

## 8. File-by-file change summary

| File | Change | Why |
|---|---|---|
| `_src/photos.json` (new) | Manifest of all 18 photographs: titles, places, alt text, slugs, evidence, fingerprints | Single source of truth; prevents unverified claims |
| `_src/build.py` | Generates portfolio cards and `ImageObject` JSON-LD from the manifest; `{{THUMB}}`/`{{PHOTO}}` tags; dimension reader (stdlib); sitemap images from real `<img>` and original links; hash-based `lastmod`; fails on unexpanded placeholders; `VERSION` 20261016b | §2 items 3–7 |
| `_src/validate.py` (new) | Repeatable validation (11 check groups) plus CSV inventory | Regression protection |
| `_src/lastmod.json` (new) | Content hashes and dates per page | Genuine `lastmod` |
| `_src/portfolio.html` | Placeholders for grid and JSON-LD; link and focus styles; stacked captions; lightbox `src` removed | Crawlability, accessibility |
| `_src/index.html` | Polaroid images from the manifest; "Riverside Dinant"; hero photograph, its preload and its `primaryImageOfPage` removed; atmospheric gradient background | Accurate alt text, derivative names, owner decision |
| `_src/about.html` | Portrait uses responsive derivatives; Neowise claim removed; Kfardebian text matches the photos; FAQ synced with JSON-LD | Accuracy, LCP |
| `_src/order.html` | Preview background uses the 600px derivative | Transfer size |
| `_src/privacy.html` | Keyboard-reachable, labelled table regions | axe `scrollable-region-focusable` |
| `portfolio.js` | Lightbox opens from real links; modified clicks keep link behaviour; caption shows title · place | Progressive enhancement |
| `style.css` | Solid header on light pages; table focus ring | WCAG AA contrast |
| `llms.txt` | Neowise line corrected | Accuracy |
| `images/thumbs/*`, `images/web/*` | 28 renames (identical bytes); 4 new derivatives for the two Lebanon photographs (colour-checked: mean difference 3.3 and 1.7 levels) | Descriptive filenames, newly published photos |
| Root `*.html`, `sitemap.xml` | Regenerated by the build | Kept in sync |
| `README.md` | Documents the manifest, validator, `lastmod` and adding photographs | Maintainability |
| `_reports/*` (new) | This report, validation log, image inventory | Deliverables (not published) |

## 9. Deployment

Merged into `main` and deployed by GitHub Pages on 16 October 2026 at the owner's request. To reproduce or re-verify:

```sh
git checkout audit-image-seo
python3 _src/build.py        # should report no changes to commit
python3 _src/validate.py     # must print "All checks passed."
```

Merge the pull request into `main`. GitHub Pages rebuilds automatically, usually within a minute. Hard-refresh to bypass the 10-minute cache. CSS/JS URLs carry `?v=20261016a`, so returning visitors get matching files.

## 10. Search Console follow-up (owner actions)

1. Resubmit `https://kamilsalamehphotography.com/sitemap.xml` (it now lists 42 images with accurate `lastmod` dates).
2. Use URL Inspection → Request indexing for `/portfolio.html` and `/about.html`.
3. Expect 404 reports for the old `images/web/*.jpg` and `images/thumbs/*.jpg` names. These are intentional; mark them as expected.
4. Check the Rich results test for `/portfolio.html`: the image metadata (licensing) should be detected. Google decides whether to show the "Licensable" badge; markup alone does not guarantee it.
5. Monitor Pages → "Alternate page with proper canonical tag" after the canonical-link fix from 12 October.

## 11. Follow-up, 23 October 2026: Search Console "Invalid datetime value for dateModified"

- **Cause:** the About page's `ProfilePage` structured data used a date-only value (`"dateModified": "2026-10-04"`). Google requires a full ISO 8601 datetime with timezone. The value was also stale: the page last changed on 16 October.
- **Fix:**
  - `_src/build.py` now records when each page's content changes, as a full datetime in the Asia/Beirut timezone (`_src/lastmod.json`). It fills the About page's `dateModified` from that record, and the sitemap uses the same values.
  - Privacy and Terms keep their legal "last updated" date, matching the date shown on the page, in full form: `2026-10-04T00:00:00+03:00`.
- **Prevention:** `_src/validate.py` now fails if any JSON-LD `dateModified`, `datePublished`, `dateCreated` or `uploadDate` lacks a time and timezone. A negative test confirmed it rejects the original value.
- **Owner action:** in Search Console, open the Profile page report and click **Validate fix**.

## 12. Follow-up, 25 October 2026: "Page with redirect" and "Alternate page with proper canonical tag" validations failed

- **Finding:** the site creates neither condition. Of 980 URLs in the generated pages, sitemap, `llms.txt` and `robots.txt`, every link to one of our own pages uses its exact canonical URL: no `http://`, `www.`, `index.html` or extension-less variants.
- **Cause:** the remaining URLs in both reports come from outside the site:
  - GitHub Pages redirects `http://` → `https://` (HTTPS enforced) and `www.` → apex. These appear under "Page with redirect".
  - GitHub Pages serves the same page at extension-less paths (`/portfolio`), and Google remembers `/index.html` from links that existed before 12 October, plus tracking-parameter variants (`?fbclid=…`). These declare the canonical URL and appear under "Alternate page with proper canonical tag".
- **These are correct behaviours, not errors.** Validation of these two reasons will keep reporting "some fixes failed" because the URLs will always redirect or point to their canonical page. Google indexes the canonical pages instead.
- **Prevention:** `_src/validate.py` check 13 now fails if any page, the sitemap, `llms.txt` or `robots.txt` links to a non-canonical form of our own URLs. A negative test confirmed it flags `http://www.` hosts and `/index.html`.
- **Live verification:** not possible from this environment (the domain is blocked by its network policy). The owner should confirm in Search Console that the example URLs listed are variants like those above.

## 13. Follow-up, 26 October 2026: AI assistants not showing the actual photographs

- **Report:** asked about Kamil Salameh, ChatGPT linked to the official gallery but showed "visual search previews" (thumbnails from its image-search partners) rather than the actual photographs.
- **Cause:** all photographs shared one URL (`portfolio.html`). A search result or AI citation could only point to "the portfolio", and its link preview was a single fixed image. Answer engines build their thumbnails from a result page's preview image and from image-search indexes such as Bing Images, so no result existed that represented an individual photograph.
- **Fix:**
  - **Photo pages:** one generated page per photograph at `photos/<slug>.html`, 17 in total. Each has:
    - a title naming the photographer, for example "Nyhavn, Copenhagen, Denmark | Photo by Kamil Salameh"
    - the photograph as its main content and as its `og:image` link preview
    - a description, location, original dimensions and copyright/licensing
    - `ItemPage` + `ImageObject` (creator, credit, license, location) + breadcrumbs, and previous/next links
  - **Portfolio:** caption titles link to these pages, and the `ImageObject` entries carry their `url`.
  - **Sitemap:** now 23 URLs and 75 images; each photo page lists its image and its full-resolution original.
  - **`llms.txt`:** now generated, and lists every photograph with its page URL, description and direct image URL, plus a credit line.
  - **IndexNow:** a GitHub Action (`.github/workflows/indexnow.yml`, triggered by each Pages publish) submits recently changed URLs to IndexNow, so Bing, which feeds ChatGPT search and Copilot, picks them up quickly. It can also be run manually with "submit all".
- **Unchanged:** `robots.txt` already gives AI search and answer crawlers (OAI-SearchBot, ChatGPT-User, PerplexityBot, Claude-SearchBot and others) full access, images included. Training crawlers still cannot fetch `/images/`, per the copyright terms.
- **Limits:** none of this guarantees that a specific assistant will display a specific image. That depends on each provider's crawling and index refresh, which typically takes days to weeks. The validator now requires every portfolio photograph to have its page, preview image and alt text.

## 14. Follow-up, 27 October 2026: every image linked to a page; IPTC metadata

- **Images without a page link:**
  - The 8 homepage polaroids and the About portrait now link to their photo pages. The polaroid stacks were a single `role="button"`, which cannot contain links. They are now ordinary containers with real `<a>` links, and stacking/unfolding moved to a real `<button>` with `aria-expanded`. While stacked, the first tap unfolds the cards instead of navigating.
  - `images/hero-bg.jpg.avif`, an unpublished duplicate of the Dinant photograph (which has its page), was removed from the site. It remains in git history.
- **Logo:** `images/logo.png` was a JPEG file with a `.png` extension, so it was served with the wrong MIME type. It was renamed to `logo.jpg` and every reference was updated.
- **IPTC metadata:** `_src/iptc.py` (ExifTool) writes the following to all 17 originals, 32 JPEG derivatives and 4 Open Graph crops:
  - Creator, Copyright Notice, Credit Line, Web Statement of Rights, Marked
  - Licensor name and URL, Creator work URL
  - per-photo Title and Description
  - for JPEGs, the IPTC IIM equivalents too
- **Fidelity proof:** all 54 files decode to byte-identical pixels before and after. All 17 originals keep their `nclx` colour box. Chromium renders all 17 originals identically (screenshot hashes). Original fingerprints were updated.
- **Logo excluded from tagging:** its existing metadata states "Made with Google AI" with IPTC DigitalSourceType `trainedAlgorithmicMedia`. Overwriting that with creator/copyright claims would remove an AI-provenance disclosure, so its bytes are unchanged.
- **Prevention:**
  - `validate.py` check 15: every displayed photograph links to its page or original.
  - `validate.py` check 16: every image carries the metadata. Both were negative-tested.
  - The live site check now also verifies the metadata on every published image.
