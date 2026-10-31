#!/usr/bin/env python3
"""Render the phonocardiogram banner used at the top of the profile README.

Writes a light and a dark SVG of a synthesised heart-sound signal, one per
colour scheme, which the README selects between with prefers-color-scheme.
The trace reads left to right: normal cardiac cycles carrying only S1 and S2,
then cycles in which a systolic murmur fills the silence between them, as a
septal defect would. MURMUR_FROM sets where that change happens, so the number
of cycles on each side follows from it rather than being fixed.

Usage: python3 scripts/build_banner.py
"""
import math
import os

W, H = 1200, 184          # viewBox; scales to whatever width GitHub gives it
BPM = 96                  # paediatric resting rate
CYCLE = 60.0 / BPM
WINDOW = 3.6              # seconds across the full width
PAD_L, PAD_R = 0, 0
MID = 76.0                # baseline y
BASE = 132.0              # floor of the plot area; annotations sit below it

# S1: mitral + tricuspid closure — lower frequency, longer.
# S2: aortic + pulmonary closure — higher frequency, shorter.
S1 = dict(at=0.00, dur=0.11, f1=36, f2=72, amp=1.00, tau=0.030)
S2 = dict(at=0.34, dur=0.08, f1=58, f2=115, amp=0.66, tau=0.020)
MUR = dict(frm=0.11, to=0.33, amp=0.30)

MURMUR_FROM = 2.55        # seconds; the defect appears at this cardiac cycle
RAMP = 0.04               # onset is abrupt, so murmur and shading start together

THEMES = {
    "light": dict(bg="#fcfcfa", rule="#e2e1db", grid="#e7e6e0", trace="#012169",
                  mark="#767d8a", ink="#4a505c", band="#0b6b5e", band_op="0.13"),
    "dark":  dict(bg="#0f1116", rule="#262a33", grid="#23272f", trace="#9db8f0",
                  mark="#6e7482", ink="#a8aeba", band="#5ec8b4", band_op="0.12"),
}


def rnd(t):
    """Deterministic pseudo-noise, so the two themes render the same trace."""
    x = math.sin(t * 12543.7) * 43758.5453
    return (x - math.floor(x)) * 2 - 1


def burst(tc, s):
    u = tc - s["at"]
    if u < 0 or u > s["dur"]:
        return 0.0
    env = math.exp(-u / s["tau"]) * math.sin(math.pi * u / s["dur"])
    return s["amp"] * env * (0.72 * math.sin(2 * math.pi * s["f1"] * u)
                             + 0.28 * math.sin(2 * math.pi * s["f2"] * u))


def murmur_gain(t):
    """0 before the defect appears, reaching full strength shortly after."""
    if t <= MURMUR_FROM:
        return 0.0
    return min(1.0, (t - MURMUR_FROM) / RAMP)


def murmur(tc, t):
    g = murmur_gain(t)
    if g <= 0 or tc < MUR["frm"] or tc > MUR["to"]:
        return 0.0
    span = (tc - MUR["frm"]) / (MUR["to"] - MUR["frm"])
    env = math.sin(math.pi * span)                       # crescendo-decrescendo
    return g * MUR["amp"] * env * (0.6 * rnd(t * 900) + 0.4 * math.sin(2 * math.pi * 170 * t))


def sample(t):
    tc = t % CYCLE
    return burst(tc, S1) + burst(tc, S2) + murmur(tc, t) + 0.018 * rnd(t * 300)


def x_of(t):
    return PAD_L + (t / WINDOW) * (W - PAD_L - PAD_R)


def gain(n):
    """Vertical scale that puts the loudest sound just inside the plot area."""
    peak = max(abs(sample((i / n) * WINDOW)) for i in range(n + 1))
    return (MID - 16.0) / peak * 0.94


def render(theme):
    c = THEMES[theme]
    out = [
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" width="%d" height="%d" '
        'role="img" aria-label="A phonocardiogram: normal cardiac cycles, each with a first and '
        'second heart sound, followed by cycles in which a systolic murmur fills the silence '
        'between them.">' % (W, H, W, H),
        '<rect width="%d" height="%d" fill="%s"/>' % (W, H, c["bg"]),
    ]

    # 0.2 s grid hairlines
    g = 0.0
    while g < WINDOW:
        x = round(x_of(g)) + 0.5
        out.append('<line x1="%.1f" y1="14" x2="%.1f" y2="%.1f" stroke="%s" stroke-width="1"/>'
                   % (x, x, BASE, c["grid"]))
        g += 0.2
    out.append('<line x1="0" y1="%.1f" x2="%d" y2="%.1f" stroke="%s" stroke-width="1"/>'
               % (MID + 0.5, W, MID + 0.5, c["grid"]))

    # shade systole once the murmur is present
    b = 0.0
    while b < WINDOW:
        if murmur_gain(b + (MUR["frm"] + MUR["to"]) / 2) >= 0.5:
            sa, sb = x_of(b + MUR["frm"]), x_of(b + MUR["to"])
            if sb > 0 and sa < W:
                sa, sb = max(sa, 0.0), min(sb, float(W))
                out.append('<rect x="%.1f" y="14" width="%.1f" height="%.1f" fill="%s" opacity="%s"/>'
                           % (sa, sb - sa, BASE - 14, c["band"], c["band_op"]))
        b += CYCLE

    # the trace
    pts, n = [], 1500
    k = gain(n)
    for i in range(n + 1):
        t = (i / n) * WINDOW
        pts.append("%.1f %.1f" % (x_of(t), MID - sample(t) * k))
    out.append('<path d="M%s" fill="none" stroke="%s" stroke-width="1.5" '
               'stroke-linejoin="round" stroke-linecap="round"/>'
               % ("L".join(pts), c["trace"]))

    # S1 / S2 ticks and labels
    mono = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    b = 0.0
    while b < WINDOW:
        for s, name in ((S1, "S1"), (S2, "S2")):
            cx = x_of(b + s["at"] + s["dur"] / 2)
            if cx < 14 or cx > W - 14:
                continue
            out.append('<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="%s" stroke-width="1"/>'
                       % (round(cx) + 0.5, BASE + 2, round(cx) + 0.5, BASE + 7, c["mark"]))
            out.append('<text x="%.1f" y="%.1f" font-family="%s" font-size="14" font-weight="600" '
                       'fill="%s" text-anchor="middle">%s</text>'
                       % (cx, BASE + 22, mono, c["mark"], name))
        b += CYCLE

    # what the two halves of the figure show
    serif = "Georgia, 'Iowan Old Style', 'Times New Roman', serif"
    out.append('<line x1="0" y1="%.1f" x2="%d" y2="%.1f" stroke="%s" stroke-width="1"/>'
               % (H - 29.5, W, H - 29.5, c["rule"]))
    out.append('<text x="10" y="%d" font-family="%s" font-size="17" font-style="italic" fill="%s">'
               'Normal heart sounds — S1, silence, S2</text>' % (H - 9, serif, c["ink"]))
    out.append('<text x="%d" y="%d" font-family="%s" font-size="17" font-style="italic" fill="%s" '
               'text-anchor="end">Systolic murmur — a septal defect fills the silence</text>'
               % (W - 10, H - 9, serif, c["ink"]))
    out.append('</svg>')
    return "\n".join(out) + "\n"


def main():
    os.makedirs("assets/img", exist_ok=True)
    for theme in THEMES:
        path = "assets/img/pcg-banner-%s.svg" % theme
        with open(path, "w", encoding="utf-8") as fh:
            fh.write(render(theme))
        print("wrote %s (%.1f KB)" % (path, os.path.getsize(path) / 1024))


if __name__ == "__main__":
    main()
