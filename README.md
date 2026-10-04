# Kamil Salameh Photography

Portfolio, print-request and commission website for Lebanese photographer Kamil Salameh — [kamilsalamehphotography.com](https://kamilsalamehphotography.com).

Static HTML, CSS and vanilla JavaScript, hosted on GitHub Pages. No build step and no third-party runtime dependencies.

## Pages

| File | Purpose |
| --- | --- |
| `index.html` | Home: hero, philosophy, featured work, contact form |
| `portfolio.html` | Full gallery with keyboard-accessible lightbox |
| `order.html` | Print / product / commission request form with live preview |
| `privacy.html` | Privacy & Cookie Policy (GDPR, Lebanese Law 81/2018) |
| `terms.html` | Terms & Conditions, copyright and image licensing, order terms |
| `404.html` | Not-found page served by GitHub Pages |

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

Photos live in `images/` as AVIF, max 2048px on the long edge, with EXIF/XMP metadata (camera serial numbers etc.) stripped. Keep new uploads under ~500 KB and strip metadata before committing.

## Shared header and footer

The header, footer and privacy notice markup is repeated in every page. When changing navigation or legal links, update all six HTML files.
