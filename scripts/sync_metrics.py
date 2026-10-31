#!/usr/bin/env python3
"""Mirror the Google Scholar metrics into the two places that show them.

assets/data/scholar.json is the source. The site reads it at runtime, but the
numbers also sit in the markup so that a visitor without JavaScript — and the
GitHub profile, which runs none — still sees current figures:

  index.html   the four [data-metric] cards
  README.md    the table inside the SCHOLAR markers

Run by .github/workflows/update-scholar.yml straight after the fetch, so a
successful refresh lands everywhere in one commit.

Usage: python3 scripts/sync_metrics.py
"""
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / "assets/data/scholar.json"
PUBS = ROOT / "assets/data/publications.json"
PAGE = ROOT / "index.html"
PROFILE = ROOT / "README.md"


def read_metrics() -> dict:
    s = json.loads(DATA.read_text(encoding="utf-8"))
    m = s.get("metrics", {})
    # The publication count comes from the curated list, not from Scholar's,
    # so the headline figure always equals the number of entries printed
    # underneath it. Scholar's own count can and does differ.
    curated = json.loads(PUBS.read_text(encoding="utf-8"))
    if isinstance(curated, dict):
        curated = curated.get("publications", [])
    values = {
        "citations": m.get("citations", {}).get("all"),
        "h_index": m.get("h_index", {}).get("all"),
        "i10_index": m.get("i10_index", {}).get("all"),
        "publications": len(curated) or None,
    }
    if any(v is None for v in values.values()):
        sys.exit("scholar.json is missing one of the metrics; nothing written")
    values["updated"] = s.get("updated", "date unknown")
    return values


def sync_page(v: dict) -> bool:
    text = before = PAGE.read_text(encoding="utf-8")
    for key in ("citations", "h_index", "i10_index", "publications"):
        # re.subn, not re.sub: a substitution count of zero means the markup
        # moved and this script is now silently writing nothing, which would
        # otherwise look identical to "the numbers were already correct".
        text, hits = re.subn(r'(data-metric="%s">)[^<]*(</span>)' % key,
                             lambda m: "%s%d%s" % (m.group(1), v[key], m.group(2)), text)
        if hits != 1:
            sys.exit("index.html: expected exactly one [data-metric=\"%s\"] card, found %d"
                     % (key, hits))
    if text == before:
        return False
    PAGE.write_text(text, encoding="utf-8")
    return True


def sync_profile(v: dict) -> bool:
    text = before = PROFILE.read_text(encoding="utf-8")
    table = "\n".join([
        "| Citations | h-index | i10-index | Publications |",
        "|:---------:|:-------:|:---------:|:------------:|",
        "| **%d** | **%d** | **%d** | **%d** |" % (
            v["citations"], v["h_index"], v["i10_index"], v["publications"]),
        "",
        "<sub>Google Scholar, %s. Refreshed weekly by a scheduled workflow in this "
        "repository.</sub>" % v["updated"],
    ])
    pattern = re.compile(r"(<!-- SCHOLAR:START -->).*?(<!-- SCHOLAR:END -->)", re.S)
    if not pattern.search(text):
        sys.exit("SCHOLAR markers not found in README.md")
    text = pattern.sub(lambda m: "%s\n%s\n%s" % (m.group(1), table, m.group(2)), text, count=1)
    if text == before:
        return False
    PROFILE.write_text(text, encoding="utf-8")
    return True


def main() -> int:
    v = read_metrics()
    touched = [name for name, changed in
               (("index.html", sync_page(v)), ("README.md", sync_profile(v))) if changed]
    print("%d citations, h=%d, i10=%d, %d publications (%s) — %s" % (
        v["citations"], v["h_index"], v["i10_index"], v["publications"], v["updated"],
        "updated " + ", ".join(touched) if touched else "already current"))
    return 0


if __name__ == "__main__":
    sys.exit(main())
