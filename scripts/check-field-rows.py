#!/usr/bin/env python3
"""Field row strip lint (scripts/gen-field-rows.py, render.ts drawFieldRows).

  - size 1024x128 RGBA
  - binary coverage (alpha 0 or 255): neighbouring acre tiles may draw the same pixels twice without a seam
  - tiles left-right: the first and last column continue each other as well as any two neighbouring columns do
  - the plants stand on the ground line: the bottom rows are covered
Usage: python3 scripts/check-field-rows.py -> prints JSON {file: [errors]}, exit 1 on failure.
"""
import glob, json, os, sys
import numpy as np
from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), "..", "src", "assets", "terrain")
out = {}
for f in sorted(glob.glob(os.path.join(ROOT, "row-*.webp"))):
    errs = []; im = Image.open(f)
    if im.size != (1024, 128): errs.append(f"size {im.size}")
    a = np.asarray(im.convert("RGBA")).astype(float)
    alpha = a[:, :, 3]
    mid = ((alpha > 0) & (alpha < 255)).mean()
    if mid > 0.01: errs.append(f"translucent pixels {mid:.3f}")
    diffs = np.abs(np.diff(a[:, :, :3] * (alpha[:, :, None] > 0), axis=1)).mean(axis=(0, 2))
    wrap = np.abs(a[:, 0, :3] * (alpha[:, 0, None] > 0) - a[:, -1, :3] * (alpha[:, -1, None] > 0)).mean()
    if wrap > np.percentile(diffs, 99) * 1.5: errs.append(f"seam at wrap {wrap:.1f} vs columns p99 {np.percentile(diffs, 99):.1f}")
    if (alpha[-6:, :] > 0).mean() < 0.6: errs.append("plants do not reach the ground line")
    out[os.path.basename(f)] = errs
print(json.dumps(out))
sys.exit(1 if any(out.values()) else 0)
