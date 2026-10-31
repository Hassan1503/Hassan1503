#!/usr/bin/env python3
"""Write the selected-publication list into README.md (the GitHub profile page).

The list comes from assets/data/publications.json — the same file the website
builds its publication section from — so authorship, venues and citation counts
cannot drift between the profile and the site.

The citation-metric table in the same file is handled separately, by
scripts/sync_metrics.py, which the weekly Scholar workflow runs.

Run after editing the publication data:  python3 scripts/build_readme.py
"""
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
PUBS_DATA = ROOT / "assets/data/publications.json"
PAGE = ROOT / "README.md"

SELF = "Hassanuzzaman"
SITE = "https://hassan1503.github.io/Hassan1503/"
# What earns a place on the profile: work he led, work that has been taken up,
# and work from the current year. Everything else is one click away on the site.
RECENT_FROM = 2026
WELL_CITED = 10


def blocks(text: str, name: str, body: str) -> str:
    start, end = "<!-- %s:START -->" % name, "<!-- %s:END -->" % name
    pattern = re.compile(re.escape(start) + r".*?" + re.escape(end), re.S)
    if not pattern.search(text):
        sys.exit("marker pair %s / %s not found in README.md" % (start, end))
    return pattern.sub(lambda _: "%s\n%s\n%s" % (start, body, end), text, count=1)


def mark_authors(authors: str) -> str:
    """Bold the subject's own name; turn Scholar's trailing ellipsis into et al."""
    out = authors.replace(", ...", " et al.").replace("...", "et al.")
    return re.sub(r"(\bM(?:d)?\.?\s+%s\b)" % SELF, r"**\1**", out)


def is_first_author(p: dict) -> bool:
    return re.match(r"\s*M(?:d)?\.?\s+%s\b" % SELF, p.get("authors", "")) is not None


def selected(pubs: list) -> list:
    """First-authored, well cited, or from the current year — newest first."""
    def earns_a_place(p):
        if not p.get("year"):
            return False
        if (p.get("venueFull") or "").strip().lower() in ("", "preprint"):
            return False     # an unidentified preprint is not yet citable
        return (is_first_author(p)
                or (p.get("cited_by") or 0) >= WELL_CITED
                or p["year"] >= RECENT_FROM)

    chosen = [p for p in pubs if earns_a_place(p)]
    return sorted(chosen, key=lambda p: (-p["year"], -(p.get("cited_by") or 0)))


def cite_venue(venue: str) -> str:
    """Italicise the journal or proceedings title only, not volume and pages."""
    head, sep, rest = venue.partition(", ")
    return "*%s*%s%s" % (head, sep, rest)


def entry(p: dict, n: int) -> str:
    parts = ["%s, %d" % (cite_venue(p["venueFull"] or p["scholarVenue"]), p["year"])]
    if p.get("url"):
        parts.append("[paper](%s)" % p["url"])
    cited = p.get("cited_by") or 0
    if cited:
        parts.append("%d citation%s" % (cited, "" if cited == 1 else "s"))
    pad = " " * len("%d. " % n)     # continuation lines stay inside the list item
    return "%d. **%s**  \n%s%s  \n%s%s" % (
        n, p["title"].rstrip("."),
        pad, mark_authors(p["authors"]), pad, " · ".join(parts))


def main() -> int:
    pubs = json.loads(PUBS_DATA.read_text(encoding="utf-8"))
    if isinstance(pubs, dict):
        pubs = pubs.get("publications", [])
    chosen = selected(pubs)

    body = ["Work I led, work with ten or more citations, and work from this year — newest first.",
            "Citation counts come from Google Scholar.",
            "[Full list of %d, with BibTeX, on the site &rarr;](%s#publications)" % (len(pubs), SITE),
            ""]
    body += [entry(p, i) for i, p in enumerate(chosen, 1)]
    text = blocks(PAGE.read_text(encoding="utf-8"), "PUBS", "\n".join(body))


    PAGE.write_text(text, encoding="utf-8")
    print("wrote %s: %d selected publications of %d" % (PAGE.name, len(chosen), len(pubs)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
