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


# BibTeX is LaTeX source: these characters change its meaning if left bare.
# The one `&` in the real data ("Medicine & Biology Society") is enough to stop
# an entry typesetting at all.
TEX_ESCAPES = {
    "\\": r"\textbackslash{}", "&": r"\&", "%": r"\%", "$": r"\$", "#": r"\#",
    "_": r"\_", "{": r"\{", "}": r"\}", "~": r"\textasciitilde{}",
    "^": r"\textasciicircum{}", "\u2013": "--", "\u2014": "---",
}
VOLUME = re.compile(r"\bvol\.\s*([0-9]+)", re.I)
NUMBER = re.compile(r"\bno\.\s*([0-9]+)", re.I)
PAGES = re.compile(r"\bpp?\.\s*([0-9]+(?:\s*[\u2013\u2014-]\s*[0-9]+)?)", re.I)
ARXIV = re.compile(r"\barXiv:\s*([0-9]{4}\.[0-9]{4,5}(?:v[0-9]+)?)", re.I)


def tex(value: str) -> str:
    return "".join(TEX_ESCAPES.get(ch, ch) for ch in value)


def bib_authors(raw: str) -> str:
    """Scholar truncates long author lists with an ellipsis. BibTeX's word for
    "and the rest" is the literal `others`; dropping the ellipsis instead would
    present a partial list as though it were complete."""
    text = raw.strip()
    truncated = bool(re.search(r"(\.\.\.|\u2026)\s*$", text))
    text = re.sub(r",?\s*(\.\.\.|\u2026)\s*$", "", text)
    names = [tex(a.strip()) for a in text.split(",") if a.strip()]
    if truncated:
        names.append("others")
    return " and ".join(names)


def split_venue(venue: str):
    """Separate the journal or proceedings title from volume, issue and pages,
    which belong in their own fields rather than folded into the name."""
    head, _, rest = venue.partition(", ")
    extras, leftover = [], rest
    for field, pattern in (("volume", VOLUME), ("number", NUMBER), ("pages", PAGES)):
        m = pattern.search(leftover)
        if not m:
            continue
        value = m.group(1)
        if field == "pages":
            value = re.sub(r"\s*[\u2013\u2014-]\s*", "--", value)
        extras.append((field, value))
        leftover = (leftover[:m.start()] + leftover[m.end():])
    leftover = leftover.strip(" ,")
    # An article number stands in for a page range; a trailing parenthetical at
    # this point is the publisher ("... pp. 275-313 (Wiley)").
    if leftover.isdigit() and not any(k == "pages" for k, _ in extras):
        extras.append(("pages", leftover))
        leftover = ""
    m = re.fullmatch(r"\(([^()]+)\)", leftover)
    if m:
        extras.append(("publisher", m.group(1)))
        leftover = ""
    return head.strip(), extras, leftover


def bibtex(p: dict) -> str:
    btype = BIB_TYPE.get(p["kind"], "misc")
    venue = p["venueFull"] or p["scholarVenue"] or ""
    # Double braces keep the publisher's capitalisation through styles that
    # would otherwise lowercase the title.
    fields = [("author", bib_authors(p["authors"])), ("title", "{%s}" % tex(p["title"]))]

    arxiv = ARXIV.search(venue)
    if arxiv:
        fields += [("eprint", arxiv.group(1)), ("archivePrefix", "arXiv")]
    elif venue:
        name, extras, leftover = split_venue(venue)
        key = {"article": "journal", "inproceedings": "booktitle",
               "incollection": "booktitle"}.get(btype, "howpublished")
        fields.append((key, tex(name)))
        fields += [(k, tex(v)) for k, v in extras]
        if leftover:
            fields.append(("note", tex(leftover)))

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
