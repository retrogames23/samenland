#!/usr/bin/env python3
"""Walk-sheet lint (see docs/walk-animation-guide.md).

Checks every painted walk sheet for the faults we kept shipping:
  - frame count: width must split into N equal frames (4 for *-walk4, 6 otherwise)
  - floating / sinking feet: lowest opaque row of every frame on the shared ground line
  - height pumping: figure height per frame within HEIGHT_TOL of the median (bob comes from walkBob only)
  - side jitter: torso centroid (upper 55 %) within DRIFT_TOL of the frame centre
  - morphing torso: upper-body opaque area per frame within AREA_TOL of the median
  - empty / duplicated frames: every frame has content, consecutive frames differ
Usage: python3 scripts/check-walk-sheets.py [files...]  -> prints JSON, exit 1 on failure.
"""
import json, sys, glob
import numpy as np
from PIL import Image

HEIGHT_TOL, DRIFT_TOL, AREA_TOL, GROUND_TOL = 0.06, 0.08, 0.18, 0.02

def frames_of(path):
    return 4 if path.endswith("-walk4.webp") else 6

def check(path):
    a = np.asarray(Image.open(path).convert("RGBA"))[:, :, 3] > 40
    H, W = a.shape
    n = frames_of(path)
    errs = []
    if W % n:
        errs.append(f"width {W} not divisible into {n} frames")
    fw = W // n
    hs, bots, drifts, areas, tiles = [], [], [], [], []
    for i in range(n):
        f = a[:, i * fw:(i + 1) * fw]
        rows = np.where(f.any(1))[0]
        if not len(rows):
            errs.append(f"frame {i} empty"); continue
        top, bot = rows[0], rows[-1]
        h = bot - top + 1
        up = f[top: top + int(h * 0.55)]
        ys, xs = np.nonzero(up)
        hs.append(h); bots.append(bot); areas.append(up.sum()); tiles.append(f)
        drifts.append(abs(xs.mean() / fw - 0.5))
    if hs:
        mh = float(np.median(hs))
        for i, h in enumerate(hs):
            if abs(h - mh) / mh > HEIGHT_TOL: errs.append(f"frame {i} height {h} vs median {mh:.0f}")
        for i, b in enumerate(bots):
            if abs(b - max(bots)) / H > GROUND_TOL: errs.append(f"frame {i} feet float {max(bots) - b}px above ground")
        for i, d in enumerate(drifts):
            if d > DRIFT_TOL: errs.append(f"frame {i} torso off-centre by {d:.0%}")
        ma = float(np.median(areas))
        for i, ar in enumerate(areas):
            if abs(ar - ma) / ma > AREA_TOL: errs.append(f"frame {i} torso area {ar / ma:.0%} of median (morphing)")
        for i in range(len(tiles) - 1):
            if tiles[i].shape == tiles[i + 1].shape and (tiles[i] == tiles[i + 1]).all():
                errs.append(f"frames {i}/{i + 1} identical")
    return errs

def main():
    files = sys.argv[1:] or sorted(glob.glob("src/assets/sprites/**/*-walk*.webp", recursive=True))
    out = {f: check(f) for f in files}
    print(json.dumps(out, indent=1))
    sys.exit(1 if any(out.values()) else 0)

if __name__ == "__main__":
    main()
