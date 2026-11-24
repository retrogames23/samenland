#!/usr/bin/env python3
"""P6d: prepares the reference villager (man-walk8, frame 0) for the skeletal walk cycle in walk-rig.ts.

Every pixel stays a painted pixel of the original frame (no repainting). Instead of eleven rigid pieces the figure is
split into five layers that deform continuously:

* legs and arms are "ribbons": each limb is unrolled along its own bone line (hip → knee → ankle, shoulder → elbow →
  wrist → fingertips) into a straight strip; the game rolls the strip back onto the posed bone line in thin bands, so
  knee and elbow bend smoothly instead of hinging two cut-outs (no joint seam);
* the body (head, torso, tunic) is drawn in horizontal rows that the game shifts and widens per row: lean, shoulder
  counter-swing, a head that bobs less than the hips and a tunic hem that trails the thighs;
* feet stay rigid (boots do not bend) and sit under the shin strip; the hanging belt end swings as a small pendulum.

Hidden areas a moving limb uncovers (the back and chest under the arms, the tunic under the belt end, the thigh tops
under the hem) are filled from the surrounding painted pixels. Writes src/assets/sprites/folk/man-rig.webp and
src/game/man-rig-data.ts. Run from the repo root: python3 scripts/gen-man-rig.py
"""
import json
import math

import cv2
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as nd

SRC = "src/assets/sprites/folk/man-walk8.webp"
W, H = 160, 240
fr = np.array(Image.open(SRC).convert("RGBA").crop((0, 0, W, H))).astype(np.float32)
A = fr[..., 3] > 8
yy, xx = np.mgrid[0:H, 0:W]

# ---- annotated joints of frame 0 (source px) ----
J = {
    "far": {"hip": (64, 128), "knee": (44, 182), "ankle": (30, 218), "heel": (16, 229), "toe": (50, 236)},
    "near": {"hip": (80, 128), "knee": (98, 182), "ankle": (111, 218), "heel": (110, 236), "toe": (142, 212)},
    "armFar": {"shoulder": (56, 62), "elbow": (37, 102), "wrist": (33, 124), "tip": (30, 146)},
    "armNear": {"shoulder": (91, 64), "elbow": (104, 98), "wrist": (118, 114), "tip": (128, 132)},
}
ARM_POLY = {
    "armFar": [(57, 54), (58, 70), (56, 84), (54, 96), (55, 104), (52, 112), (44, 125), (43, 150), (16, 150), (20, 125), (27, 100), (30, 88), (38, 72), (46, 58)],
    "armNear": [(85, 56), (93, 56), (101, 70), (105, 82), (113, 93), (130, 110), (134, 126), (127, 136), (116, 134), (109, 118), (100, 109), (93, 104), (91, 95), (89, 80), (85, 66)],
}
# body outline behind the arms (back and chest), estimated from the painted shoulders and belt
BACK = [(64, 49), (59, 52), (56, 57), (54.5, 65), (54.5, 78), (55.5, 90), (57, 100), (58, 108)]
CHEST = [(92, 54), (95, 62), (97, 74), (96, 88), (94, 100), (92, 108)]
# hanging belt end (pendulum), its knot is the pivot
BELT_END = [(82, 103), (92, 103), (93, 118), (91, 133), (84, 133), (82, 118)]
BELT_PIVOT = (87, 105)
ROWS = {"neck": 50, "shoulder": 62, "belt": 104, "hemTop": 112, "hem": 150}


def poly_mask(pts):
    im = Image.new("L", (W, H), 0)
    ImageDraw.Draw(im).polygon(pts, fill=1)
    return np.array(im).astype(bool)


def dist(p): return np.hypot(xx - p[0], yy - p[1])


def seg_t(p0, p1):
    ax, ay = p0
    dx, dy = p1[0] - p0[0], p1[1] - p0[1]
    L = math.hypot(dx, dy)
    ux, uy = dx / L, dy / L
    return (xx - ax) * ux + (yy - ay) * uy, np.abs(-(xx - ax) * uy + (yy - ay) * ux), L


def seg_dist(p0, p1):
    t, d, L = seg_t(p0, p1)
    tc = np.clip(t, 0, L)
    ux, uy = (p1[0] - p0[0]) / L, (p1[1] - p0[1]) / L
    return np.hypot(xx - (p0[0] + ux * tc), yy - (p0[1] + uy * tc))


def smoothstep(a, b, x):
    k = np.clip((x - a) / (b - a), 0, 1)
    return k * k * (3 - 2 * k)


def inpaint(img, hole, radius=4):
    """Fill `hole` (bool) of an RGBA float image from its surroundings (colour only, alpha set opaque). Pixels outside
    the painted area first take the colour of the nearest painted pixel, so the fill never pulls in the empty
    (black) background along an outline."""
    out = img.copy()
    if not hole.any(): return out
    valid = (img[..., 3] > 200) & ~hole
    _, (iy, ix) = nd.distance_transform_edt(~valid, return_indices=True)
    base = img[iy, ix, :3]
    filled = cv2.inpaint(np.ascontiguousarray(base.clip(0, 255).astype(np.uint8)), hole.astype(np.uint8), radius, cv2.INPAINT_TELEA).astype(np.float32)
    # the smooth fill gets the painted grain back: high frequencies of the nearby painted cloth (a copy shifted
    # sideways into the hole), so a filled patch does not read as a flat blob
    lum = base.mean(-1)
    hp = lum - nd.gaussian_filter(lum, 2.0)
    for sh in (14, -14, 22, -22):
        moved = np.roll(hp, sh, axis=1)
        ok = np.roll(valid, sh, axis=1) & hole & (np.abs(filled.mean(-1) - np.roll(lum, sh, axis=1)) < 40)
        filled[ok] += moved[ok][:, None] * 0.9
        hole_left = hole & ~ok
        if not hole_left.any(): break
    out[hole, :3] = filled[hole].clip(0, 255)
    out[hole, 3] = 255
    return out


# ---- segmentation (as in P6) ----
arm = {k: A & poly_mask(v) & ~poly_mask(BELT_END) for k, v in ARM_POLY.items()}
rest = A & ~arm["armFar"] & ~arm["armNear"]
r, g, b = fr[..., 0], fr[..., 1], fr[..., 2]
warm = rest & ((r - b > 52) | (yy < 134)) & (yy < 156)
lab, _ = nd.label(warm)
torso = nd.binary_closing(lab == lab[100, 72], iterations=1) & rest
legs = rest & ~torso & (yy >= 128)


def leg_dist(j):
    return np.minimum.reduce([seg_dist(j["hip"], j["knee"]), seg_dist(j["knee"], j["ankle"]), seg_dist(j["ankle"], j["toe"]), seg_dist(j["ankle"], j["heel"])])


farLeg = legs & (leg_dist(J["far"]) <= leg_dist(J["near"]))
nearLeg = legs & ~farLeg

# ---- body: torso + head + tunic, completed behind the arms ----
body = fr.copy()
bodyMask = torso.copy()
# region between the visible body edge and the estimated outline behind each arm
for line, side in ((BACK, -1), (CHEST, 1)):
    poly = list(line) + [(72, line[-1][1]), (72, line[0][1])]
    region = poly_mask(poly) & ~torso
    bodyMask |= region
bodyMask = nd.binary_closing(bodyMask, iterations=2)
# behind the estimated back line the painted pixels are the far shoulder: they belong to the far arm (its rounded
# strip top), otherwise the shoulder stays behind as a square block when the arm swings forward
by = np.array([q[1] for q in BACK], float); bx = np.array([q[0] for q in BACK], float)
xb = np.interp(yy, by, bx)
bodyMask &= ~((xx < xb - 0.5) & (yy >= 52) & (yy <= BACK[-1][1]))
hole = bodyMask & ~(torso & (fr[..., 3] > 200))
hole &= ~(torso & (fr[..., 3] > 8) & ~nd.binary_dilation(arm["armFar"] | arm["armNear"], iterations=2))
body = inpaint(body * bodyMask[..., None], hole)
body[~bodyMask] = 0
# shoulders: the painted shoulder caps stay on the body, faded out softly so the arm strip blends over/under them
for k in ("armNear",):
    sh = J[k]["shoulder"]
    cap = arm[k] & (dist(sh) <= 11) & ~bodyMask
    a = fr[..., 3] * (1 - smoothstep(6, 11, dist(sh)))
    body[cap] = fr[cap]
    body[cap, 3] = a[cap]
# belt end: own piece; the tunic under it is filled
beltMask = poly_mask(BELT_END) & bodyMask & (fr[..., 3] > 8)
belt = np.zeros_like(fr)
belt[beltMask] = fr[beltMask]
body = inpaint(body, nd.binary_dilation(beltMask, iterations=1) & bodyMask, 3)
body[~(bodyMask | (body[..., 3] > 0))] = 0


# ---- ribbons ----
def curve(pts, rad, step=0.5):
    """Centre line through `pts` with corners rounded over ±rad px of arc length (same algorithm as walk-rig.ts):
    returns arc length samples s, positions c(s) and direction angles th(s), and the arc length of each point."""
    seg = [(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]) for i in range(len(pts) - 1)]
    ln = [math.hypot(*v) for v in seg]
    an = [math.atan2(v[1], v[0]) for v in seg]
    S = [0.0]
    for v in ln: S.append(S[-1] + v)
    Ltot = S[-1]

    def theta(s):
        k = 0
        while k < len(ln) - 1 and s > S[k + 1]: k += 1
        th = an[k]
        for i in range(1, len(pts) - 1):
            rr = min(rad, ln[i - 1] / 2, ln[i] / 2)
            if S[i] - rr < s < S[i] + rr:
                d = (an[i] - an[i - 1] + math.pi) % (2 * math.pi) - math.pi
                t = (s - (S[i] - rr)) / (2 * rr)
                th = an[i - 1] + d * t * t * (3 - 2 * t)
        return th

    n = int(math.ceil(Ltot / step)) + 1
    ss = np.linspace(0, Ltot, n)
    th = np.array([theta(s) for s in ss])
    cx = np.zeros(n); cy = np.zeros(n)
    cx[0], cy[0] = pts[0]
    for i in range(1, n):
        h = ss[i] - ss[i - 1]
        a = 0.5 * (th[i] + th[i - 1])
        cx[i] = cx[i - 1] + h * math.cos(a); cy[i] = cy[i - 1] + h * math.sin(a)
    # pin the first joint (index 1) and the last joint (index -2): spread the end error between them
    i1 = np.searchsorted(ss, S[1]); i2 = np.searchsorted(ss, S[-2])
    o1 = (pts[1][0] - cx[i1], pts[1][1] - cy[i1]); cx += o1[0]; cy += o1[1]
    e = (pts[-2][0] - cx[i2], pts[-2][1] - cy[i2])
    w = np.clip((ss - ss[i1]) / max(1e-6, ss[i2] - ss[i1]), 0, 1)
    cx += e[0] * w; cy += e[1] * w
    return ss, cx, cy, th, S


def sample(img, x, y):
    """Bilinear sample of a premultiplied RGBA image at float coordinates (arrays)."""
    x0 = np.floor(x).astype(int); y0 = np.floor(y).astype(int)
    fx = x - x0; fy = y - y0
    out = 0
    for dy, wy in ((0, 1 - fy), (1, fy)):
        for dx, wx in ((0, 1 - fx), (1, fx)):
            xi = np.clip(x0 + dx, 0, W - 1); yi = np.clip(y0 + dy, 0, H - 1)
            ok = ((x0 + dx >= 0) & (x0 + dx < W) & (y0 + dy >= 0) & (y0 + dy < H)).astype(np.float32)
            out = out + img[yi, xi] * (wx * wy * ok)[..., None]
    return out


def ribbon(mask, pts, hw, rad, ext0, ext1, top_fade=None, end_fade=0, fill_top=0, round_top=None):
    """Unrolls the masked limb along its rounded centre line into a (len × 2hw+1) strip, rows = arc length."""
    p = [tuple(map(float, q)) for q in pts]
    d0 = np.subtract(p[1], p[0]); d0 /= np.linalg.norm(d0)
    d1 = np.subtract(p[-1], p[-2]); d1 /= np.linalg.norm(d1)
    p = [tuple(np.subtract(p[0], d0 * ext0))] + p + [tuple(np.add(p[-1], d1 * ext1))]
    ss, cx, cy, th, S = curve(p, rad)
    L = int(math.floor(S[-1]))
    src = fr.copy(); src[~mask] = 0
    pm = src.copy(); pm[..., :3] *= pm[..., 3:] / 255
    rows = np.arange(L + 1, dtype=np.float32)
    cxi = np.interp(rows, ss, cx); cyi = np.interp(rows, ss, cy); thi = np.interp(rows, ss, th)
    cols = np.arange(-hw, hw + 1, dtype=np.float32)
    nx, ny = np.sin(thi), -np.cos(thi)  # normal: toward the walking direction for a limb hanging down
    X = cxi[:, None] + cols[None, :] * nx[:, None]
    Y = cyi[:, None] + cols[None, :] * ny[:, None]
    st = sample(pm, X, Y)
    a = st[..., 3:]
    st[..., :3] = np.where(a > 0, st[..., :3] * 255 / np.maximum(a, 1e-3), 0)
    # rows above the first painted row (thigh tops under the tunic): continue the first solid rows upward
    if fill_top:
        # the thigh's width at its first well-painted row; each column inside it continues its first solid colour
        # upward (median of the three rows below), so the hidden thigh top has no stripes
        a = st[..., 3] > 200
        first = int(np.argmax(a.sum(1) > hw * 0.9))
        c0 = np.nonzero(a[first])[0]
        for c in range(c0.min(), c0.max() + 1):
            rr = np.nonzero(a[:, c])[0]
            if not len(rr): continue
            r0 = rr[0]
            col = np.median(st[r0 + 5:r0 + 13, c, :3], axis=0)  # below the hem shadow painted on the thigh
            st[:r0, c, :3] = col; st[:r0, c, 3] = 255
    # holes inside the limb outline (another part covered it): fill from the strip itself
    a = st[..., 3] > 128
    span = np.zeros_like(a)
    for i in range(st.shape[0]):
        c = np.nonzero(a[i])[0]
        if len(c): span[i, c.min():c.max() + 1] = True
    holes = span & ~a
    st = inpaint(st, holes, 3)
    if top_fade:  # soft start so the strip melts into the shoulder painted on the body
        st[..., 3] *= smoothstep(S[1] + top_fade[0], S[1] + top_fade[1], rows)[:, None]
    if round_top:  # above the joint the limb ends in a rounded cap (a shoulder), not a straight cut
        cc = np.arange(-hw, hw + 1)[None, :]; rr = (rows - S[1])[:, None]
        cap = np.hypot(cc - round_top[1], np.minimum(rr, 0)) <= round_top[0] + 0.5
        st[..., 3] *= np.where(rr < 0, smoothstep(round_top[0] + 1.5, round_top[0] - 0.5, np.hypot(cc - round_top[1], rr)), 1)
    if end_fade:  # soft end over the rigid foot
        st[..., 3] *= 1 - smoothstep(S[-1] - end_fade, S[-1], rows)[:, None]
    return st, p, S


ribbons = {}
for side, m in (("far", farLeg), ("near", nearLeg)):
    j = J[side]
    t2, _, L2 = seg_t(j["knee"], j["ankle"])
    leg = m & ~((t2 > L2 + 3) & (yy > j["ankle"][1] + 2))  # the boot below the ankle belongs to the foot
    st, p, S = ribbon(m, [j["hip"], j["knee"], j["ankle"]], 21, 12.0, 16, 4, end_fade=5, fill_top=1)
    ribbons[side] = (st, p, S)
for side in ("armFar", "armNear"):
    j = J[side]
    # the near arm melts into the shoulder painted on the body; the far arm hangs behind the body, its own round
    # shoulder stays the back's outline
    st, p, S = ribbon(arm[side], [j["shoulder"], j["elbow"], j["wrist"], j["tip"]], 15, 6.0, 8, 8, top_fade=(-6, 5) if side == "armNear" else None, round_top=None if side == "armNear" else (5.5, 0))
    ribbons[side] = (st, p, S)

# feet: rigid, the boot from just above the ankle down
feet = {}
for side, m in (("far", farLeg), ("near", nearLeg)):
    j = J[side]
    t2, _, L2 = seg_t(j["knee"], j["ankle"])
    fm = m & (t2 >= L2 - 8)
    f = np.zeros_like(fr); f[fm] = fr[fm]
    feet[side] = f

# far side darker (it is in shadow behind the body)
for k in ("far", "armFar"):
    ribbons[k][0][..., :3] *= 0.86
# the far shoulder sits in the shadow of the back: darken the strip top toward the joint
st, _, S = ribbons["armFar"]
st[..., :3] *= (0.78 + 0.22 * smoothstep(S[1] - 4, S[1] + 14, np.arange(st.shape[0])))[:, None, None]
feet["far"][..., :3] *= 0.86


def clean(img):
    a = img[..., 3] > 8
    n = nd.uniform_filter(a.astype(np.float32), 5) * 25
    img[(a & (n < 7)) | (img[..., 3] < 24)] = 0
    return img


# ---- atlas: pieces side by side, each at its bounding box ----
pieces = {"body": body, "belt": belt, "farFoot": feet["far"], "nearFoot": feet["near"]}
for k in ("far", "near", "armFar", "armNear"): pieces[k] = ribbons[k][0]
atlas_parts, rects, x = [], {}, 0
for name, img in pieces.items():
    img = clean(img.copy())
    if name in ("body", "belt", "farFoot", "nearFoot"):
        ys, xs = np.nonzero(img[..., 3] > 0)
        y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        crop = img[y0:y1, x0:x1]
        rects[name] = {"rect": [x, 0, int(x1 - x0), int(y1 - y0)], "origin": [int(x0), int(y0)]}
    else:
        crop = img
        rects[name] = {"rect": [x, 0, int(img.shape[1]), int(img.shape[0])]}
    pad = np.zeros((H, crop.shape[1] + 2, 4), np.float32)
    pad[:crop.shape[0], :crop.shape[1]] = crop
    atlas_parts.append(pad)
    x += pad.shape[1]
atlas = np.concatenate(atlas_parts, axis=1).clip(0, 255).astype(np.uint8)
Image.fromarray(atlas, "RGBA").save("src/assets/sprites/folk/man-rig.webp", lossless=True, quality=100, method=6)


def ang(p0, p1): return math.atan2(p1[1] - p0[1], p1[0] - p0[0])


data = {
    "cell": [W, H], "ground": 236, "joints": J, "rows": ROWS,
    "rest": {"farFoot": ang(J["far"]["heel"], J["far"]["toe"]), "nearFoot": ang(J["near"]["heel"], J["near"]["toe"])},
    "pieces": rects,
    "ribbons": {k: {"pts": [[round(a, 3), round(b, 3)] for a, b in ribbons[k][1]], "hw": int((ribbons[k][0].shape[1] - 1) // 2),
                    "rad": 12.0 if k in ("far", "near") else 6.0, "len": int(ribbons[k][0].shape[0])} for k in ribbons},
    "beltPivot": list(BELT_PIVOT),
}
with open("src/game/man-rig-data.ts", "w") as f:
    f.write("/** Generated by scripts/gen-man-rig.py from man-walk8 frame 0 — source px of a 160×240 cell. Do not edit. */\n")
    f.write("export const MAN_RIG = " + json.dumps(data, separators=(",", ":")) + " as const;\n")
print("ok", atlas.shape, {k: v["rect"] for k, v in rects.items()})
