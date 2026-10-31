#!/usr/bin/env python3
"""Carry per-paper "Cited by" counts from scholar.json into publications.json.

assets/data/scholar.json is refreshed daily from the public Google Scholar
profile, but it holds Scholar's own titles and venues. assets/data/publications.json
is the curated record the site and the profile README are both generated from.
Without this step the four headline metrics moved every day while every
per-paper count stayed frozen at whatever was committed, so README.md
contradicted itself: a table reading 188 citations sitting above a list whose
individual counts no longer summed to anything like it.

Titles are matched on Jaccard similarity over word tokens — the same rule
assets/js/site.js uses for the client-side overlay, so the static markup and
the live page agree on which Scholar entry belongs to which publication.

Usage: python3 scripts/refresh_citations.py
"""
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SCHOLAR = ROOT / "assets/data/scholar.json"
PUBS = ROOT / "assets/data/publications.json"
THRESHOLD = 0.6          # same cut-off as site.js


def tokens(title: str) -> set:
    return {t for t in re.split(r"[^a-z0-9]+", (title or "").lower()) if t}


def similarity(a: str, b: str) -> float:
    ta, tb = tokens(a), tokens(b)
    if not ta or not tb:
        return 0.0
    union = len(ta | tb)
    return len(ta & tb) / union if union else 0.0


def main() -> int:
    if not SCHOLAR.exists():
        print("no scholar.json; nothing to refresh")
        return 0
    scholar = json.loads(SCHOLAR.read_text(encoding="utf-8"))
    entries = [e for e in scholar.get("publications", []) if isinstance(e.get("cited_by"), int)]
    document = json.loads(PUBS.read_text(encoding="utf-8"))
    pubs = document["publications"] if isinstance(document, dict) else document
    if not entries:
        print("scholar.json lists no citation counts; leaving publications.json alone")
        return 0

    changed, unmatched = [], []
    for p in pubs:
        best, score = None, 0.0
        for e in entries:
            s = similarity(p.get("title"), e.get("title"))
            if s > score:
                score, best = s, e
        if not best or score < THRESHOLD:
            unmatched.append(p.get("title", "?"))
            continue
        if p.get("cited_by") != best["cited_by"]:
            changed.append((p.get("title", "?"), p.get("cited_by"), best["cited_by"]))
            p["cited_by"] = best["cited_by"]

    if changed:
        PUBS.write_text(json.dumps(document, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    for title, was, now in changed:
        print("  %s: %s -> %s" % (title[:60], was, now))
    # Not an error: a brand-new paper may not be on the profile yet, and a
    # Scholar entry may be a duplicate the curated list deliberately omits.
    for title in unmatched:
        print("  no Scholar match for %s" % title[:60], file=sys.stderr)
    print("refreshed %d of %d publications (%d unmatched)" % (len(changed), len(pubs), len(unmatched)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
