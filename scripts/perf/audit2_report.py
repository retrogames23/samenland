"""Aggregate zoomsweep JSON into medians (audit 2)."""
import json, glob, statistics as S, collections, csv, sys
R = [json.load(open(f)) for f in glob.glob("/tmp/browser/perf2/raw/*.json")]
G = collections.defaultdict(list)
for r in R: G[(r["world"], r["mode"], r["zoom"])].append(r)
med = lambda a: S.median(a) if a else 0
rows = []
for (w, m, z), rs in sorted(G.items()):
    sp = lambda k, f="exclPerFrame": med([r.get("spans", {}).get(k, {}).get(f, 0) for r in rs])
    ct = lambda k: med([r.get("counts", {}).get(k, 0) for r in rs])
    row = {"world": w, "mode": m, "zoom": z, "reps": len(rs), "frames": sum(r["raf"].get("n", 0) for r in rs),
           "fps": med([r["raf"]["fps"] for r in rs]), "p50": med([r["raf"]["p50"] for r in rs]), "p95": med([r["raf"]["p95"] for r in rs]), "p99": med([r["raf"]["p99"] for r in rs]), "max": max(r["raf"]["max"] for r in rs),
           "over100": med([r["raf"]["over100"] for r in rs]), "settle": [r.get("settleSec") for r in rs],
           "draw_incl": sp("draw", "inclPerFrame"), "pass2_incl": sp("near.pass2", "inclPerFrame"), "flat_incl": sp("near.flat", "inclPerFrame"), "ground_incl": sp("near.ground", "inclPerFrame"), "folk_incl": sp("near.folk", "inclPerFrame"),
           "tiles": ct("tiles"), "flatVisible": ct("flat.chunksVisible"), "flatStale": ct("flat.chunksStale"), "flatDropped": ct("flat.chunksDropped"), "unbakedTiles": ct("flat.unbakedTiles")}
    if m == "fine":
        for k in sorted({k for r in rs for k in r["spans"]}): row["x:" + k] = sp(k)
        for k in sorted({k for r in rs for k in r["counts"]}): row["n:" + k] = ct(k)
    rows.append(row)
json.dump(rows, open("/tmp/browser/perf2/medians.json", "w"), indent=1)
keys = sorted({k for r in rows for k in r})
with open("/tmp/browser/perf2/medians.csv", "w", newline="") as f:
    wr = csv.DictWriter(f, fieldnames=keys); wr.writeheader(); [wr.writerow({k: (json.dumps(v) if isinstance(v, list) else v) for k, v in r.items()}) for r in rows]
for r in rows: print(r["world"], r["mode"], r["zoom"], f'fps {r["fps"]:.2f} p50 {r["p50"]:.0f} p95 {r["p95"]:.0f} p99 {r["p99"]:.0f} max {r["max"]:.0f} draw {r["draw_incl"]:.0f} p2 {r["pass2_incl"]:.0f} flat {r["flat_incl"]:.0f} gr {r["ground_incl"]:.0f} tiles {r["tiles"]:.0f} chunks {r["flatVisible"]:.0f}/{r["flatStale"]:.0f}/{r["flatDropped"]:.0f} settle {r["settle"]}')
