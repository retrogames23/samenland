#!/usr/bin/env python3
"""Derive a night light mask from the glass panes of a day painting (run by hand, one file at a time).

Glass = dark, non-green pixels enclosed by light window frames/stone reveals. Frames, glazing bars and reveals stay dark;
only pane pixels light up, with a 1 px soft edge. Optional --only x0,y0,x1,y1 boxes restrict which windows glow;
--skip boxes exclude windows. Writes the mask WebP (same size, alpha-only warm light) and a 4x overlay preview.

usage: derive-night-mask.py DAY.webp OUT.webp [--only x0,y0,x1,y1 ...] [--skip x0,y0,x1,y1 ...] [--preview out.png]
"""
import sys, colorsys
from PIL import Image, ImageFilter

args = sys.argv[1:]
day, out = args[0], args[1]
only, skip, preview = [], [], None
i = 2
while i < len(args):
    if args[i] in ("--only", "--skip"):
        (only if args[i] == "--only" else skip).append(tuple(int(v) for v in args[i + 1].split(","))); i += 2
    elif args[i] == "--preview": preview = args[i + 1]; i += 2
    else: raise SystemExit(f"unknown arg {args[i]}")

im = Image.open(day).convert("RGBA"); W, H = im.size; px = im.load()
L = [[0] * W for _ in range(H)]; dark = [[False] * W for _ in range(H)]; light = [[False] * W for _ in range(H)]
for y in range(H):
    for x in range(W):
        r, g, b, a = px[x, y]
        l = 0.3 * r + 0.59 * g + 0.11 * b; L[y][x] = l
        h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
        green = 0.17 < h < 0.45 and s > 0.18
        dark[y][x] = a > 200 and l < 92 and not green
        light[y][x] = a > 200 and l > 150 and s < 0.35

def framed(x, y, R=4):
    """light frame found on at least three of the four sides within R px"""
    sides = 0
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        for k in range(1, R + 1):
            X, Y = x + dx * k, y + dy * k
            if not (0 <= X < W and 0 <= Y < H): break
            if light[Y][X]: sides += 1; break
    return sides >= 3

inside = lambda x, y, bs: any(b[0] <= x <= b[2] and b[1] <= y <= b[3] for b in bs)
cand = [[dark[y][x] and framed(x, y) and (not only or inside(x, y, only)) and not inside(x, y, skip) for x in range(W)] for y in range(H)]
# keep pane-sized components only
seen = [[False] * W for _ in range(H)]; keep = [[False] * W for _ in range(H)]; panes = 0
for y in range(H):
    for x in range(W):
        if not cand[y][x] or seen[y][x]: continue
        st, comp = [(x, y)], []; seen[y][x] = True
        while st:
            a, b = st.pop(); comp.append((a, b))
            for dx in (-1, 0, 1):
                for dy in (-1, 0, 1):
                    X, Y = a + dx, b + dy
                    if 0 <= X < W and 0 <= Y < H and cand[Y][X] and not seen[Y][X]: seen[Y][X] = True; st.append((X, Y))
        xs = [p[0] for p in comp]; ys = [p[1] for p in comp]; w = max(xs) - min(xs) + 1; h = max(ys) - min(ys) + 1
        if 3 <= len(comp) <= 90 and w <= 12 and h <= 16:
            panes += 1
            for a, b in comp: keep[b][a] = True

mask = Image.new("L", (W, H))
mp = mask.load()
for y in range(H):
    for x in range(W):
        if keep[y][x]: mp[x, y] = 235
mask = Image.composite(mask, mask.filter(ImageFilter.GaussianBlur(0.7)), mask)  # 1 px soft edge, core stays
light_img = Image.new("RGBA", (W, H))
lp = light_img.load(); m = mask.load()
for y in range(H):
    for x in range(W):
        if m[x, y]: lp[x, y] = (255, 196, 110, m[x, y])
light_img.save(out, "WEBP", lossless=True)
print(f"{panes} panes, {sum(map(sum, keep))} px")
if preview:
    base = Image.alpha_composite(Image.new("RGBA", (W, H), (18, 20, 36, 255)), im.point(lambda v: int(v * 0.35)).convert("RGBA"))
    base.putalpha(255)
    Image.alpha_composite(base, light_img).resize((W * 4, H * 4), Image.NEAREST).save(preview)
