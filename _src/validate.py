#!/usr/bin/env python3
"""Validate the built website. Standard library only.

Usage:
    python3 _src/build.py          # build first
    python3 _src/validate.py       # then validate (exit code 1 on any failure)
    python3 _src/validate.py --inventory   # also write _reports/image-inventory.csv

Checks:
  1. Generated pages are in sync with _src/ templates (rebuild changes nothing).
  2. Original photographs are byte-identical to the fingerprints in photos.json.
  3. Every local href/src/srcset/CSS url() resolves; every #anchor exists.
  4. Every <img> has an alt attribute; meaningful images have descriptive alt.
  5. JSON-LD parses; ImageObject contentUrl/thumbnailUrl files exist.
  6. sitemap.xml parses; page URLs equal the canonical URLs; image URLs exist.
  7. Canonical, robots meta and noindex rules are as intended.
  8. robots.txt never blocks search crawlers; /images/ only for AI training bots.
  9. Forms keep the Formspree endpoint, honeypot and required consent.
 10. No inline executable scripts or third-party script/style sources (CSP).
 11. CSS/JS links carry the current cache-busting VERSION.
"""
import csv
import glob
import hashlib
import json
import os
import re
import subprocess
import sys
import xml.dom.minidom
from html.parser import HTMLParser

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SITE = "https://kamilsalamehphotography.com/"
FORMSPREE = "https://formspree.io/f/mgawakay"

failures = []
notes = []


def fail(msg):
    failures.append(msg)


def rel(url):
    """Local file path for a site URL or relative reference (None if external)."""
    if url.startswith(SITE):
        url = url[len(SITE):]
    elif re.match(r"^[a-z]+:", url) or url.startswith("//"):
        return None
    path = url.split("#")[0].split("?")[0].lstrip("/")
    return path or "index.html"


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids, self.refs, self.imgs, self.scripts, self.forms = set(), [], [], [], []
        self._script = None
        self.metas, self.links = [], []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if "id" in a:
            self.ids.add(a["id"])
        for k in ("href", "src", "data-full"):
            if a.get(k):
                self.refs.append(a[k])
        if a.get("srcset"):
            self.refs += [part.strip().split()[0] for part in a["srcset"].split(",")]
        if tag == "img":
            self.imgs.append(a)
        if tag == "script":
            self._script = a
            self.scripts.append(a)
        if tag == "form":
            self.forms.append({"attrs": a, "inputs": []})
        if tag in ("input", "textarea", "select") and self.forms:
            self.forms[-1]["inputs"].append(dict(a, _tag=tag))
        if tag == "meta":
            self.metas.append(a)
        if tag == "link":
            self.links.append(a)

    def handle_data(self, data):
        if self._script is not None:
            self._script.setdefault("_body", "")
            self._script["_body"] += data

    def handle_endtag(self, tag):
        if tag == "script":
            self._script = None


def load(path):
    with open(os.path.join(ROOT, path), encoding="utf-8") as f:
        return f.read()


def check_build_sync():
    pages = sorted(glob.glob(os.path.join(ROOT, "*.html"))) + [os.path.join(ROOT, "sitemap.xml")]
    before = {p: open(p, "rb").read() for p in pages}
    subprocess.run([sys.executable, os.path.join(HERE, "build.py")], check=True, capture_output=True)
    changed = [os.path.basename(p) for p in pages if open(p, "rb").read() != before[p]]
    if changed:
        fail("generated files were out of sync with _src/ (now rebuilt, review and commit): %s" % changed)


def check_originals(photos):
    for p in photos:
        path = os.path.join(ROOT, p["original"])
        if not os.path.exists(path):
            fail("original missing: " + p["original"])
            continue
        digest = hashlib.sha256(open(path, "rb").read()).hexdigest()
        if digest != p.get("original_sha256"):
            fail("ORIGINAL PHOTOGRAPH MODIFIED: %s (fingerprint mismatch)" % p["original"])


def check_pages(photos):
    parsed = {}
    for path in sorted(glob.glob(os.path.join(ROOT, "*.html"))):
        name = os.path.basename(path)
        page = Page()
        page.feed(load(name))
        parsed[name] = page

    meaningful_alts = {p["alt"] for p in photos if p.get("alt")}
    for name, page in parsed.items():
        # 3. references
        for ref in page.refs:
            if ref.startswith(("mailto:", "data:")) or ref == "#":
                continue
            path = rel(ref)
            if path is None:
                continue
            if not os.path.exists(os.path.join(ROOT, path)):
                fail("%s: broken reference %s" % (name, ref))
                continue
            frag = ref.split("#")[1] if "#" in ref else ""
            if frag and path.endswith(".html") and frag not in parsed.get(path, page).ids:
                fail("%s: missing anchor %s" % (name, ref))
        # 4. alt text
        for img in page.imgs:
            if "alt" not in img:
                fail("%s: <img> without alt: %s" % (name, img.get("src")))
            elif img["alt"] == "":
                src = img.get("src", "")
                if not (src.endswith("hero-bg.jpg.avif") or src.endswith("logo.png") or img.get("id") == "lightboxImage"):
                    fail("%s: empty alt on meaningful image %s" % (name, src))
            elif "/images/" in "/" + img.get("src", "") and len(img["alt"]) < 25:
                fail("%s: alt text too short to be descriptive: %r" % (name, img["alt"]))
        # 5. JSON-LD
        for s in page.scripts:
            if s.get("type") == "application/ld+json":
                try:
                    data = json.loads(s.get("_body", ""))
                except ValueError as e:
                    fail("%s: invalid JSON-LD: %s" % (name, e))
                    continue
                for url in re.findall(r'"(?:contentUrl|thumbnailUrl)": "([^"]+)"', json.dumps(data)):
                    if not os.path.exists(os.path.join(ROOT, rel(url))):
                        fail("%s: JSON-LD image missing: %s" % (name, url))
        # 7. canonical and robots meta
        canon = [l["href"] for l in page.links if l.get("rel") == "canonical"]
        robots = [m.get("content", "") for m in page.metas if m.get("name") == "robots"]
        if name == "404.html":
            if not robots or "noindex" not in robots[0]:
                fail("404.html should be noindex")
        else:
            if len(canon) != 1:
                fail("%s: expected exactly one canonical, found %d" % (name, len(canon)))
            if any("noindex" in r for r in robots):
                fail("%s: unexpectedly marked noindex" % name)
        # 9. forms
        for form in page.forms:
            a = form["attrs"]
            names = {i.get("name") for i in form["inputs"]}
            if a.get("action") != FORMSPREE:
                fail("%s: form action changed: %s" % (name, a.get("action")))
            if "_gotcha" not in names:
                fail("%s: form honeypot missing" % name)
            consent = [i for i in form["inputs"] if i.get("type") == "checkbox" and "required" in i]
            if not consent:
                fail("%s: required consent checkbox missing" % name)
        # 10. CSP-safe scripts
        for s in page.scripts:
            if s.get("type") == "application/ld+json":
                continue
            src = s.get("src")
            if not src:
                fail("%s: inline <script> would be blocked by the CSP" % name)
            elif rel(src) is None:
                fail("%s: third-party script %s" % (name, src))
        for l in page.links:
            if l.get("rel") == "stylesheet" and rel(l["href"]) is None:
                fail("%s: third-party stylesheet %s" % (name, l["href"]))
        # 11. cache-busting versions
        version = re.search(r'VERSION = "([^"]+)"', load("_src/build.py")).group(1)
        for ref in page.refs:
            if re.search(r"(style\.css|[a-z]+\.js)(\?|$)", ref) and not ref.endswith("?v=" + version) and rel(ref):
                fail("%s: asset without current version tag: %s" % (name, ref))
    return parsed


def check_css():
    css = load("style.css")
    for url in re.findall(r"url\([\"']?([^\"')]+)", css):
        if url.startswith(("data:", "#", "%23")):  # inline data or in-document SVG reference
            continue
        if not os.path.exists(os.path.join(ROOT, url)):
            fail("style.css: broken url(%s)" % url)


def check_sitemap(parsed):
    doc = xml.dom.minidom.parse(os.path.join(ROOT, "sitemap.xml"))
    locs = [n.firstChild.data for n in doc.getElementsByTagName("loc")]
    canonicals = set()
    for name, page in parsed.items():
        for l in page.links:
            if l.get("rel") == "canonical":
                canonicals.add(l["href"])
    if set(locs) != canonicals:
        fail("sitemap URLs differ from canonical URLs: extra=%s missing=%s"
             % (sorted(set(locs) - canonicals), sorted(canonicals - set(locs))))
    for n in doc.getElementsByTagName("image:loc"):
        if not os.path.exists(os.path.join(ROOT, rel(n.firstChild.data))):
            fail("sitemap image missing: " + n.firstChild.data)
    return len(locs), len(doc.getElementsByTagName("image:loc"))


def check_robots():
    groups, current, agents = [], None, []
    for line in load("robots.txt").splitlines():
        line = line.split("#")[0].strip()
        if not line:
            continue
        key, _, value = line.partition(":")
        key, value = key.strip().lower(), value.strip()
        if key == "user-agent":
            if current is not None:
                groups.append(current)
                current, agents = None, []
            agents.append(value)
        elif key in ("allow", "disallow"):
            if current is None:
                current = {"agents": agents, "rules": []}
            current["rules"].append((key, value))
    if current:
        groups.append(current)
    training = {"GPTBot", "ClaudeBot", "Google-Extended", "Applebot-Extended", "CCBot", "meta-externalagent"}
    for g in groups:
        for key, value in g["rules"]:
            if key == "disallow" and value:
                if value != "/images/" or not set(g["agents"]) <= training:
                    fail("robots.txt: unexpected Disallow %s for %s" % (value, g["agents"]))
    if "Sitemap: %ssitemap.xml" % SITE not in load("robots.txt"):
        fail("robots.txt: sitemap declaration missing")


def write_inventory(photos, parsed):
    os.makedirs(os.path.join(ROOT, "_reports"), exist_ok=True)
    sys.path.insert(0, HERE)
    import build  # noqa: E402  (reuse the dimension reader)
    rows = []
    for p in photos:
        variants = [p["original"]]
        if p.get("slug"):
            variants += ["images/thumbs/%s.jpg" % p["slug"], "images/web/%s.jpg" % p["slug"]]
        refs = sorted({name for name, page in parsed.items()
                       for ref in page.refs for v in variants if rel(ref) == v})
        w, h = build.image_size(p["original"])
        rows.append({
            "id": p["id"],
            "original": p["original"],
            "original_bytes": os.path.getsize(os.path.join(ROOT, p["original"])),
            "width": w, "height": h, "aspect_ratio": "%.3f" % (w / h),
            "colour": "HDR (PQ, BT.2020)" if p.get("hdr") else "BT.2020 nclx",
            "thumb_600": variants[1] if len(variants) > 1 else "",
            "web_1200": variants[2] if len(variants) > 2 else "",
            "web_1200_bytes": os.path.getsize(os.path.join(ROOT, variants[2])) if len(variants) > 2 else "",
            "used_on": " ".join(refs),
            "title": p.get("title") or "",
            "place": p.get("place") or "",
            "alt": p.get("alt") if p.get("alt") is not None else "",
            "in_portfolio_structured_data": "yes" if p.get("portfolio") else "no",
            "role": p.get("role", "portfolio photograph" if p.get("portfolio") else ""),
            "subject_evidence": p["evidence"]["subject"],
            "location_evidence": p["evidence"]["location"],
        })
    out = os.path.join(ROOT, "_reports", "image-inventory.csv")
    with open(out, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)
    notes.append("wrote _reports/image-inventory.csv (%d photographs)" % len(rows))


def main():
    photos = json.load(open(os.path.join(HERE, "photos.json"), encoding="utf-8"))["photos"]
    check_build_sync()
    check_originals(photos)
    parsed = check_pages(photos)
    check_css()
    pages, images = check_sitemap(parsed)
    check_robots()
    if "--inventory" in sys.argv:
        write_inventory(photos, parsed)
    print("Checked %d HTML pages, %d sitemap URLs, %d sitemap images, %d original photographs."
          % (len(parsed), pages, images, len(photos)))
    for n in notes:
        print("note:", n)
    if failures:
        print("\nFAILED (%d):" % len(failures))
        for f in failures:
            print("  -", f)
        sys.exit(1)
    print("All checks passed.")


if __name__ == "__main__":
    main()
