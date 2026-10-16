#!/usr/bin/env python3
"""Build the site's HTML pages from the templates in this folder.

Usage:  python3 _src/build.py

Each page template (index.html, about.html, ...) contains placeholders:
  {{HEAD}}    shared <head> tags (head.html)
  {{HEADER}}  site header and navigation (header.html)
  {{FOOTER}}  footer, privacy notice and site.js (footer.html)
The generated pages are written to the repository root. GitHub Pages does not
publish this _src folder (Jekyll skips folders that start with an underscore).

Bump VERSION whenever style.css or a .js file changes, so browsers fetch the
new files instead of mixing a new page with a stale cached stylesheet.
"""
import datetime
import hashlib
import html as htmllib
import json
import os
import re
import struct

VERSION = "20261016b"

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

SITE = "https://kamilsalamehphotography.com/"

# page template -> navigation item to mark as current
PAGES = {
    "index": None,
    "about": "about",
    "portfolio": "portfolio",
    "order": "order",
    "privacy": None,
    "terms": None,
    "404": None,
}

# Search and social metadata per page. Titles stay under ~60 characters and
# descriptions under ~160 so search engines show them in full.
SEO = {
    "index": dict(
        path="",
        title="Kamil Salameh Photography | Lebanese Fine Art Photographer",
        description="Kamil Salameh is a Lebanese landscape, astrophotography, architecture and fine art photographer. Explore the portfolio, order prints or commission a shoot.",
        image="images/og/home.jpg",
        image_alt="Dinant, Belgium reflected in the Meuse river, photographed by Kamil Salameh",
    ),
    "about": dict(
        path="about.html",
        title="About Kamil Salameh | Lebanese Photographer",
        description="Kamil Salameh is a Lebanese landscape, astrophotography and fine art photographer, founder of Kamil Salameh Photography. Biography, specialties and FAQ.",
        image="images/og/about.jpg",
        image_alt="Faqra Roman temple ruins at sunset in Kfardebian, Lebanon, photographed by Kamil Salameh",
        og_type="profile",
    ),
    "portfolio": dict(
        path="portfolio.html",
        title="Photography Portfolio | Kamil Salameh Photography",
        description="Portfolio of Lebanese photographer Kamil Salameh: Lebanon landscapes, astrophotography over Kfardebian, and travel work from Europe, Armenia, Turkey and Kenya.",
        image="images/og/portfolio.jpg",
        image_alt="Natural limestone rock bridge above a mountain stream in Kfardebian, Lebanon, photographed by Kamil Salameh",
    ),
    "order": dict(
        path="order.html",
        title="Fine Art Prints & Commissions | Kamil Salameh Photography",
        description="Order fine art prints, canvas and photo gifts by Kamil Salameh, or commission architectural, product and private photography. Request a personal quote.",
        image="images/og/prints.jpg",
        image_alt="Fine art product photograph by Kamil Salameh",
    ),
    "privacy": dict(
        path="privacy.html",
        title="Privacy & Cookie Policy | Kamil Salameh Photography",
        description="How Kamil Salameh Photography handles personal data, cookies and local storage, and your rights under GDPR and Lebanese Law No. 81/2018.",
        image="images/og/home.jpg",
        image_alt="Kamil Salameh Photography",
    ),
    "terms": dict(
        path="terms.html",
        title="Terms & Conditions | Kamil Salameh Photography",
        description="Terms of use, copyright and image licensing, and conditions for fine art print orders and photography commissions with Kamil Salameh Photography.",
        image="images/og/home.jpg",
        image_alt="Kamil Salameh Photography",
    ),
    "404": dict(
        path=None,
        title="Page Not Found | Kamil Salameh Photography",
        description="The page you are looking for does not exist.",
        image="images/og/home.jpg",
        image_alt="Kamil Salameh Photography",
        robots="noindex, follow",
    ),
}


def esc(text):
    return (text.replace("&", "&amp;").replace('"', "&quot;")
                .replace("<", "&lt;").replace(">", "&gt;"))


def seo_tags(name):
    m = SEO[name]
    url = SITE + m["path"] if m["path"] is not None else None
    image = SITE + m["image"]
    tags = [
        "    <title>%s</title>" % esc(m["title"]),
        '    <meta name="description" content="%s">' % esc(m["description"]),
        '    <meta name="author" content="Kamil Salameh">',
        '    <meta name="robots" content="%s">' % m.get("robots", "index, follow, max-image-preview:large, max-snippet:-1"),
    ]
    if url:
        tags.append('    <link rel="canonical" href="%s">' % url)
    tags += [
        "",
        '    <meta property="og:type" content="%s">' % m.get("og_type", "website"),
        '    <meta property="og:site_name" content="Kamil Salameh Photography">',
        '    <meta property="og:locale" content="en_US">',
        '    <meta property="og:title" content="%s">' % esc(m["title"]),
        '    <meta property="og:description" content="%s">' % esc(m["description"]),
    ]
    if url:
        tags.append('    <meta property="og:url" content="%s">' % url)
    tags += [
        '    <meta property="og:image" content="%s">' % image,
        '    <meta property="og:image:type" content="image/jpeg">',
        '    <meta property="og:image:width" content="1200">',
        '    <meta property="og:image:height" content="630">',
        '    <meta property="og:image:alt" content="%s">' % esc(m["image_alt"]),
        '    <meta name="twitter:card" content="summary_large_image">',
        '    <meta name="twitter:title" content="%s">' % esc(m["title"]),
        '    <meta name="twitter:description" content="%s">' % esc(m["description"]),
        '    <meta name="twitter:image" content="%s">' % image,
    ]
    if m.get("og_type") == "profile":
        tags += ['    <meta property="profile:first_name" content="Kamil">',
                 '    <meta property="profile:last_name" content="Salameh">']
    return "\n".join(tags)


def read(name):
    with open(os.path.join(HERE, name), encoding="utf-8") as f:
        return f.read().rstrip("\n")


def versioned(html):
    html = re.sub(r'((?:href|src)="/?(?:style\.css|[a-z]+\.js))"', r'\1?v=%s"' % VERSION, html)
    return html


# ---------------------------------------------------------------------------
# Photographs: generated from _src/photos.json (the single source of truth)
# ---------------------------------------------------------------------------

def image_size(path):
    """Return (width, height) of a JPEG or AVIF file without third-party libraries."""
    with open(os.path.join(ROOT, path), "rb") as f:
        data = f.read()
    if data[:2] == b"\xff\xd8":  # JPEG: find the first SOFn marker
        i = 2
        while i < len(data):
            marker, length = data[i + 1], struct.unpack(">H", data[i + 2:i + 4])[0]
            if marker in (0xC0, 0xC1, 0xC2):
                h, w = struct.unpack(">HH", data[i + 5:i + 9])
                return w, h
            i += 2 + length
    i = data.find(b"ispe")  # AVIF/HEIF: image spatial extents property
    if i > 0:
        w, h = struct.unpack(">II", data[i + 8:i + 16])
        return w, h
    raise ValueError("cannot read dimensions of " + path)


def load_photos():
    with open(os.path.join(HERE, "photos.json"), encoding="utf-8") as f:
        photos = json.load(f)["photos"]
    return {p["id"]: p for p in photos}


PHOTOS = load_photos()


def attr(text):
    return htmllib.escape(text, quote=True)


def thumb_path(p):
    return "images/thumbs/%s.jpg" % p["slug"]


def web_path(p):
    return "images/web/%s.jpg" % p["slug"]


def display_src(p):
    """The image shown on the page: the 1200px JPEG, or the original when no
    derivative exists (HDR originals cannot be converted faithfully)."""
    return web_path(p) if p["slug"] else p["original"]


def img_responsive(p, sizes, extra=""):
    """Responsive <img>: 600/1200px JPEG derivatives, original dimensions."""
    w, h = image_size(p["original"])
    if p["slug"]:
        src = ('src="%s" srcset="%s 600w, %s 1200w" sizes="%s"'
               % (web_path(p), thumb_path(p), web_path(p), sizes))
    else:
        src = 'src="%s"' % p["original"]
    return '<img %s width="%d" height="%d" alt="%s"%s>' % (src, w, h, attr(p["alt"]), extra)


def img_thumb(p, extra=' loading="lazy" decoding="async"'):
    w, h = image_size(thumb_path(p))
    return '<img src="%s" width="%d" height="%d" alt="%s"%s>' % (thumb_path(p), w, h, attr(p["alt"]), extra)


def portfolio_grid():
    cards = []
    shown = [p for p in PHOTOS.values() if p["portfolio"]]
    for i, p in enumerate(shown):
        delay = "%g" % ((i % 3) * 0.08)
        img = img_responsive(p, "(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 420px",
                             ' loading="lazy" decoding="async"')
        cards.append(
            '        <figure class="portfolio-card" data-reveal style="--reveal-delay: %ss">\n'
            '            <a class="portfolio-link" href="%s" data-lightbox>\n'
            '                <span class="image-wrapper">%s</span>\n'
            '                <span class="visually-hidden">View full-size photograph</span>\n'
            '            </a>\n'
            '            <figcaption><h3>%s</h3><span>%s</span></figcaption>\n'
            '        </figure>' % (delay, p["original"], img, attr(p["title"]), attr(p["place"])))
    return "\n\n".join(cards)


def portfolio_ld():
    items = []
    shown = [p for p in PHOTOS.values() if p["portfolio"]]
    for i, p in enumerate(shown, 1):
        obj = {
            "@type": "ImageObject",
            "@id": SITE + "portfolio.html#" + p["id"],
            "contentUrl": SITE + display_src(p),
            "name": "%s, %s" % (p["title"], p["place"]) if p["place"] != "Product Photography" else p["title"],
            "caption": p["alt"],
            "creator": {"@id": SITE + "#person"},
            "creditText": "Kamil Salameh",
            "copyrightHolder": {"@id": SITE + "#person"},
            "copyrightNotice": "© Kamil Salameh. All rights reserved.",
            "license": SITE + "terms.html#copyright",
            "acquireLicensePage": SITE + "order.html",
        }
        if p["slug"]:
            obj["thumbnailUrl"] = SITE + thumb_path(p)
        w, h = image_size(p["original"])
        obj["width"], obj["height"] = w, h
        items.append({"@type": "ListItem", "position": i, "item": obj})
    ld = {"@context": "https://schema.org", "@graph": [
        {"@type": ["CollectionPage", "ImageGallery"], "@id": SITE + "portfolio.html#webpage",
         "url": SITE + "portfolio.html", "name": "Photography Portfolio | Kamil Salameh Photography",
         "description": "Landscape, astrophotography, architecture, travel and product photography by Lebanese photographer Kamil Salameh.",
         "isPartOf": {"@id": SITE + "#website"}, "about": {"@id": SITE + "#person"},
         "author": {"@id": SITE + "#person"}, "breadcrumb": {"@id": SITE + "portfolio.html#breadcrumb"},
         "inLanguage": "en",
         "mainEntity": {"@type": "ItemList", "numberOfItems": len(items), "itemListElement": items}},
        {"@type": "BreadcrumbList", "@id": SITE + "portfolio.html#breadcrumb", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Home", "item": SITE},
            {"@type": "ListItem", "position": 2, "name": "Portfolio", "item": SITE + "portfolio.html"}]}]}
    return ("    <!-- Page structured data: gallery with per-image copyright and licensing (generated from _src/photos.json) -->\n"
            '    <script type="application/ld+json">\n' + json.dumps(ld, indent=2, ensure_ascii=False) + "\n    </script>")


def expand_photo_tags(html):
    """{{THUMB:id}} -> 600px thumbnail <img>; {{PHOTO:id}} -> responsive <img>;
    {{ALT:id}} -> alt text; {{WEB:id}} / {{ORIGINAL:id}} -> paths."""
    html = re.sub(r"\{\{THUMB:([a-z0-9-]+)\}\}", lambda m: img_thumb(PHOTOS[m.group(1)]), html)
    html = re.sub(r"\{\{PHOTO:([a-z0-9-]+)\|([^}]*)\}\}",
                  lambda m: img_responsive(PHOTOS[m.group(1)], "(max-width: 900px) 92vw, 480px", m.group(2)), html)
    html = re.sub(r"\{\{ALT:([a-z0-9-]+)\}\}", lambda m: attr(PHOTOS[m.group(1)]["alt"]), html)
    html = re.sub(r"\{\{WEB:([a-z0-9-]+)\}\}", lambda m: web_path(PHOTOS[m.group(1)]), html)
    html = re.sub(r"\{\{THUMBPATH:([a-z0-9-]+)\}\}", lambda m: thumb_path(PHOTOS[m.group(1)]), html)
    html = re.sub(r"\{\{ORIGINAL:([a-z0-9-]+)\}\}", lambda m: PHOTOS[m.group(1)]["original"], html)
    return html


def build():
    head, header, footer = read("head.html"), read("header.html"), read("footer.html")
    for name, active in PAGES.items():
        nav = header
        for key in ("about", "portfolio", "order"):
            nav = nav.replace("{{%s}}" % key, ' aria-current="page"' if key == active else "")
        html = (read(name + ".html")
                .replace("{{SEO}}", seo_tags(name))
                .replace("{{HEAD}}", head)
                .replace("{{HEADER}}", nav)
                .replace("{{FOOTER}}", footer))
        if name == "portfolio":
            html = html.replace("{{PORTFOLIO_LD}}", portfolio_ld()).replace("{{PORTFOLIO_GRID}}", portfolio_grid())
        html = expand_photo_tags(html)
        leftover = re.findall(r"\{\{[A-Z_]+[^}]*\}\}", html)
        if leftover:
            raise SystemExit("unexpanded placeholders in %s: %s" % (name, leftover))
        if name == "index":
            html = html.replace('href="/#contact">Contact', 'href="#contact">Contact')
        if name == "404":
            # Served for any missing URL, including nested ones, so use root-relative paths.
            html = re.sub(r'(href|src)="(?!https?:|#|data:|/)([^"]+)"', r'\1="/\2"', html)
        html = versioned(html)
        with open(os.path.join(ROOT, name + ".html"), "w", encoding="utf-8", newline="\n") as f:
            f.write(html + "\n")
        print("built", name + ".html")


# Sitemap: every indexable page with the photographs it actually shows.
SITEMAP = [  # (page, priority, change frequency)
    ("index", "1.0", "weekly"),
    ("portfolio", "0.9", "weekly"),
    ("about", "0.9", "monthly"),
    ("order", "0.8", "monthly"),
    ("privacy", "0.3", "yearly"),
    ("terms", "0.3", "yearly"),
]


LASTMOD_FILE = os.path.join(HERE, "lastmod.json")


def page_images(html):
    """Photographs a page exposes to crawlers: every <img> under images/
    (except the logo) plus full-size originals linked from the portfolio."""
    found = []
    for src in re.findall(r'<img\b[^>]*?\ssrc="(images/[^"]+)"', html):
        if not src.endswith("logo.png") and src not in found:
            found.append(src)
    for href in re.findall(r'<a class="portfolio-link" href="(images/[^"]+)"', html):
        if href not in found:
            found.append(href)
    return found


def build_sitemap():
    """Write sitemap.xml. A page's <lastmod> changes only when its generated
    HTML changes (tracked by content hash in _src/lastmod.json)."""
    today = datetime.date.today().isoformat()
    try:
        with open(LASTMOD_FILE, encoding="utf-8") as f:
            state = json.load(f)
    except FileNotFoundError:
        state = {}
    out = ['<?xml version="1.0" encoding="UTF-8"?>',
           '<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>',
           '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
           '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">']
    for name, priority, freq in SITEMAP:
        with open(os.path.join(ROOT, name + ".html"), encoding="utf-8") as f:
            html = f.read()
        digest = hashlib.sha256(html.encode("utf-8")).hexdigest()
        entry = state.get(name)
        if not entry or entry.get("sha256") != digest:
            entry = {"sha256": digest, "lastmod": today}
            state[name] = entry
        out += ["  <url>",
                "    <loc>%s%s</loc>" % (SITE, SEO[name]["path"]),
                "    <lastmod>%s</lastmod>" % entry["lastmod"],
                "    <changefreq>%s</changefreq>" % freq,
                "    <priority>%s</priority>" % priority]
        for src in page_images(html):
            out += ["    <image:image>", "      <image:loc>%s%s</image:loc>" % (SITE, src), "    </image:image>"]
        out.append("  </url>")
    out.append("</urlset>")
    with open(os.path.join(ROOT, "sitemap.xml"), "w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(out) + "\n")
    with open(LASTMOD_FILE, "w", encoding="utf-8", newline="\n") as f:
        json.dump(state, f, indent=2, sort_keys=True)
        f.write("\n")
    print("built sitemap.xml")

if __name__ == "__main__":
    build()
    build_sitemap()
