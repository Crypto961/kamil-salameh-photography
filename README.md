# Kamil Salameh Photography

Portfolio, print-request and commission website for Lebanese photographer Kamil Salameh — [kamilsalamehphotography.com](https://kamilsalamehphotography.com).

Static HTML, CSS and vanilla JavaScript, hosted on GitHub Pages. No build step and no third-party runtime dependencies.

## Pages

| File | Purpose |
| --- | --- |
| `index.html` | Home: hero, philosophy, featured work, services, contact form |
| `about.html` | About Kamil Salameh: biography, quick facts, FAQ |
| `portfolio.html` | Full gallery with keyboard-accessible lightbox |
| `order.html` | Print / product / commission request form with live preview |
| `privacy.html` | Privacy & Cookie Policy (GDPR, Lebanese Law 81/2018) |
| `terms.html` | Terms & Conditions, copyright and image licensing, order terms |
| `404.html` | Not-found page served by GitHub Pages |
| `sitemap.xml` / `sitemap.xsl` | XML sitemap for search engines, styled for humans (generated) |
| `robots.txt` | Crawler rules: search and AI answer engines get full access; AI training crawlers get text but not `/images/` |
| `llms.txt` | Plain-text summary of who Kamil Salameh is, for AI assistants |

## Scripts

- `site.js` — shared: header state, mobile menu, privacy notice, polaroid stacks, AJAX form submission to Formspree
- `portfolio.js` — portfolio aspect ratios and lightbox
- `order.js` — order form product options and preview

## Privacy & security notes

- **No cookies, analytics or trackers.** The Inter font is self-hosted in `fonts/` (SIL OFL 1.1), so no requests go to Google Fonts or other CDNs.
- Forms post to Formspree (`https://formspree.io/f/mgawakay`) with a honeypot field and a required privacy-consent checkbox.
- Every page carries a Content-Security-Policy meta tag allowing only same-origin scripts, styles, fonts and images, plus Formspree for form submissions. **No inline scripts** — keep JavaScript in `.js` files or the CSP will block it.
- If you ever add analytics, embeds (YouTube, Instagram widgets, maps) or third-party fonts: update the CSP, update `privacy.html`, and replace the informational privacy notice with a real opt-in consent prompt that blocks them until accepted.

## Images

Photos live in `images/` as AVIF exported from Lightroom. They use a wide-gamut BT.2020 colour space signalled in the file's `nclx` colour box. **Do not batch-recompress them with tools that drop that box** (for example sharp/libvips): the colours will look washed out. If you need smaller files, re-export from Lightroom (long edge 2048px, quality ~70).

## Editing pages (important)

The HTML pages in the repository root are **generated**. Edit the templates in `_src/`, then run:

```sh
python3 _src/build.py
```

This fills in the shared header, footer, `<head>` tags and identity structured data, adds per-page SEO and social tags (defined in `SEO` in `_src/build.py`), adds cache-busting version tags to CSS/JS links, and regenerates `sitemap.xml`. Bump `VERSION` in `_src/build.py` whenever `style.css` or a `.js` file changes. GitHub Pages does not publish `_src/`.

## SEO and AI discoverability

- Every page carries JSON-LD for **Kamil Salameh** (`Person`) and **Kamil Salameh Photography** (`ProfessionalService`) with stable `@id`s and `sameAs` links to Instagram, LinkedIn and 35AWARDS. Keep those profiles linking back to the website.
- `about.html` is a `ProfilePage` with an FAQ (`FAQPage`) that mirrors the visible questions. Keep the visible text and the JSON-LD in sync.
- `portfolio.html` lists each photo as an `ImageObject` with creator, copyright, license and acquire-license page (eligible for Google Images' "Licensable" badge).
- Homepage polaroids use 600px JPEG thumbnails in `images/thumbs/` (same colour conversion) so they load instantly on phones; the full-size AVIFs are used in the portfolio.
- Social previews use JPEGs in `images/og/` (1200×630), converted from the BT.2020 AVIFs with a proper colour conversion.

## Motion

Hero entrance animations are CSS-only. Scroll reveals (`data-reveal`) and the polaroid stacks (fan out on scroll, tap to stack/unfold) are handled in `site.js`. Content stays fully visible without JavaScript, and all motion is off for visitors who prefer reduced motion.
