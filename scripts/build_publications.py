#!/usr/bin/env python3
"""Generate the publication list markup in index.html from
assets/data/publications.json.

The list is written into the HTML rather than rendered client-side so the
page is complete without JavaScript and indexable by search engines. Run
after editing the data:  python3 scripts/build_publications.py
"""
import html
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / "assets/data/publications.json"
PAGE = ROOT / "index.html"
START, END = "<!-- PUBS:START -->", "<!-- PUBS:END -->"

SELF = "Hassanuzzaman"
KIND_LABEL = {"journal": "Journal", "conference": "Conference",
              "preprint": "Preprint", "chapter": "Book chapter"}
BIB_TYPE = {"journal": "article", "conference": "inproceedings",
            "preprint": "misc", "chapter": "incollection"}


def mark_authors(authors: str) -> str:
    """Escape the author list and bold the subject's own name."""
    out = html.escape(authors)
    return re.sub(r"(\bM(?:d)?\.?\s+%s\b)" % SELF, r"<b>\1</b>", out)


def bibtex(p: dict) -> str:
    btype = BIB_TYPE.get(p["kind"], "misc")
    authors = " and ".join(
        a.strip() for a in p["authors"].replace(", ...", "").split(",") if a.strip()
    )
    fields = [("author", authors), ("title", p["title"])]
    venue = p["venueFull"] or p["scholarVenue"]
    if btype == "article":
        fields.append(("journal", venue))
    elif btype == "inproceedings":
        fields.append(("booktitle", venue))
    elif btype == "incollection":
        fields.append(("booktitle", venue))
    else:
        fields.append(("howpublished", venue))
    if p["year"]:
        fields.append(("year", str(p["year"])))
    if p.get("url"):
        fields.append(("url", p["url"]))
    width = max(len(k) for k, _ in fields)
    body = ",\n".join("  %-*s = {%s}" % (width, k, v) for k, v in fields)
    return "@%s{%s,\n%s\n}" % (btype, p["key"], body)


def render(p: dict, index: int) -> str:
    year = p["year"] if p["year"] else "n.d."
    year_cls = "" if p["year"] else " is-undated"
    venue = p["venueFull"] or p["scholarVenue"] or "Venue not listed"
    venue_cls = "" if (p["venueFull"] or p["scholarVenue"]) else " is-missing"
    cited = p["cited_by"]
    cite_txt = "1 citation" if cited == 1 else "%d citations" % cited
    cite_hidden = "" if cited else " hidden"

    links = ""
    if p.get("url"):
        label = "arXiv" if "arxiv.org" in p["url"] else ("PDF" if p["url"].endswith("content") else "Link")
        links = ('<a class="pub-link" href="%s" target="_blank" rel="noopener">%s&nbsp;↗</a>'
                 % (html.escape(p["url"]), label))

    note = ('<p class="pub-note">%s</p>' % html.escape(p["note"])) if p.get("note") else ""

    return f"""        <li class="pub" data-kind="{p['kind']}" data-topics="{html.escape(p['topics'])}" data-title="{html.escape(p['title'])}">
          <p class="pub-year{year_cls}">{year}</p>
          <div class="pub-body">
            <h3 class="pub-title">{html.escape(p['title'])}</h3>
            <p class="pub-authors">{mark_authors(p['authors'])}</p>
            <p class="pub-venue{venue_cls}">{html.escape(venue)}</p>
            {note}
            <p class="pub-meta">
              <span class="tag">{KIND_LABEL.get(p['kind'], 'Other')}</span>
              <span class="tag tag-c" data-cites{cite_hidden}>{cite_txt}</span>
              {links}
              <button type="button" class="pub-act" data-bib-toggle aria-expanded="false">BibTeX</button>
            </p>
            <div class="pub-bib" hidden>
              <pre>{html.escape(bibtex(p))}</pre>
              <button type="button" class="btn-s" data-bib-copy>Copy</button>
            </div>
          </div>
        </li>"""


def main() -> int:
    data = json.loads(DATA.read_text())
    pubs = data["publications"]
    markup = "\n".join(render(p, i) for i, p in enumerate(pubs))
    page = PAGE.read_text()
    if START not in page or END not in page:
        print("markers %s / %s not found in index.html" % (START, END), file=sys.stderr)
        return 1
    new = re.sub(
        re.escape(START) + r".*?" + re.escape(END),
        lambda _: "%s\n%s\n      %s" % (START, markup, END),
        page,
        count=1,
        flags=re.S,
    )
    PAGE.write_text(new)
    print("wrote %d publications into index.html" % len(pubs))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
