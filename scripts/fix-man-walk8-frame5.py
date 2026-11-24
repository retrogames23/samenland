#!/usr/bin/env python3
"""One-off, approved fix of the delivered man-walk8 atlas: frame 5 (index 5) carries an opaque white remnant of the
painting's background between the boots. Only that remnant is changed:

* core: bright, unsaturated pixels (luminance >= 200, channel spread <= 40) connected to each other inside the gap box
  between the boots -> fully transparent;
* fringe: pixels directly touching the core that are still lighter than the boots around them (luminance > 120) are a
  mix of boot and white background -> "un-mixed" against white: colour of the nearest boot pixel, alpha from how much
  darker than white they are. No boot pixel darker than that is touched, nothing outside the box changes.

Writes the atlas back as lossless WebP (exact: every other pixel stays bit-identical).
Run from the repo root: python3 scripts/fix-man-walk8-frame5.py
"""
import numpy as np
from PIL import Image
from scipy import ndimage as nd

PATH = "src/assets/sprites/folk/man-walk8.webp"
FW, FRAME = 160, 5
BOX = (52, 196, 68, 222)  # x0, y0, x1, y1 inside the frame: the gap between the two boots

im = np.array(Image.open(PATH).convert("RGBA")).astype(np.float64)
x0, y0, x1, y1 = BOX
ox = FRAME * FW
sub = im[y0:y1, ox + x0:ox + x1]
rgb, a = sub[..., :3], sub[..., 3]
lum = rgb.mean(-1)
spread = rgb.max(-1) - rgb.min(-1)
core = (a > 200) & (lum >= 200) & (spread <= 40)
lab, n = nd.label(core)
if n:
    sizes = nd.sum(core, lab, range(1, n + 1))
    core = lab == (int(np.argmax(sizes)) + 1)  # the one remnant, not a stray highlight
ring = nd.binary_dilation(core, iterations=1) & ~core & (a > 200) & (lum > 120)
boot = (a > 200) & ~core & ~ring & (lum <= 120)
_, (iy, ix) = nd.distance_transform_edt(~boot, return_indices=True)
before = sub.copy()
for y, x in zip(*np.nonzero(ring)):
    c = rgb[iy[y, x], ix[y, x]]  # nearest boot colour
    bl = c.mean()
    al = np.clip((255 - lum[y, x]) / max(1.0, 255 - bl), 0, 1)  # share of boot in the mix with white
    sub[y, x, :3] = c
    sub[y, x, 3] = round(255 * al)
sub[core] = 0
im[y0:y1, ox + x0:ox + x1] = sub
changed = (np.abs(before - sub).max(-1) > 0)
Image.fromarray(im.clip(0, 255).astype(np.uint8), "RGBA").save(PATH, lossless=True, quality=100, method=6, exact=True)
print(f"frame {FRAME}: {int(core.sum())} remnant pixels transparent, {int(ring.sum())} fringe pixels un-mixed, "
      f"{int(changed.sum())} pixels changed in total, all inside x {x0}-{x1 - 1}, y {y0}-{y1 - 1}")
