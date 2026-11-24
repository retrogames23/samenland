"""Stand picture for the ordinary man, built only from painted pixels of man-walk8 frame 5 (no generation):
far forearm turned down about the elbow (drawn behind the body), lifted rear leg removed, the planted leg repeated
as the far leg (slightly offset, in shade). Same cell (160 x 240), same centre x 80 and ground row 237."""
import sys, numpy as np
from PIL import Image, ImageEnhance
SRC = sys.argv[1]; OUT = sys.argv[2]
P = dict(pivot=(102, 101), arm_x=103, arm_y=(95, 142), rot=-27, cut_x=64, cut_y=(140, 227), heel_x=56, dx=-7, dy=0, shade=0.78)
for a in sys.argv[3:]: k, v = a.split("="); P[k] = type(P[k])(eval(v)) if not isinstance(P[k], tuple) else eval(v)
w8 = Image.open(SRC).convert("RGBA"); fr = w8.crop((5*160, 0, 6*160, 240)); A = np.asarray(fr).copy()
H, W = A.shape[:2]; yy, xx = np.mgrid[0:H, 0:W]
# 1) far forearm and hand: everything in front of the tunic's front edge between elbow and hem height
arm = (xx >= P["arm_x"]) & (yy >= P["arm_y"][0]) & (yy <= P["arm_y"][1])
armL = A.copy(); armL[~arm] = 0
body = A.copy(); body[arm] = 0
armImg = Image.fromarray(armL).rotate(P["rot"], resample=Image.BICUBIC, center=P["pivot"])
ar = np.asarray(armImg).copy(); ar[:101] = 0; armImg = Image.fromarray(ar)  # the rotated cut edge above the elbow stays hidden
# 2) lifted rear leg: left of the planted leg, from knee height down (the planted boot's heel stays)
# the planted leg's back contour (measured in frame 5; hidden between knee and boot top, there interpolated)
CONT = [(140, 64), (150, 69), (170, 70), (200, 63), (205, 62), (222, 61), (228, 59), (237, 58)]
cx = np.interp(np.arange(H), [p[0] for p in CONT], [p[1] for p in CONT])
rear = (yy >= 140) & (xx < cx[:, None])
body[rear] = 0
# 3) far leg: the planted leg (below the tunic hem) repeated behind, offset and in shade
leg = body.copy(); leg[yy < 138] = 0; leg[xx < P["heel_x"]] = 0
legImg = Image.fromarray(leg); legImg = ImageEnhance.Brightness(legImg).enhance(P["shade"])
la = np.asarray(legImg).copy(); la[..., 3] = leg[..., 3]; legImg = Image.fromarray(la)
# soften the rim light on the planted leg's back edge (it now meets the far leg instead of open air)
for y in range(140, 238):
    xs = np.where(body[y, :, 3] == 255)[0]
    if len(xs) < 6: continue
    x0 = xs.min(); ref = body[y, x0 + 3, :3].astype(int)
    for x in (x0, x0 + 1):
        c = body[y, x, :3].astype(int)
        if c.mean() > ref.mean() + 15: body[y, x, :3] = ((c + ref) // 2).astype(np.uint8)
out = Image.new("RGBA", (W, H), (0, 0, 0, 0))
far = Image.new("RGBA", (W, H), (0, 0, 0, 0)); far.paste(legImg, (P["dx"], P["dy"]), legImg)
out.alpha_composite(far); out.alpha_composite(armImg); out.alpha_composite(Image.fromarray(body))
# the far leg may not reach below the ground row
o = np.asarray(out).copy(); o[238:] = 0
# close the small gap where the turned forearm meets the cuff (fill from opaque neighbours, cuff colours only)
for _ in range(3):
    for y in range(92, 102):
        for x in range(99, 106):
            if o[y, x, 3] >= 200: continue
            nb = [o[y + dy, x + dx] for dy, dx in ((0, -1), (-1, 0), (1, 0), (0, 1), (-1, -1), (1, -1)) if o[y + dy, x + dx, 3] >= 200]
            if len(nb) >= 3 and o[y, x - 1, 3] >= 200: o[y, x, :3] = np.mean([n[:3] for n in nb], 0).astype(np.uint8); o[y, x, 3] = 255
Image.fromarray(o).save(OUT)
