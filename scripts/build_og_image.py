#!/usr/bin/env python3
"""Render the Open Graph preview card (assets/og-image.png).

Lays the card out as HTML and screenshots it with headless Chromium, so the
typography matches the site's. The phonocardiogram strip is the same SVG the
profile README uses, keeping one image across site, profile and link previews.

Requires Playwright's Chromium. Usage: python3 scripts/build_og_image.py
"""
import os
import pathlib
import subprocess
import sys
import tempfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
BANNER = ROOT / "assets/img/pcg-banner-light.svg"
OUT = ROOT / "assets/og-image.png"

CARD = """<!doctype html><meta charset="utf-8">
<style>
  @page { size: 1200px 630px; }
  * { margin: 0; box-sizing: border-box; }
  body { width: 1200px; height: 630px; background: #fcfcfa; color: #15181f;
         font-family: 'DejaVu Sans', sans-serif; overflow: hidden; }
  .card { height: 100%; padding: 68px 72px 0; display: flex; flex-direction: column; }
  .eyebrow { font-family: 'DejaVu Sans Mono', monospace; font-size: 19px; letter-spacing: .14em;
             text-transform: uppercase; color: #767d8a; }
  h1 { font-family: 'Bitstream Charter', 'Charter', serif; font-size: 94px; line-height: 1.04;
       letter-spacing: -.022em; margin: 26px 0 0; }
  .role { font-family: 'Bitstream Charter', 'Charter', serif; font-size: 33px; font-style: italic;
          color: #4a505c; margin-top: 20px; }
  .accent { width: 86px; height: 4px; background: #012169; margin-top: 34px; }
  .foot { margin-top: auto; }
  .links { display: flex; justify-content: space-between; align-items: baseline; gap: 36px;
           font-size: 19px; color: #4a505c; padding-bottom: 20px; white-space: nowrap; }
  .links b { color: #012169; font-weight: 600; }
  .strip { width: 100%; display: block; border-top: 1px solid #e2e1db; }
  .strip img { width: 100%; display: block; }
</style>
<div class="card">
  <p class="eyebrow">Duke University &middot; Electrical &amp; Computer Engineering</p>
  <h1>Md Hassanuzzaman</h1>
  <p class="role">PhD Candidate &middot; Machine learning for physiological signals</p>
  <div class="accent"></div>
  <div class="foot">
    <p class="links"><span>Congenital heart disease screening &middot; Clinical foundation models</span>
      <b>hassan1503.github.io/Hassan1503</b></p>
    <div class="strip"><img src="BANNER_SRC" alt=""></div>
  </div>
</div>
"""

SHOT = """
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await p.goto('file://' + process.argv[2]);
  await p.waitForTimeout(500);
  await p.screenshot({ path: process.argv[3] });
  await b.close();
})();
"""


def main() -> int:
    if not BANNER.exists():
        sys.exit("missing %s — run scripts/build_banner.py first" % BANNER)
    with tempfile.TemporaryDirectory() as tmp:
        tmp = pathlib.Path(tmp)
        (tmp / "card.html").write_text(CARD.replace("BANNER_SRC", BANNER.as_uri()), encoding="utf-8")
        (tmp / "shot.js").write_text(SHOT, encoding="utf-8")
        env = dict(os.environ)
        # Playwright installed globally rather than beside this script.
        env.setdefault("NODE_PATH", "/opt/node22/lib/node_modules")
        r = subprocess.run(["node", str(tmp / "shot.js"), str(tmp / "card.html"), str(OUT)],
                           env=env, capture_output=True, text=True)
        if r.returncode:
            sys.exit("chromium render failed:\n%s" % (r.stderr or r.stdout))
    print("wrote %s (%.0f KB)" % (OUT, OUT.stat().st_size / 1024))
    return 0


if __name__ == "__main__":
    sys.exit(main())
