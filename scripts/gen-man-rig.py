#!/usr/bin/env python3
"""P6: cut the reference villager (man-walk8, frame 0) into rig parts for a skeletal walk cycle.

Every part keeps the painted pixels of the original frame (no repainting); parts are stored in one atlas, one
160×240 cell per part in the frame's own coordinates, so a pivot measured on the frame is valid in every cell.
Joints are cut round (a disc around the joint stays on both neighbouring parts), the thighs are extended upward
under the tunic, so bending never opens a gap. Writes src/assets/sprites/folk/man-rig.webp and
src/game/man-rig-data.ts. Run from the repo root: python3 scripts/gen-man-rig.py
"""
import json, math
import numpy as np
from PIL import Image, ImageDraw

SRC = "src/assets/sprites/folk/man-walk8.webp"
W, H = 160, 240
fr = np.array(Image.open(SRC).convert("RGBA").crop((0, 0, W, H))).astype(np.float32)
A = fr[..., 3] > 8
yy, xx = np.mgrid[0:H, 0:W]

# ---- annotated joints of frame 0 (source px) ----
J = {
    "far":  {"hip": (64, 128), "knee": (44, 182), "ankle": (30, 218), "heel": (16, 229), "toe": (50, 236)},
    "near": {"hip": (80, 128), "knee": (98, 182), "ankle": (111, 218), "heel": (110, 236), "toe": (142, 212)},
    "armFar":  {"shoulder": (49, 64), "elbow": (37, 102), "wrist": (33, 124), "tip": (30, 146)},
    "armNear": {"shoulder": (91, 64), "elbow": (104, 98), "wrist": (118, 114), "tip": (128, 132)},
}
ARM_POLY = {
    "armFar": [(57, 54), (58, 70), (56, 84), (54, 96), (55, 104), (52, 112), (44, 125), (43, 150), (16, 150), (20, 125), (27, 100), (30, 88), (38, 72), (46, 58)],
    "armNear": [(85, 56), (93, 56), (101, 70), (105, 82), (113, 93), (130, 110), (134, 126), (127, 136), (116, 134), (109, 118), (100, 109), (93, 104), (91, 95), (89, 80), (85, 66)],
}

def poly_mask(pts):
    im = Image.new("L", (W, H), 0); ImageDraw.Draw(im).polygon(pts, fill=1); return np.array(im).astype(bool)

def seg_t(p0, p1):
    """Projection parameter (px along the segment) and distance to the infinite line for every pixel."""
    ax, ay = p0; dx, dy = p1[0] - p0[0], p1[1] - p0[1]; L = math.hypot(dx, dy); ux, uy = dx / L, dy / L
    t = (xx - ax) * ux + (yy - ay) * uy; d = np.abs(-(xx - ax) * uy + (yy - ay) * ux)
    return t, d, L


def dist(p): return np.hypot(xx - p[0], yy - p[1])
arm = {k: A & poly_mask(v) for k, v in ARM_POLY.items()}
# the shoulder cap stays on the torso (the arm turns under it): rotating a painted cap made it poke out as a spike
for k in arm: sh = J[k]["shoulder"]; arm[k] &= ~((dist(sh) <= 11) & (yy <= sh[1] + 3))
rest = A & ~arm["armFar"] & ~arm["armNear"]
r, g, b = fr[..., 0], fr[..., 1], fr[..., 2]
# the tunic is warm brown linen, the trousers a cool grey-brown: the hem is where the warm, connected body ends
from scipy import ndimage
warm = rest & ((r - b > 52) | (yy < 134)) & (yy < 156)
lab, _ = ndimage.label(warm); torso = lab == lab[100, 72]
torso = ndimage.binary_closing(torso, iterations=1) & rest
legs = rest & ~torso & (yy >= 128)

# legs: each pixel to the nearer leg axis (hip → knee → ankle → toe)
def leg_dist(j):
    d1 = seg_dist(j["hip"], j["knee"]); d2 = seg_dist(j["knee"], j["ankle"]); d3 = seg_dist(j["ankle"], j["toe"]); d4 = seg_dist(j["ankle"], j["heel"])
    return np.minimum(np.minimum(d1, d2), np.minimum(d3, d4))
def seg_dist(p0, p1):
    t, d, L = seg_t(p0, p1); tc = np.clip(t, 0, L)
    ax, ay = p0; ux, uy = (p1[0] - ax) / L, (p1[1] - ay) / L
    return np.hypot(xx - (ax + ux * tc), yy - (ay + uy * tc))
farLeg = legs & (leg_dist(J["far"]) <= leg_dist(J["near"]))
nearLeg = legs & ~farLeg

parts = {}
RK, RA = 10.0, 7.0  # knee / elbow disc radius (px)
for side, m in (("far", farLeg), ("near", nearLeg)):
    j = J[side]
    t1, _, L1 = seg_t(j["hip"], j["knee"]); t2, _, L2 = seg_t(j["knee"], j["ankle"])
    thigh = m & ((t1 <= L1) | (dist(j["knee"]) <= RK)) & (t2 <= RK * 0.5)
    shin = m & ((t2 >= 0) | (dist(j["knee"]) <= RK)) & (t2 <= L2 + 1)
    foot = m & (t2 >= L2 - 7)
    parts[side + "Thigh"], parts[side + "Shin"], parts[side + "Foot"] = thigh, shin, foot
for side in ("armFar", "armNear"):
    j, m = J[side], arm[side]
    t1, _, L1 = seg_t(j["shoulder"], j["elbow"]); t2, _, _ = seg_t(j["elbow"], j["wrist"])
    parts[side + "Upper"] = (m & ((t1 <= L1) | (dist(j["elbow"]) <= RA))) | (A & (dist(j["shoulder"]) <= 8))  # round top
    parts[side + "Lower"] = m & ((t2 >= 0) | (dist(j["elbow"]) <= RA))
# the cut where an arm lay along the body leaves its sleeve highlight on the torso edge: shave that seam
from scipy import ndimage as nd
cut = nd.binary_dilation(arm["armFar"] | arm["armNear"], iterations=2) & torso & ~nd.binary_erosion(torso, iterations=2)
seam = fr.copy(); seam[cut, :3] *= 0.78
fr_torso = seam
parts["torso"] = torso

ORDER = ["torso", "armFarUpper", "armFarLower", "armNearUpper", "armNearLower", "farThigh", "farShin", "farFoot", "nearThigh", "nearShin", "nearFoot"]
cells = []
for name in ORDER:
    m = parts[name]; cell = np.zeros((H, W, 4), np.float32); src = fr_torso if name == "torso" else fr; cell[m] = src[m]
    cells.append(cell)

# thighs: extend the top edge upward along the thigh axis to above the hip, hidden under the tunic, so a swinging
# thigh never opens a wedge below the hem
for side in ("far", "near"):
    ci = ORDER.index(side + "Thigh"); cell = cells[ci]; j = J[side]
    ux, uy = (j["knee"][0] - j["hip"][0]), (j["knee"][1] - j["hip"][1]); L = math.hypot(ux, uy); ux, uy = ux / L, uy / L
    a = cell[..., 3] > 200; ys, xs = np.nonzero(a)  # only solid pixels feed the extension (no fringe colours)
    for x0, y0 in zip(xs, ys):
        # walk from each pixel against the axis; fill while outside the piece (only above the hem region)
        for s in range(1, 26):
            x = int(round(x0 - ux * s)); y = int(round(y0 - uy * s))
            if x < 0 or y < 0 or x >= W or y >= H or y < j["hip"][1] - 10: break
            if cell[y, x, 3] > 8: continue
            if not (torso[y, x] or y < j["hip"][1] + 4): continue  # only where the tunic will cover it
            cell[y, x] = cell[y0, x0]

# far side darker (it is in shadow behind the body)
for name in ("armFarUpper", "armFarLower", "farThigh", "farShin", "farFoot"):
    c = cells[ORDER.index(name)]; c[..., :3] *= 0.86

# limbs: shave the 1 px anti-aliasing halo of the original outline (light, half-transparent dots that show as a
# dotted seam once the limb moves away from where it was painted)
for name in ORDER[1:]:
    cell = cells[ORDER.index(name)]; a = cell[..., 3] > 8
    rim = a & ~nd.binary_erosion(a, iterations=1)
    lum = cell[..., :3].mean(axis=2); med = nd.median_filter(np.where(a, lum, 0), 5)
    cell[rim & ((cell[..., 3] < 200) | (lum > med + 25))] = 0
# drop stray fringe: pixels that are faint or nearly alone in their 5×5 neighbourhood
for cell in cells:
    a = cell[..., 3] > 8; n = nd.uniform_filter(a.astype(np.float32), 5) * 25
    cell[(a & (n < 7)) | (cell[..., 3] < 40)] = 0
atlas = np.concatenate(cells, axis=1).clip(0, 255).astype(np.uint8)
Image.fromarray(atlas, "RGBA").save("src/assets/sprites/folk/man-rig.webp", lossless=True, quality=100, method=6)

def ang(p0, p1): return math.atan2(p1[1] - p0[1], p1[0] - p0[0])
data = {"cell": [W, H], "ground": 236, "parts": ORDER, "joints": J,
        "rest": {
            "farThigh": ang(J["far"]["hip"], J["far"]["knee"]), "farShin": ang(J["far"]["knee"], J["far"]["ankle"]), "farFoot": ang(J["far"]["heel"], J["far"]["toe"]),
            "nearThigh": ang(J["near"]["hip"], J["near"]["knee"]), "nearShin": ang(J["near"]["knee"], J["near"]["ankle"]), "nearFoot": ang(J["near"]["heel"], J["near"]["toe"]),
            "armFarUpper": ang(J["armFar"]["shoulder"], J["armFar"]["elbow"]), "armFarLower": ang(J["armFar"]["elbow"], J["armFar"]["wrist"]),
            "armNearUpper": ang(J["armNear"]["shoulder"], J["armNear"]["elbow"]), "armNearLower": ang(J["armNear"]["elbow"], J["armNear"]["wrist"])}}
with open("src/game/man-rig-data.ts", "w") as f:
    f.write("/** Generated by scripts/gen-man-rig.py from man-walk8 frame 0 — joints in source px of a 160×240 cell. Do not edit. */\n")
    f.write("export const MAN_RIG = " + json.dumps(data) + " as const;\n")
print("ok", atlas.shape, {k: int(v.sum()) for k, v in parts.items()})
