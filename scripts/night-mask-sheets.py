"""Contact sheets + anomaly hints for night masks still open (decision "open" in src/game/night-masks.lock.json).
Hints only — never approves anything. usage:
  bun -e 'const {nightPairs}=await import("./src/game/building-sprites.ts");await Bun.write("/tmp/pairs.json",JSON.stringify(nightPairs()))'
  python3 scripts/night-mask-sheets.py /tmp/pairs.json <outdir>
"""
import json, sys, os
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage

pairs = json.load(open(sys.argv[1])); out = sys.argv[2]; os.makedirs(out, exist_ok=True)
lock = json.load(open("src/game/night-masks.lock.json"))
CATS = [
    ("1 Wohnhäuser", "hut cottage fachwerk steinhaus handwerker patrician villa tenement townhouse townhouse2 suburb farmhouse"),
    ("2 Handwerk und Gewerbe", "watermill mill millrow bakery workshop warehouse bigstore factory manufactory steamworks fishery lodge stonemason hammerworks smokehouse saltquay herbhut woodcamp granary dairy harbor station"),
    ("3 Kirche, Bildung, Fürsorge", "chapel church belfry badestube infirmary school library university theater opera orangery"),
    ("4 Rat, Herrschaft, Wehr, Handel", "townhall seat1 seat3 firehouse guardhouse exchange guildhall markethall guildtower lighthouse"),
]
STYLE = {"grain": "Flachland", "workshop": "Hügelland (Werkstatt)", "gateway": "Küste (Hafen)"}
SORDER = {"grain": 0, "workshop": 1, "gateway": 2}
cat_of = {k: c for c, ks in CATS for k in ks.split()}
f = lambda u: u.split("?")[0] if u.startswith("/dev-server") else os.path.join(os.getcwd(), u.lstrip("/").split("?")[0])

def analyse(p):
    day = np.asarray(Image.open(f(p["day"])).convert("RGBA")).astype(float)
    sil = day[..., 3] > 8
    lum = (0.3 * day[..., 0] + 0.59 * day[..., 1] + 0.11 * day[..., 2])
    ys, xs = np.nonzero(sil); y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
    hints, stats = [], {}
    nm = np.asarray(Image.open(f(p["night"])).convert("RGBA"))[..., 3] if p["night"] else np.zeros(sil.shape)
    lit = nm > 24
    lab, n = ndimage.label(lit, np.ones((3, 3)))
    blobs = []
    for i, sl in enumerate(ndimage.find_objects(lab), 1):
        m = lab[sl] == i; area = int(m.sum())
        if area < 4: continue
        h, w = m.shape; fill = area / (w * h)
        cy, cx = ndimage.center_of_mass(m); cy = (cy + sl[0].start - y0) / max(1, y1 - y0)
        under = lum[sl][m].mean()
        b = []
        if area / sil.sum() > 0.025: b.append(f"große Fläche {area / sil.sum() * 100:.1f} %")
        if fill > 0.9 and area > 150: b.append("rechteckiger Block")
        if under > 150: b.append(f"über heller Malfläche (Ø{under:.0f}) – Wand/Dach statt Fenster?")
        if cy > 0.97: b.append("am Sockel")
        if b: blobs.append((sl[1].start, sl[0].start, w, h, b))
    stats["areas"] = int(n); stats["share"] = float(lit.sum() / sil.sum())
    # dark compact openings in the day painting without light nearby → possibly missing window
    inner = ndimage.binary_erosion(sil, iterations=4)
    dark = inner & (lum < 60)
    dl, dn = ndimage.label(dark)
    near = ndimage.binary_dilation(lit, iterations=4)
    miss = 0
    for i, sl in enumerate(ndimage.find_objects(dl), 1):
        m = dl[sl] == i; a = m.sum(); h, w = m.shape
        if 12 <= a <= 600 and 0.3 < w / h < 3 and a / (w * h) > 0.45 and not near[sl][m].any(): miss += 1
    stats["dark_unlit"] = miss
    for x, y, w, h, b in blobs[:5]: hints.append(f"Fläche {w}×{h} bei {x},{y}: " + ", ".join(b))
    if miss >= 3: hints.append(f"{miss} dunkle fensterartige Öffnungen ohne Licht im Tagesbild")
    return hints, stats, blobs

def font(s):
    try: return ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", s)
    except OSError: return ImageFont.load_default()
F, FB = font(13), font(18)
open_p = [p for p in pairs if lock[p["key"]]["decision"] == "open"]
res = {p["key"]: analyse(p) for p in open_p}
# variant comparison: same kind across styles/slots
by_kind = {}
for p in open_p + [p for p in pairs if lock[p["key"]]["decision"] != "unlit"]: by_kind.setdefault(p["kind"], {})[p["key"]] = p
for kind, d in by_kind.items():
    if len(d) < 2: continue
    st = {k: (res[k][1] if k in res else analyse(p)[1]) for k, p in d.items()}
    med = np.median([s["share"] for s in st.values()]); medn = np.median([s["areas"] for s in st.values()])
    for k, s in st.items():
        if k not in res: continue
        if med > 0 and (s["share"] > 2.2 * med or s["share"] < med / 2.2): res[k][0].append(f"Lichtanteil {s['share'] * 100:.1f} % weicht stark von Varianten ab (Median {med * 100:.1f} %)")
        if medn >= 3 and (s["areas"] > 2 * medn or s["areas"] < medn / 2): res[k][0].append(f"{s['areas']} Lichtflächen, Varianten im Median {medn:.0f}")

T = 200
def tile(p):
    day = Image.open(f(p["day"])).convert("RGBA")
    if p["mirror"]: day = day.transpose(Image.FLIP_LEFT_RIGHT)
    sc = T / max(day.size); sz = (max(1, int(day.width * sc)), max(1, int(day.height * sc)))
    d = day.resize(sz, Image.LANCZOS)
    ni = Image.open(f(p["night"])).convert("RGBA") if p["night"] else Image.new("RGBA", day.size)
    if p["mirror"]: ni = ni.transpose(Image.FLIP_LEFT_RIGHT)
    ni = ni.resize(sz, Image.LANCZOS)
    bg = (38, 34, 30, 255)
    def on(img): c = Image.new("RGBA", (T, T), bg); c.alpha_composite(img, ((T - sz[0]) // 2, T - sz[1])); return c
    dk = Image.eval(d, lambda v: v); arr = np.asarray(dk).astype(float); arr[..., :3] *= 0.33; dk = Image.fromarray(arr.astype("uint8"))
    ov = np.asarray(on(dk)).astype(float); nn = np.asarray(on(ni)).astype(float)
    a = nn[..., 3:4] / 255; ov[..., :3] = 255 - (255 - ov[..., :3]) * (1 - nn[..., :3] * a / 255)
    hints = res[p["key"]][0]
    W = T * 3 + 16; H = T + 34 + 15 * max(1, len(hints))
    c = Image.new("RGB", (W, H), (250, 244, 232)); dr = ImageDraw.Draw(c)
    for i, im in enumerate([on(d), on(ni), Image.fromarray(ov.astype("uint8"))]): c.paste(im.convert("RGB"), (4 + i * (T + 4), 22))
    dr.text((4, 3), f"{p['key']}  ·  {STYLE[p['style']]}  ·  Variante {p['slot'] + 1}", fill=(40, 30, 20), font=F)
    for i, h in enumerate(hints): dr.text((4, T + 26 + i * 15), "⚠ " + h, fill=(170, 40, 20), font=F)
    if not hints: dr.text((4, T + 26), "keine automatischen Auffälligkeiten", fill=(90, 110, 70), font=F)
    return c

sheets, report = [], ["# Nachtmasken – Auffälligkeiten (nur Hinweise, keine Freigabe)\n"]
for cat, _ in CATS:
    ps = sorted([p for p in open_p if cat_of.get(p["kind"], CATS[1][0]) == cat], key=lambda p: (p["kind"], SORDER[p["style"]], p["slot"]))
    if not ps: continue
    rows, kinds = [], []
    for k in dict.fromkeys(p["kind"] for p in ps):
        rows.append([tile(p) for p in ps if p["kind"] == k]); kinds.append(k)
    # pages of ~6 rows so sheets stay readable
    for pg in range(0, len(rows), 6):
        rr, kk = rows[pg:pg + 6], kinds[pg:pg + 6]
        W = max(sum(t.width + 8 for t in r) for r in rr) + 16
        H = 40 + sum(max(t.height for t in r) + 30 for r in rr)
        s = Image.new("RGB", (W, H), (236, 226, 206)); dr = ImageDraw.Draw(s)
        dr.text((10, 8), f"{cat}  –  Tagesbild | Nachtmaske | Überlagerung   (Seite {pg // 6 + 1})", fill=(40, 30, 20), font=FB)
        y = 40
        for r, k in zip(rr, kk):
            dr.text((10, y), f"Gebäudetyp: {k}", fill=(80, 50, 20), font=F); y += 18
            x = 8
            for t in r: s.paste(t, (x, y)); x += t.width + 8
            y += max(t.height for t in r) + 12
        name = f"{cat.replace(' ', '_').replace(',', '')}_{pg // 6 + 1}.png"; s.save(os.path.join(out, name)); sheets.append(name)
    report.append(f"\n## {cat}\n")
    for p in ps:
        h = res[p["key"]][0]
        report.append(f"- **{p['key']}** ({STYLE[p['style']]}): " + ("; ".join(h) if h else "unauffällig"))
flag = [k for k, v in res.items() if v[0]]
report.insert(1, f"\n{len(open_p)} offene Masken, davon {len(flag)} mit Hinweisen: {', '.join(sorted(flag))}\n")
open(os.path.join(out, "auffaelligkeiten.md"), "w").write("\n".join(report) + "\n")
print(len(open_p), "offen;", len(flag), "auffällig;", len(sheets), "Bögen")
