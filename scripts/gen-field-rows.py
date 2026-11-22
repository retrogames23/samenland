#!/usr/bin/env python3
"""Painted crop-row strips for the fields (render.ts drawFieldRows).

Each strip is one furrow seen from the game's iso angle: plants stand upright on a ground line at the bottom, the
strip tiles seamlessly left-right and covers ROW_LEN world units of a row (render.ts maps it world-anchored, so rows
continue across tiles). Drawn 4x supersampled with soft, varied strokes (no outlines, no sharpening), then reduced.

    python3 scripts/gen-field-rows.py   -> src/assets/terrain/row-{green,ripe,stubble,furrow}.webp
"""
import math, os, random
from PIL import Image, ImageDraw, ImageFilter

W, H, S = 1024, 128, 4          # final strip size, supersampling
OUT = os.path.join(os.path.dirname(__file__), "..", "src", "assets", "terrain")
BASE = H - 8                     # ground line (final px)


def canvas():
    return Image.new("RGBA", (W * S, H * S), (0, 0, 0, 0))


def jitter(rgb, rnd, amt):
    return tuple(max(0, min(255, int(c + rnd.uniform(-amt, amt)))) for c in rgb)


def wrap_draw(fn, x, *a):
    """Draw at x and its wrapped copies so the strip tiles without a seam."""
    for dx in (-W, 0, W):
        fn(x + dx, *a)


def curve(d, pts, width, col):
    d.line([(px * S, py * S) for px, py in pts], fill=col, width=max(1, int(width * S)), joint="curve")


def bez(p0, p1, p2, n=10):
    return [((1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0], (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1]) for t in (i / n for i in range(n + 1))]


def finish(im, name, blur=0.6):
    im = im.filter(ImageFilter.GaussianBlur(blur * S / 2)).resize((W, H), Image.LANCZOS)
    # binary coverage: neighbouring acre tiles draw the same world-anchored pixels where they overlap, so opaque
    # content can be drawn twice without a trace — translucent content would show every tile seam
    a = im.getchannel("A").point(lambda v: 255 if v >= 128 else 0)
    im.putalpha(a)
    im.save(os.path.join(OUT, f"row-{name}.webp"), "WEBP", quality=88, method=6)
    print("wrote", name, im.size)


def ground_shadow(d, rnd, dark):
    """Soil foot of the row: a soft darker band the plants stand in."""
    for i in range(900):
        x = rnd.uniform(0, W); w = rnd.uniform(6, 18); y = BASE + rnd.uniform(-2, 3)
        for dx in (-W, 0, W):
            d.ellipse([(x + dx - w) * S, (y - 2.5) * S, (x + dx + w) * S, (y + 3.5) * S], fill=jitter(dark, rnd, 10) + (255,))


def canopy(d, rnd, top, col, n=1400):
    """Closed stand behind the plants: soft overlapping strokes from the ground up to the canopy, so no soil shows
    through inside a row — only between rows."""
    for _ in range(n):
        x = rnd.uniform(0, W); h = rnd.uniform(top * 0.75, top); w = rnd.uniform(1.2, 2.6)
        c = jitter(col, rnd, 12) + (255,)
        for dx in (-W, 0, W):
            curve(d, [(x + dx, BASE + 1), (x + dx + rnd.uniform(-2, 2), BASE - h)], w, c)


def ripe():
    rnd = random.Random(11); im = canvas(); d = ImageDraw.Draw(im)
    ground_shadow(d, rnd, (70, 52, 26))
    canopy(d, rnd, 96, (178, 136, 58))
    for layer, (n, hmin, hmax, lum) in enumerate([(760, 86, 104, 0.8), (900, 96, 118, 1.0)]):   # back row darker, front brighter
        for _ in range(n):
            x0 = rnd.uniform(0, W); h = rnd.uniform(hmin, hmax); lean = rnd.uniform(-0.16, 0.16); nod = rnd.uniform(0.25, 0.6) * (1 if lean >= 0 else -1)
            stalk = jitter((int(190 * lum), int(150 * lum), int(70 * lum)), rnd, 14) + (255,)
            ear = jitter((int(230 * lum), int(184 * lum), int(82 * lum)), rnd, 16)
            def plant(x):
                top = (x + lean * h, BASE - h); mid = (x + lean * h * 0.35, BASE - h * 0.55)
                curve(d, bez((x, BASE), mid, top), 1.1, stalk)
                # nodding ear: overlapping spikelets along a short arc, darker underside, light awns
                ex, ey = top
                for k in range(9):
                    t = k / 8; ax = ex + math.sin(nod) * 20 * t; ay = ey - math.cos(nod) * 20 * t + 7 * t * t * abs(nod)
                    for side in (-1, 1):
                        sx = ax + side * 2.6; r = 3.2 - 1.3 * t
                        col = jitter(ear, rnd, 12) if side < 0 else jitter(tuple(int(c * 0.86) for c in ear), rnd, 10)
                        d.ellipse([(sx - r) * S, (ay - r * 1.5) * S, (sx + r) * S, (ay + r * 1.5) * S], fill=col + (255,))
                    if k % 2 == 0:
                        curve(d, [(ax, ay), (ax + math.sin(nod + side * 0.6) * 6, ay - 7)], 0.4, (240, 210, 130, 150))
            wrap_draw(plant, x0)
    finish(im, "ripe")


def green():
    rnd = random.Random(23); im = canvas(); d = ImageDraw.Draw(im)
    ground_shadow(d, rnd, (58, 44, 24))
    canopy(d, rnd, 58, (70, 92, 46), 1100)
    for layer, (n, hmin, hmax, lum) in enumerate([(560, 52, 76, 0.75), (700, 62, 92, 1.0)]):
        for _ in range(n):
            x0 = rnd.uniform(0, W); h = rnd.uniform(hmin, hmax)
            base = (int(rnd.uniform(86, 108) * lum), int(rnd.uniform(112, 134) * lum), int(rnd.uniform(52, 68) * lum))  # muted spring green of the painted map
            def tuft(x):
                for b in range(rnd.randint(3, 5)):
                    a = rnd.uniform(-0.55, 0.55); L = h * rnd.uniform(0.7, 1.0); bend = rnd.uniform(0.15, 0.4) * (1 if a >= 0 else -1)
                    tip = (x + math.sin(a) * L + bend * L * 0.5, BASE - math.cos(a) * L + abs(bend) * L * 0.25)
                    mid = (x + math.sin(a) * L * 0.5, BASE - math.cos(a) * L * 0.6)
                    pts = bez((x, BASE), mid, tip, 8)
                    for i in range(len(pts) - 1):   # blade tapers to the tip, lighter towards it
                        t = i / (len(pts) - 1); col = jitter(tuple(int(c * (0.9 + 0.35 * t)) for c in base), rnd, 6)
                        curve(d, [pts[i], pts[i + 1]], 2.6 * (1 - t) + 0.4, col + (255,))
            wrap_draw(tuft, x0)
    finish(im, "green")


def stubble():
    rnd = random.Random(37); im = canvas(); d = ImageDraw.Draw(im)
    # reaped ground between the stubble rows: pale straw litter over earth, opaque down to the next row
    top = 0
    d.rectangle([0, top * S, W * S, H * S], fill=(176, 146, 92, 255))
    for _ in range(5200):
        x0 = rnd.uniform(0, W); y = rnd.uniform(top, H); L = rnd.uniform(3, 10); a = rnd.uniform(-0.5, 0.5)
        col = jitter((204, 176, 116) if rnd.random() < 0.6 else (120, 92, 56), rnd, 14) + (255,)
        wrap_draw(lambda x: curve(d, [(x, y), (x + math.cos(a) * L, y + math.sin(a) * L * 0.35)], rnd.uniform(0.6, 1.4), col), x0)
    ground_shadow(d, rnd, (110, 84, 46))
    for _ in range(1300):
        x0 = rnd.uniform(0, W); h = rnd.uniform(10, 26); lean = rnd.uniform(-0.25, 0.25)
        col = jitter((214, 182, 112), rnd, 18)
        def stalk(x):
            curve(d, [(x, BASE + 1), (x + lean * h, BASE - h)], 1.0, tuple(int(c * 0.55) for c in col) + (255,))
            curve(d, [(x + lean * h * 0.3, BASE - h * 0.3), (x + lean * h, BASE - h)], 0.8, col + (255,))
        wrap_draw(stalk, x0)
    for _ in range(90):   # loose straw wisps lying across the row
        x0 = rnd.uniform(0, W); a = rnd.uniform(-0.3, 0.3); L = rnd.uniform(10, 22)
        wrap_draw(lambda x: curve(d, [(x, BASE - 2), (x + math.cos(a) * L, BASE - 2 + math.sin(a) * L * 0.3)], 0.7, (232, 206, 140, 200)), x0)
    finish(im, "stubble", 0.5)


def furrow():
    rnd = random.Random(41); im = canvas(); d = ImageDraw.Draw(im)
    d.rectangle([0, (BASE - 4) * S, W * S, H * S], fill=(66, 46, 28, 255))   # the furrow bottom the ridge rises from
    # a turned ridge of soil: dark shaded flank, lit crest, then clods on top
    for _ in range(2200):
        x0 = rnd.uniform(0, W); r = rnd.uniform(4, 9); y = BASE - rnd.uniform(0, 16)
        lit = (y < BASE - 9)
        col = jitter((122, 90, 58) if lit else (74, 52, 32), rnd, 14)
        wrap_draw(lambda x: d.ellipse([(x - r * 1.4) * S, (y - r * 0.7) * S, (x + r * 1.4) * S, (y + r * 0.7) * S], fill=col + (255,)), x0)
    for _ in range(700):
        x0 = rnd.uniform(0, W); r = rnd.uniform(1.8, 4.2); y = BASE - rnd.uniform(10, 21)
        wrap_draw(lambda x: (d.ellipse([(x - r) * S, (y - r * 0.6 + 1) * S, (x + r) * S, (y + r * 0.6 + 1) * S], fill=jitter((60, 40, 24), rnd, 8) + (230,)),
                             d.ellipse([(x - r * 0.8) * S, (y - r * 0.55) * S, (x + r * 0.7) * S, (y + r * 0.35) * S], fill=jitter((150, 114, 76), rnd, 12) + (255,))), x0)
    finish(im, "furrow", 0.7)


if __name__ == "__main__":
    ripe(); green(); stubble(); furrow()
