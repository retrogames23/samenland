"""Reproducible Samenland render benchmark (diagnosis only).
usage: python3 bench.py <world lab|europe> <device desktop|mobile> [perf 1|0] [scenarios comma list] [base url]"""
import asyncio, json, os, sys, time
from pathlib import Path
from playwright.async_api import async_playwright

WORLD, DEVICE = sys.argv[1], sys.argv[2]
PERF = sys.argv[3] if len(sys.argv) > 3 else "1"
ONLY = sys.argv[4].split(",") if len(sys.argv) > 4 and sys.argv[4] else None
BASE = sys.argv[5] if len(sys.argv) > 5 else "http://localhost:8080"
OUT = Path("/tmp/browser/perf/raw"); OUT.mkdir(parents=True, exist_ok=True)
CENTER = {"lab": (306, 420), "europe": (324, 442)}[WORLD]   # Testwiek / Roggenfeld (oldest town)
DAY, NIGHT = "2026-11-10T11:00:00Z", "2026-11-10T21:30:00Z"   # 12:00 / 22:30 Berlin
WARM, MEAS = 4, 8
SCEN = [  # name, time, weather, zoom, motion
  ("near_clear_day", DAY, "clear", 2.6, "still"),
  ("near_rain_day", DAY, "rain", 2.6, "still"),
  ("mid_clear_day", DAY, "clear", 0.8, "still"),
  ("overview_clear_day", DAY, "clear", 0.12, "still"),
  ("overview_rain_day", DAY, "rain", 0.12, "still"),
  ("maxout_clear_day", DAY, "clear", 0.025, "still"),
  ("pan_near_clear_day", DAY, "clear", 2.6, "pan"),
  ("zoom_sweep_clear_day", DAY, "clear", 2.6, "zoom"),
  ("near_clear_night", NIGHT, "clear", 2.6, "still"),
  ("overview_clear_night", NIGHT, "clear", 0.12, "still"),
]
# external rAF recorder: identical with and without the probe, so instrumentation overhead is measurable
RAF = """(()=>{const a=[];let on=false;window.__raf={start(){a.length=0;on=true},stop(){on=false;return a.slice()}};
const f=t=>{if(on)a.push(t);requestAnimationFrame(f)};requestAnimationFrame(f);})();"""
FIXT = """(()=>{const T0=%d, R0=Date.now(), D=Date; const off=T0-R0;
class FD extends D{constructor(...a){if(a.length)super(...a);else super(D.now()+off)} static now(){return D.now()+off}}
window.Date=FD;})();"""
MOTION = {"pan": """([cx,cy,z])=>new Promise(r=>{const t0=performance.now();const s=()=>{const e=(performance.now()-t0)/1000;
  window.__perfCam(cx+Math.sin(e*0.6)*18, cy+Math.cos(e*0.45)*14, z); if(e<%d) requestAnimationFrame(s); else r();};s();})""",
 "zoom": """([cx,cy,z])=>new Promise(r=>{const t0=performance.now();const s=()=>{const e=(performance.now()-t0)/1000;
  const zz=Math.exp(Math.log(0.04)+(Math.log(2.6)-Math.log(0.04))*(0.5+0.5*Math.cos(e*0.8))); window.__perfCam(cx,cy,zz); if(e<%d) requestAnimationFrame(s); else r();};s();})"""}

def dist(a):
    if not a: return {}
    s = sorted(a); n = len(s); p = lambda q: s[min(n-1, int(q*n))]
    return {"n": n, "mean": sum(s)/n, "p50": p(.5), "p95": p(.95), "p99": p(.99), "max": s[-1],
            "over33": sum(x > 33 for x in s), "over50": sum(x > 50 for x in s), "over100": sum(x > 100 for x in s), "fps": 1000*n/sum(s) if sum(s) else 0}

async def run():
    sess = json.loads(os.environ["LOVABLE_BROWSER_SUPABASE_SESSION_JSON"]); key = os.environ["LOVABLE_BROWSER_SUPABASE_STORAGE_KEY"]
    results = []
    async with async_playwright() as pw:
        b = await pw.chromium.launch(headless=True, args=["--enable-precise-memory-info", "--js-flags=--expose-gc"])
        for name, ts, wx, zoom, motion in SCEN:
            if ONLY and name not in ONLY: continue
            mob = DEVICE == "mobile"
            ctx = await b.new_context(viewport={"width": 412, "height": 915} if mob else {"width": 1280, "height": 800},
                device_scale_factor=2 if mob else 1, is_mobile=mob, has_touch=mob, timezone_id="Europe/Berlin", locale="de-DE")
            t0 = int(time.mktime(time.strptime(ts, "%Y-%m-%dT%H:%M:%SZ")) - time.timezone) * 1000
            await ctx.add_init_script(RAF)
            await ctx.add_init_script(FIXT % t0)
            page = await ctx.new_page()
            cdp = await ctx.new_cdp_session(page)
            await cdp.send("Performance.enable")
            if mob: await cdp.send("Emulation.setCPUThrottlingRate", {"rate": 4})
            await page.goto(BASE + "/?nosplash", wait_until="domcontentloaded")
            await page.evaluate("([k,v,r])=>{localStorage.setItem(k,v);localStorage.setItem('samenland-realm',r);localStorage.setItem('samenland-guide-seen','1');localStorage.removeItem('samenland-lab-ctl')}", [key, json.dumps(sess), WORLD])
            await page.goto(f"{BASE}/?perf={PERF}&weather={wx}&season=autumn", wait_until="domcontentloaded")
            try: await page.wait_for_function("()=>window.__perfCam", timeout=60000)
            except Exception: print("no __perfCam (perf off?)")
            await page.wait_for_timeout(6000)  # seeds + sprites load
            has = await page.evaluate("()=>!!window.__perfCam")
            cx, cy = CENTER
            if has: await page.evaluate("([x,y,z])=>window.__perfCam(x,y,z)", [cx, cy, zoom])
            await page.wait_for_timeout(WARM*1000)
            if PERF == "1": await page.evaluate("n=>window.__perf.reset(n)", name)
            m0 = {m["name"]: m["value"] for m in (await cdp.send("Performance.getMetrics"))["metrics"]}
            await page.evaluate("()=>window.__raf.start()")
            if motion in MOTION and has: await page.evaluate(MOTION[motion] % MEAS, [cx, cy, zoom])
            else: await page.wait_for_timeout(MEAS*1000)
            raf = await page.evaluate("()=>window.__raf.stop()")
            m1 = {m["name"]: m["value"] for m in (await cdp.send("Performance.getMetrics"))["metrics"]}
            iv = [raf[i+1]-raf[i] for i in range(len(raf)-1)]
            row = {"world": WORLD, "device": DEVICE, "emulated": mob, "perf": PERF, "scenario": name, "time": ts, "weather": wx, "zoom": zoom, "camTile": [cx, cy], "motion": motion,
                   "rafInterval": dist(iv), "cdp": {"TaskDuration": m1.get("TaskDuration",0)-m0.get("TaskDuration",0), "ScriptDuration": m1.get("ScriptDuration",0)-m0.get("ScriptDuration",0),
                   "LayoutDuration": m1.get("LayoutDuration",0)-m0.get("LayoutDuration",0), "JSHeapUsedSize": m1.get("JSHeapUsedSize"), "JSHeapTotalSize": m1.get("JSHeapTotalSize"), "Nodes": m1.get("Nodes")}}
            if PERF == "1":
                row["probe"] = await page.evaluate("()=>window.__perf.summary()")
                (OUT / f"frames_{WORLD}_{DEVICE}_{name}.csv").write_text(await page.evaluate("()=>window.__perf.framesCsv()"))
            await page.screenshot(path=str(OUT / f"shot_{WORLD}_{DEVICE}_{PERF}_{name}.png"))
            r = row["rafInterval"]; print(f"{name:24s} fps {r.get('fps',0):5.1f} p50 {r.get('p50',0):5.1f} p95 {r.get('p95',0):6.1f} p99 {r.get('p99',0):6.1f} max {r.get('max',0):6.1f} >33 {r.get('over33')} >50 {r.get('over50')} >100 {r.get('over100')}", flush=True)
            results.append(row)
            await ctx.close()
        await b.close()
    tag = f"{WORLD}_{DEVICE}_perf{PERF}" + ("_" + BASE.split(":")[-1] if "8080" not in BASE else "")
    f = OUT / f"summary_{tag}.json"
    old = json.loads(f.read_text()) if f.exists() and ONLY else []
    f.write_text(json.dumps([o for o in old if o["scenario"] not in {r["scenario"] for r in results}] + results, indent=1))
asyncio.run(run())
