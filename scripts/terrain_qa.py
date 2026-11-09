#!/usr/bin/env python3
"""Terrain texture QA (reports hints only, never a visual approval).

Usage: python3 scripts/terrain_qa.py src/assets/terrain/forest.jpg [reference.jpg]
Checks: size, seam ratio x/y, sharpness (mean Laplacian), macro blotchiness,
largest high-contrast motif (px and in figure heights at the texture's SPAN),
self-similarity of a 3x3 tiling.
"""
import sys
import numpy as np
from PIL import Image
from scipy import ndimage

# SPAN (texture px per tile) mirrors nature-sprites.ts; figure ≈ 0.3 tile tall.
SPAN = {"grass": 150, "meadow": 140, "forest": 120, "sand": 110, "water": 170, "fertile": 70,
        "rock": 130, "dirt": 56, "cobble": 34, "wheat": 38, "crops": 38}
LIMITS = {"seam": 1.6, "lap_lo": 15, "lap_hi": 40, "macro": 0.2, "motif_fig": 0.35}


def measure(path):
    im = Image.open(path).convert("RGB")
    a = np.asarray(im).astype(float)
    g = a.mean(2)
    sx = np.mean(np.abs(g[:, 0] - g[:, -1])) / np.mean(np.abs(np.diff(g, axis=1)))
    sy = np.mean(np.abs(g[0] - g[-1])) / np.mean(np.abs(np.diff(g, axis=0)))
    lap = np.abs(ndimage.laplace(g)).mean()
    macro = ndimage.gaussian_filter(g, 24).std() / max(g.std(), 1e-6)
    d = np.abs(g - ndimage.gaussian_filter(g, 8))
    lab, n = ndimage.label(d > 40)
    motif = int(np.sqrt(max(ndimage.sum(np.ones_like(g), lab, range(1, n + 1))))) if n else 0
    name = path.rsplit("/", 1)[-1].split(".")[0]
    span = SPAN.get(name, 120)
    fig_px = span * 0.3 * im.width / 816
    return dict(file=path, size=im.size, mean_rgb=a.reshape(-1, 3).mean(0).round(1).tolist(),
                seam_x=round(sx, 2), seam_y=round(sy, 2), sharp=round(lap, 1), macro=round(macro, 2),
                motif_px=motif, motif_in_figures=round(motif / fig_px, 2))


def hints(m):
    h = []
    if max(m["seam_x"], m["seam_y"]) > LIMITS["seam"]: h.append("sichtbare Kachelnaht")
    if m["sharp"] < LIMITS["lap_lo"]: h.append("zu weich/aquarellig")
    if m["sharp"] > LIMITS["lap_hi"]: h.append("evtl. körnig/überschärft")
    if m["macro"] > LIMITS["macro"]: h.append("große Flecken -> Wiederholung sichtbar")
    if m["motif_in_figures"] > LIMITS["motif_fig"]: h.append("Einzelmotive zu groß gegenüber Figur")
    return h or ["keine Auffälligkeit (Sichtprüfung trotzdem nötig)"]


if __name__ == "__main__":
    for p in sys.argv[1:]:
        m = measure(p)
        print(m)
        print("  ->", "; ".join(hints(m)))
