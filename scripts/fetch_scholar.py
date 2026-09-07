#!/usr/bin/env python3
"""Fetch citation metrics and per-paper "Cited by" counts from a public
Google Scholar profile and write them to assets/data/scholar.json.

Runs on a GitHub Actions runner (see .github/workflows/update-scholar.yml).
Uses only the standard library so it needs no installs. If Scholar serves a
block/CAPTCHA page or the markup can't be parsed, exits non-zero WITHOUT
touching the JSON, so the site keeps showing the last good numbers.
"""
import html
import json
import os
import re
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone

USER_ID = os.environ.get("SCHOLAR_USER", "q1ppZrsAAAAJ")
OUT = os.environ.get("SCHOLAR_OUT", "assets/data/scholar.json")
# Several request shapes are tried in turn; Scholar sometimes refuses one
# variant from a given network while serving another.
URLS = [
    "https://scholar.google.com/citations?user=%s&hl=en&view_op=list_works&sortby=pubdate&cstart=0&pagesize=100" % USER_ID,
    "https://scholar.google.com/citations?user=%s&hl=en&pagesize=100" % USER_ID,
    "https://scholar.google.com/citations?hl=en&user=%s" % USER_ID,
]
UAS = [
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
]
BLOCKED = "blocked"


def fetch_one(url, ua):
    req = urllib.request.Request(url, headers={
        "User-Agent": ua,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
    })
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode("utf-8", "replace")


def fetch(url=None):
    """Return the profile HTML, or BLOCKED if every variant is refused.
    Raises on non-HTTP errors (network down etc.)."""
    last = None
    for ua in UAS:
        for u in ([url] if url else URLS):
            try:
                return fetch_one(u, ua)
            except urllib.error.HTTPError as exc:
                last = exc
                if exc.code not in (403, 429, 503):
                    raise
                print("  %s -> HTTP %s (%s)" % (u.split("?")[0], exc.code, ua.split(" ")[0]), file=sys.stderr)
    print("all request variants refused (last: HTTP %s)" % (last.code if last else "?"), file=sys.stderr)
    return BLOCKED


def text(fragment):
    return html.unescape(re.sub(r"<[^>]+>", "", fragment)).strip()


def parse_metrics(page):
    # The profile's "Cited by" table: three rows (Citations, h-index,
    # i10-index), each with an "All" and a "Since <year>" cell.
    table = re.search(r'<table id="gsc_rsb_st".*?</table>', page, re.S)
    if not table:
        return None
    rows = re.findall(r"<tr>(.*?)</tr>", table.group(0), re.S)
    since_year = None
    head = re.search(r'Since (\d{4})', table.group(0))
    if head:
        since_year = int(head.group(1))
    metrics = {}
    for row in rows:
        cells = re.findall(r'<td class="gsc_rsb_(?:sc1|std)">(.*?)</td>', row, re.S)
        if len(cells) < 3:
            continue
        label = text(cells[0]).lower()
        try:
            all_v, since_v = int(text(cells[1])), int(text(cells[2]))
        except ValueError:
            continue
        key = {"citations": "citations", "h-index": "h_index", "i10-index": "i10_index"}.get(label)
        if key:
            metrics[key] = {"all": all_v, "since": since_v}
    if "citations" not in metrics:
        return None
    metrics["since_year"] = since_year
    return metrics


def parse_publications(page):
    pubs = []
    for row in re.findall(r'<tr class="gsc_a_tr">(.*?)</tr>', page, re.S):
        title_m = re.search(r'<a[^>]*class="gsc_a_at"[^>]*>(.*?)</a>', row, re.S)
        if not title_m:
            continue
        grays = re.findall(r'<div class="gs_gray">(.*?)</div>', row, re.S)
        cited_m = re.search(r'<a[^>]*class="gsc_a_ac[^"]*"[^>]*>(.*?)</a>', row, re.S)
        year_m = re.search(r'<span class="gsc_a_h[^"]*">(.*?)</span>', row, re.S)
        cited_txt = text(cited_m.group(1)) if cited_m else ""
        pubs.append({
            "title": text(title_m.group(1)),
            "authors": text(grays[0]) if len(grays) > 0 else "",
            "venue": text(grays[1]) if len(grays) > 1 else "",
            "year": int(text(year_m.group(1))) if year_m and text(year_m.group(1)).isdigit() else None,
            "cited_by": int(cited_txt) if cited_txt.isdigit() else 0,
        })
    return pubs


def main():
    try:
        page = fetch()
    except Exception as exc:  # network / unexpected HTTP error
        print("fetch failed: %s" % exc, file=sys.stderr)
        return 2
    if page == BLOCKED or "gs_captcha" in page or "unusual traffic" in page.lower():
        # Expected from some networks (Scholar refuses many datacenter IPs).
        # Not a bug: warn, keep the last good data, exit clean.
        print("::warning::Google Scholar refused the request (403/CAPTCHA); keeping existing scholar.json.")
        return 0
    metrics = parse_metrics(page)
    pubs = parse_publications(page)
    if not metrics or not pubs:
        print("::error::could not parse profile (metrics=%s, pubs=%d); the page markup may have changed."
              % (bool(metrics), len(pubs)))
        return 4

    data = {
        "source": "Google Scholar",
        "profile_url": "https://scholar.google.com/citations?user=%s&hl=en" % USER_ID,
        "updated": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "metrics": metrics,
        "publications": pubs,
    }
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as fh:
        json.dump(data, fh, indent=2, ensure_ascii=False)
        fh.write("\n")
    print("wrote %s: %d citations, h=%d, i10=%d, %d publications" % (
        OUT, metrics["citations"]["all"], metrics.get("h_index", {}).get("all", 0),
        metrics.get("i10_index", {}).get("all", 0), len(pubs)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
