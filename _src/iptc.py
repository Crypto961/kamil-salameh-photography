#!/usr/bin/env python3
"""Embed IPTC creator, copyright and licensing metadata in every image.

Usage:
    python3 _src/iptc.py            # write metadata (needs ExifTool)
    python3 _src/iptc.py --check    # only report images missing metadata

Requires ExifTool (https://exiftool.org): `brew install exiftool`,
`apt install libimage-exiftool-perl`, or set EXIFTOOL=/path/to/exiftool.

ExifTool edits metadata only; it never re-encodes image data, so the
photographs' pixels and their BT.2020 colour box are untouched (verified when
this was introduced: identical decoded pixels and identical Chromium
rendering). After writing originals, update their fingerprints with
`python3 _src/iptc.py --refingerprint`.

Fields written (the ones Google Images and IPTC Photo Metadata use):
  Creator (XMP dc:creator, IPTC By-line, EXIF Artist)
  Copyright Notice (XMP dc:rights, IPTC CopyrightNotice, EXIF Copyright)
  Credit Line (photoshop:Credit, IPTC Credit)
  Web Statement of Rights (xmpRights:WebStatement), Marked = True
  Licensor name and URL (PLUS), Creator's work URL (IPTC Core contact info)
  Usage Terms (display by search engines/AI assistants permitted with credit)
  Data Mining (PLUS): prohibited for generative AI/ML training
  Title and Description per photograph, from _src/photos.json

Covers every photograph (AVIF originals and JPEG derivatives) and the Open
Graph preview crops. The logo is excluded (AI-generated; see targets()).
"""
import glob
import hashlib
import json
import os
import shutil
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SITE = "https://kamilsalamehphotography.com/"

CREATOR = "Kamil Salameh"
COPYRIGHT = "© Kamil Salameh. All rights reserved."
COMMON = [
    "-XMP-dc:Creator=" + CREATOR,
    "-XMP-dc:Rights=" + COPYRIGHT,
    "-XMP-photoshop:Credit=" + CREATOR,
    "-XMP-xmpRights:Marked=True",
    "-XMP-xmpRights:WebStatement=" + SITE + "terms.html#copyright",
    "-XMP-plus:LicensorName=Kamil Salameh Photography",
    "-XMP-plus:LicensorURL=" + SITE + "order.html",
    "-XMP-iptcCore:CreatorWorkURL=" + SITE,
    # Permission travels with the file: display by search engines and AI
    # assistants is allowed with credit and a link; generative-AI training is not.
    "-XMP-xmpRights:UsageTerms=Display in search results and AI assistant answers is permitted with the credit "
    "\"Photo: Kamil Salameh\" and a link to the photograph's page on kamilsalamehphotography.com. "
    "All other rights reserved. See " + SITE + "terms.html#search-and-ai",
    "-XMP-plus:DataMining=Prohibited for Generative AI/ML training",
    "-EXIF:Artist=" + CREATOR,
    "-EXIF:Copyright=" + COPYRIGHT,
]
# IPTC IIM (legacy block) is only supported in JPEG files.
JPEG_ONLY = [
    "-IPTC:By-line=" + CREATOR,
    "-IPTC:CopyrightNotice=" + COPYRIGHT,
    "-IPTC:Credit=" + CREATOR,
]
# Social preview crops: source photograph id for title/description.
OG_SOURCES = {"home": "belgium", "about": "lebanon", "portfolio": "kfardebian", "prints": "product-photography"}


def exiftool():
    path = os.environ.get("EXIFTOOL") or shutil.which("exiftool")
    if not path:
        sys.exit("ExifTool not found. Install it or set EXIFTOOL=/path/to/exiftool.")
    return ["perl", path] if path.endswith((".pl", "/exiftool")) and not os.access(path, os.X_OK) else [path]


def heading(p):
    if p["place"] == "Product Photography":
        return p["title"]
    return "%s, %s" % (p["title"], p["place"])


def targets():
    photos = json.load(open(os.path.join(HERE, "photos.json"), encoding="utf-8"))["photos"]
    out = []
    for p in photos:
        if not p.get("portfolio"):
            continue
        per = ["-XMP-dc:Title=" + heading(p), "-XMP-dc:Description=" + p["alt"],
               "-XMP-photoshop:Headline=" + heading(p)]
        files = [p["original"]]
        if p.get("slug"):
            files += ["images/thumbs/%s.jpg" % p["slug"], "images/web/%s.jpg" % p["slug"]]
        for f in files:
            iim = ["-IPTC:ObjectName=" + heading(p)[:64], "-IPTC:Caption-Abstract=" + p["alt"]] if f.endswith(".jpg") else []
            out.append((f, per + iim))
    by_id = {p["id"]: p for p in photos}
    for name, pid in OG_SOURCES.items():
        p = by_id[pid]
        out.append(("images/og/%s.jpg" % name, ["-XMP-dc:Title=" + heading(p), "-XMP-dc:Description=" + p["alt"],
                                                 "-IPTC:ObjectName=" + heading(p)[:64], "-IPTC:Caption-Abstract=" + p["alt"]]))
    # images/logo.jpg is deliberately excluded: its existing metadata discloses
    # that it was made with an AI generator (IPTC DigitalSourceType
    # trainedAlgorithmicMedia). That provenance must not be overwritten.
    return out


def has_metadata(path):
    """Standard-library check: the file's XMP packet names the creator and rights."""
    data = open(os.path.join(ROOT, path), "rb").read()
    start = data.find(b"<x:xmpmeta")
    packet = data[start:data.find(b"</x:xmpmeta>", start)] if start >= 0 else b""
    return (b"dc:creator" in packet and CREATOR.encode() in packet
            and b"dc:rights" in packet and b"WebStatement" in packet)


def main():
    if "--check" in sys.argv:
        missing = [f for f, _ in targets() if not has_metadata(f)]
        print("missing metadata:", missing or "none")
        sys.exit(1 if missing else 0)
    if "--refingerprint" in sys.argv:
        path = os.path.join(HERE, "photos.json")
        data = json.load(open(path, encoding="utf-8"))
        for p in data["photos"]:
            p["original_sha256"] = hashlib.sha256(open(os.path.join(ROOT, p["original"]), "rb").read()).hexdigest()
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            f.write("\n")
        print("updated original fingerprints")
        return
    tool = exiftool()
    for f, extra in targets():
        args = tool + ["-q", "-q", "-overwrite_original", "-P", "-codedcharacterset=utf8", "-charset", "iptc=UTF8"]
        args += COMMON + (JPEG_ONLY if f.endswith(".jpg") else []) + extra + [os.path.join(ROOT, f)]
        subprocess.run(args, check=True)
        print("tagged", f)


if __name__ == "__main__":
    main()
