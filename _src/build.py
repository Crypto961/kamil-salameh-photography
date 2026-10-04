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
import os
import re

VERSION = "20261004b"

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
        image_alt="Neowise comet over Kfardebian, Lebanon, photographed by Kamil Salameh",
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
        if name == "index":
            html = html.replace('href="index.html#contact">Contact', 'href="#contact">Contact')
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


def build_sitemap():
    today = datetime.date.today().isoformat()
    out = ['<?xml version="1.0" encoding="UTF-8"?>',
           '<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>',
           '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
           '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">']
    for name, priority, freq in SITEMAP:
        with open(os.path.join(ROOT, name + ".html"), encoding="utf-8") as f:
            html = f.read()
        images = []
        for src in re.findall(r'<img[^>]+src="(images/[^"]+\.avif)"', html):
            if src not in images:
                images.append(src)
        out += ["  <url>",
                "    <loc>%s%s</loc>" % (SITE, SEO[name]["path"]),
                "    <lastmod>%s</lastmod>" % today,
                "    <changefreq>%s</changefreq>" % freq,
                "    <priority>%s</priority>" % priority]
        for src in images:
            out += ["    <image:image>", "      <image:loc>%s%s</image:loc>" % (SITE, src), "    </image:image>"]
        out.append("  </url>")
    out.append("</urlset>")
    with open(os.path.join(ROOT, "sitemap.xml"), "w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(out) + "\n")
    print("built sitemap.xml")


if __name__ == "__main__":
    build()
    build_sitemap()
