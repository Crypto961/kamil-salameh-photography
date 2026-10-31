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

VERSION = "20261031a"

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
    """Search/social tags for a page: `name` is a key of SEO or a dict with
    the same fields (photo pages pass their own)."""
    m = SEO[name] if isinstance(name, str) else name
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
        '    <meta property="og:image:type" content="%s">' % m.get("image_type", "image/jpeg"),
        '    <meta property="og:image:width" content="%d">' % m.get("image_w", 1200),
        '    <meta property="og:image:height" content="%d">' % m.get("image_h", 630),
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
            '            <figcaption><h3><a href="%s">%s</a></h3><span>%s</span></figcaption>\n'
            '        </figure>' % (delay, p["original"], img, photo_path(p), attr(p["title"]), attr(p["place"])))
    return "\n\n".join(cards)


def portfolio_ld():
    items = []
    shown = [p for p in PHOTOS.values() if p["portfolio"]]
    for i, p in enumerate(shown, 1):
        obj = {
            "@type": "ImageObject",
            "@id": SITE + "portfolio.html#" + p["id"],
            "url": SITE + photo_path(p),
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
    html = re.sub(r"\{\{PAGE:([a-z0-9-]+)\}\}", lambda m: photo_path(PHOTOS[m.group(1)]), html)
    html = re.sub(r"\{\{WEB:([a-z0-9-]+)\}\}", lambda m: web_path(PHOTOS[m.group(1)]), html)
    html = re.sub(r"\{\{THUMBPATH:([a-z0-9-]+)\}\}", lambda m: thumb_path(PHOTOS[m.group(1)]), html)
    html = re.sub(r"\{\{ORIGINAL:([a-z0-9-]+)\}\}", lambda m: PHOTOS[m.group(1)]["original"], html)
    return html


# ---------------------------------------------------------------------------
# One page per photograph: photos/<slug>.html
# Gives every photo its own URL, title, link preview (og:image) and
# ImageObject, so search engines and AI assistants can cite and show the
# actual photograph instead of the portfolio as a whole.
# ---------------------------------------------------------------------------

def page_slug(p):
    return p.get("page") or p["slug"]


def photo_path(p):
    return "photos/%s.html" % page_slug(p)


def portfolio_photos():
    return [p for p in PHOTOS.values() if p["portfolio"]]


def is_product(p):
    return p["place"] == "Product Photography"


def photo_heading(p):
    """Title plus place, without repeating a place already in the title
    ("Mount Ararat over Yerevan, Armenia", not "..., Yerevan, Armenia")."""
    if is_product(p):
        return p["title"]
    parts = [x.strip() for x in p["place"].split(",")]
    if len(parts) > 1 and parts[0].lower() in p["title"].lower():
        parts = parts[1:]
    return "%s, %s" % (p["title"], ", ".join(parts))


def photo_seo(p):
    w, h = image_size(display_src(p))
    if is_product(p):
        title = "%s | Product Photography by Kamil Salameh" % p["title"]
    else:
        title = "%s | Photo by Kamil Salameh" % photo_heading(p)
    description = "%s. Photograph by Kamil Salameh, Lebanese landscape and fine art photographer." % p["alt"]
    if len(description) > 160:
        description = "%s. Photograph by Kamil Salameh." % p["alt"]
    return dict(path=photo_path(p), title=title, description=description,
                image=display_src(p), image_alt=p["alt"], image_w=w, image_h=h,
                image_type="image/jpeg" if p["slug"] else "image/avif", og_type="article")


def photo_ld(p):
    url = SITE + photo_path(p)
    w, h = image_size(p["original"])
    image = {
        "@type": "ImageObject",
        "@id": url + "#image",
        "url": url,
        "contentUrl": SITE + display_src(p),
        "name": photo_heading(p),
        "caption": p["alt"],
        "width": w, "height": h,
        "creator": {"@id": SITE + "#person"},
        "creditText": "Kamil Salameh",
        "copyrightHolder": {"@id": SITE + "#person"},
        "copyrightNotice": "© Kamil Salameh. All rights reserved.",
        "license": SITE + "terms.html#copyright",
        "acquireLicensePage": SITE + "order.html",
        "isPartOf": {"@id": SITE + "portfolio.html#webpage"},
    }
    if p["slug"]:
        image["thumbnailUrl"] = SITE + thumb_path(p)
    if not is_product(p):
        image["contentLocation"] = {"@type": "Place", "name": p["place"]}
    ld = {"@context": "https://schema.org", "@graph": [
        {"@type": "ItemPage", "@id": url + "#webpage", "url": url, "name": photo_seo(p)["title"],
         "isPartOf": {"@id": SITE + "#website"}, "about": {"@id": SITE + "#person"},
         "mainEntity": {"@id": url + "#image"}, "primaryImageOfPage": {"@id": url + "#image"},
         "breadcrumb": {"@id": url + "#breadcrumb"}, "inLanguage": "en"},
        image,
        {"@type": "BreadcrumbList", "@id": url + "#breadcrumb", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Home", "item": SITE},
            {"@type": "ListItem", "position": 2, "name": "Portfolio", "item": SITE + "portfolio.html"},
            {"@type": "ListItem", "position": 3, "name": photo_heading(p), "item": url}]}]}
    return ("    <!-- Page structured data: this photograph (generated from _src/photos.json) -->\n"
            '    <script type="application/ld+json">\n' + json.dumps(ld, indent=2, ensure_ascii=False) + "\n    </script>")


def photo_body(p, prev, nxt):
    w, h = image_size(p["original"])
    img = img_responsive(p, "(max-width: 1240px) calc(100vw - 40px), 1200px", ' fetchpriority="high" decoding="async"')
    meta_label = "Category" if is_product(p) else "Location"
    pager = []
    if prev:
        pager.append('<a class="prev" href="%s"><span>← Previous</span>%s</a>' % (photo_path(prev), attr(photo_heading(prev))))
    if nxt:
        pager.append('<a class="next" href="%s"><span>Next →</span>%s</a>' % (photo_path(nxt), attr(photo_heading(nxt))))
    return """    <nav class="photo-breadcrumb" aria-label="Breadcrumb">
        <a href="/">Home</a><span aria-hidden="true">/</span><a href="portfolio.html">Portfolio</a><span aria-hidden="true">/</span><span aria-current="page">%(title)s</span>
    </nav>

    <figure class="photo-figure">
        <a class="photo-frame" href="%(original)s">%(img)s<span class="visually-hidden">View the full-resolution photograph</span></a>
        <figcaption class="visually-hidden">%(heading)s. Photograph by Kamil Salameh.</figcaption>
    </figure>

    <div class="photo-details">
        <div>
            <h1>%(title)s</h1>
            <p class="photo-place">%(place)s</p>
            <p class="photo-description">%(alt)s. Photographed by <a href="about.html">Kamil Salameh</a>, a Lebanese photographer specializing in landscape, astrophotography, architecture and fine art.</p>
            <div class="photo-actions">
                <a href="order.html" class="primary-button">Request a Print</a>
                <a href="%(original)s" class="ghost-button">Full Resolution</a>
            </div>
        </div>
        <aside class="photo-meta" aria-label="Photograph details">
            <dl>
                <div><dt>Photographer</dt><dd><a href="about.html">Kamil Salameh</a></dd></div>
                <div><dt>%(meta_label)s</dt><dd>%(place)s</dd></div>
                <div><dt>Original</dt><dd>%(w)d × %(h)d px</dd></div>
                <div><dt>Copyright</dt><dd>© Kamil Salameh. May be shown by search engines and AI assistants with the credit "Photo: Kamil Salameh" and a link to this page. <a href="terms.html#search-and-ai">Usage terms</a></dd></div>
            </dl>
        </aside>
    </div>

    <nav class="photo-pager" aria-label="More photographs">
        %(pager)s
    </nav>""" % dict(title=attr(p["title"]), place=attr(p["place"]), alt=attr(p["alt"]), heading=attr(photo_heading(p)),
                     original=p["original"], img=img, w=w, h=h, meta_label=meta_label, pager="\n        ".join(pager))


def root_relative(html):
    """Pages outside the site root (404, photos/) use root-relative links."""
    html = re.sub(r'(href|src)="(?!https?:|#|data:|/|mailto:)([^"]+)"', r'\1="/\2"', html)

    def fix_srcset(m):
        parts = []
        for part in m.group(1).split(","):
            url, _, descriptor = part.strip().partition(" ")
            if not re.match(r"^(https?:|/|data:)", url):
                url = "/" + url
            parts.append((url + " " + descriptor).strip())
        return 'srcset="%s"' % ", ".join(parts)
    return re.sub(r'srcset="([^"]+)"', fix_srcset, html)


def build_photo_pages(head, header, footer, state):
    os.makedirs(os.path.join(ROOT, "photos"), exist_ok=True)
    shown = portfolio_photos()
    nav = header
    for key in ("about", "portfolio", "order"):
        nav = nav.replace("{{%s}}" % key, ' aria-current="page"' if key == "portfolio" else "")
    template = read("photo.html")
    expected = set()
    for i, p in enumerate(shown):
        prev = shown[i - 1] if i > 0 else None
        nxt = shown[i + 1] if i + 1 < len(shown) else None
        html = (template.replace("{{SEO}}", seo_tags(photo_seo(p)))
                .replace("{{HEAD}}", head).replace("{{HEADER}}", nav).replace("{{FOOTER}}", footer)
                .replace("{{PHOTO_LD}}", photo_ld(p)).replace("{{PHOTO_BODY}}", photo_body(p, prev, nxt)))
        html = versioned(root_relative(html))
        name = photo_path(p)[:-5]  # "photos/<slug>"
        html = stamp(name, html, state)
        with open(os.path.join(ROOT, name + ".html"), "w", encoding="utf-8", newline="\n") as f:
            f.write(html + "\n")
        expected.add(os.path.basename(name) + ".html")
    for stale in os.listdir(os.path.join(ROOT, "photos")):  # remove pages of photos no longer published
        if stale.endswith(".html") and stale not in expected:
            os.remove(os.path.join(ROOT, "photos", stale))
            state.pop("photos/" + stale[:-5], None)
    print("built %d photo pages" % len(expected))


def build_llms_txt():
    """llms.txt for AI assistants, with a generated list of every photograph."""
    lines = []
    for p in portfolio_photos():
        lines.append("- [%s](%s%s): %s. Image: %s%s" % (
            photo_heading(p), SITE, photo_path(p), p["alt"], SITE, display_src(p)))
    text = read("llms.txt").replace("{{PHOTO_LIST}}", "\n".join(lines))
    with open(os.path.join(ROOT, "llms.txt"), "w", encoding="utf-8", newline="\n") as f:
        f.write(text + "\n")
    print("built llms.txt")


LASTMOD_FILE = os.path.join(HERE, "lastmod.json")
TIMEZONE = "Asia/Beirut"
DATE_PLACEHOLDER = "{{DATE_MODIFIED}}"


def load_lastmod():
    try:
        with open(LASTMOD_FILE, encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return {}


def save_lastmod(state):
    with open(LASTMOD_FILE, "w", encoding="utf-8", newline="\n") as f:
        json.dump(state, f, indent=2, sort_keys=True)
        f.write("\n")


def now_iso():
    """Current time as a full ISO 8601 datetime with timezone offset, as
    required by Google for dateModified (e.g. 2026-10-23T14:05:00+03:00)."""
    from zoneinfo import ZoneInfo
    return datetime.datetime.now(ZoneInfo(TIMEZONE)).replace(microsecond=0).isoformat()


def full_datetime(value):
    """Upgrade a legacy date-only value (YYYY-MM-DD) to a full datetime."""
    return value if "T" in value else value + "T00:00:00+03:00"


def stamp(name, html, state):
    """Track when a page's content last changed. The hash is taken with the
    {{DATE_MODIFIED}} placeholder still in place, so the date itself never
    counts as a change. Returns the page with the placeholder filled in."""
    digest = hashlib.sha256((html + "\n").encode("utf-8")).hexdigest()
    entry = state.get(name)
    if not entry or entry.get("sha256") != digest:
        entry = {"sha256": digest, "lastmod": now_iso()}
        state[name] = entry
    return html.replace(DATE_PLACEHOLDER, full_datetime(entry["lastmod"]))


def build():
    state = load_lastmod()
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
        leftover = [t for t in re.findall(r"\{\{[A-Z_]+[^}]*\}\}", html) if t != DATE_PLACEHOLDER]
        if leftover:
            raise SystemExit("unexpanded placeholders in %s: %s" % (name, leftover))
        if name == "index":
            html = html.replace('href="/#contact">Contact', 'href="#contact">Contact')
        if name == "404":
            # Served for any missing URL, including nested ones, so use root-relative paths.
            html = root_relative(html)
        html = versioned(html)
        if name in TRACKED or DATE_PLACEHOLDER in html:
            html = stamp(name, html, state)
        with open(os.path.join(ROOT, name + ".html"), "w", encoding="utf-8", newline="\n") as f:
            f.write(html + "\n")
        print("built", name + ".html")
    build_photo_pages(head, header, footer, state)
    save_lastmod(state)
    build_llms_txt()


# Sitemap: every indexable page with the photographs it actually shows.
SITEMAP = [  # (page, priority, change frequency)
    ("index", "1.0", "weekly"),
    ("portfolio", "0.9", "weekly"),
    ("about", "0.9", "monthly"),
    ("order", "0.8", "monthly"),
    ("privacy", "0.3", "yearly"),
    ("terms", "0.3", "yearly"),
]


TRACKED = {name for name, _, _ in SITEMAP}


def page_images(html):
    """Photographs a page exposes to crawlers: every <img> under images/
    (except the logo) plus full-size originals linked from the page."""
    found = []
    candidates = re.findall(r'<img\b[^>]*?\ssrc="/?(images/[^"]+)"', html)
    candidates += re.findall(r'<a class="(?:portfolio-link|photo-frame)" href="/?(images/[^"]+)"', html)
    for src in candidates:
        if not src.endswith("logo.jpg") and src not in found:
            found.append(src)
    return found

def build_sitemap():
    """Write sitemap.xml. Each <lastmod> is the time the page's content last
    changed, as tracked by build() in _src/lastmod.json."""
    state = load_lastmod()
    out = ['<?xml version="1.0" encoding="UTF-8"?>',
           '<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>',
           '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
           '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">']
    entries = [(name, SEO[name]["path"], priority, freq) for name, priority, freq in SITEMAP]
    entries += [(photo_path(p)[:-5], photo_path(p), "0.7", "monthly") for p in portfolio_photos()]
    for name, path, priority, freq in entries:
        with open(os.path.join(ROOT, name + ".html"), encoding="utf-8") as f:
            html = f.read()
        out += ["  <url>",
                "    <loc>%s%s</loc>" % (SITE, path),
                "    <lastmod>%s</lastmod>" % full_datetime(state[name]["lastmod"]),
                "    <changefreq>%s</changefreq>" % freq,
                "    <priority>%s</priority>" % priority]
        for src in page_images(html):
            out += ["    <image:image>", "      <image:loc>%s%s</image:loc>" % (SITE, src), "    </image:image>"]
        out.append("  </url>")
    out.append("</urlset>")
    with open(os.path.join(ROOT, "sitemap.xml"), "w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(out) + "\n")
    print("built sitemap.xml")


if __name__ == "__main__":
    build()
    build_sitemap()
