"""Performance audit 2 (diagnosis only): zoom sweep, 3 fresh browser contexts per point.
usage: python3 zoomsweep.py <world> <mode coarse|fine|off> <zooms comma list> [reps]
coarse = ?perf=1, fine = ?perf=1&perfdetail=1 (fine spans + structureAt/draw-op counts), off = ?perf=0"""
import asyncio, json, os, sys
from pathlib import Path
from playwright.async_api import async_playwright
WORLD, MODE = sys.argv[1], sys.argv[2]
ZOOMS = [float(z) for z in sys.argv[3].split(",")]
REPS = int(sys.argv[4]) if len(sys.argv) > 4 else 3
OUT = Path("/tmp/browser/perf2/raw"); OUT.mkdir(parents=True, exist_ok=True)
CENTER = {"lab": (306, 420), "europe": (324, 442)}[WORLD]
DAY = "2026-11-10T11:00:00Z"; WARM, MEAS = 4, 6
Q = {"coarse": "perf=1", "fine": "perf=1&perfdetail=1", "off": "perf=0"}[MODE]
RAF = """(()=>{const a=[];let on=false;window.__raf={start(){a.length=0;on=true},stop(){on=false;return a.slice()}};
const f=t=>{if(on)a.push(t);requestAnimationFrame(f)};requestAnimationFrame(f);})();"""
FIXT = """(()=>{const T0=Date.parse('%s'),D=Date,off=T0-D.now();class FD extends D{constructor(...a){if(a.length)super(...a);else super(D.now()+off)}static now(){return D.now()+off}};window.Date=FD})();""" % DAY
def dist(a):
    if not a: return {}
    s = sorted(a); n = len(s); p = lambda q: s[min(n-1, int(q*n))]
    return {"n": n, "p50": p(.5), "p95": p(.95), "p99": p(.99), "max": s[-1], "over33": sum(x > 33 for x in s), "over50": sum(x > 50 for x in s), "over100": sum(x > 100 for x in s), "fps": 1000*n/sum(s) if sum(s) else 0}
async def run():
    sess = os.environ.get("LOVABLE_BROWSER_SUPABASE_SESSION_JSON", ""); key = os.environ.get("LOVABLE_BROWSER_SUPABASE_STORAGE_KEY", "x-nosession")
    async with async_playwright() as pw:
        b = await pw.chromium.launch(headless=True)
        for z in ZOOMS:
            for rep in range(REPS):
                f = OUT / f"{WORLD}_{MODE}_z{z}_r{rep}.json"
                if f.exists(): continue
                ctx = await b.new_context(viewport={"width": 1280, "height": 800}, timezone_id="Europe/Berlin")
                await ctx.add_init_script(FIXT); await ctx.add_init_script(RAF)
                page = await ctx.new_page()
                await page.goto("http://localhost:8080/?nosplash", wait_until="domcontentloaded")
                await page.evaluate("([k,v,r])=>{localStorage.setItem(k,v);localStorage.setItem('samenland-realm',r);localStorage.setItem('samenland-guide-seen','1');localStorage.removeItem('samenland-lab-ctl')}", [key, sess, WORLD])
                await page.goto(f"http://localhost:8080/?{Q}&weather=clear&season=autumn", wait_until="domcontentloaded")
                await page.wait_for_function("()=>window.__perfCam", timeout=90000); await page.wait_for_timeout(6000)
                await page.evaluate("([x,y,z])=>window.__perfCam(x,y,z)", [*CENTER, z]); await page.wait_for_timeout(WARM*1000)
                if MODE != "off": await page.evaluate("n=>window.__perf.reset(n)", f"z{z}")
                await page.evaluate("()=>window.__raf.start()"); await page.wait_for_timeout(MEAS*1000)
                raf = await page.evaluate("()=>window.__raf.stop()")
                iv = [raf[i+1]-raf[i] for i in range(len(raf)-1)]
                row = {"world": WORLD, "mode": MODE, "zoom": z, "rep": rep, "time": DAY, "weather": "clear", "cam": CENTER, "viewport": [1280, 800], "raf": dist(iv)}
                if MODE != "off":
                    sm = await page.evaluate("()=>window.__perf.summary()")
                    row["spans"] = sm["spans"]; row["counts"] = sm["countsPerFrame"]; row["drawTime"] = sm["drawTime"]; row["frames"] = sm["frameInterval"]["n"]
                f.write_text(json.dumps(row)); r = row["raf"]
                if rep == 0: await page.screenshot(path=str(OUT / f"shot_{WORLD}_{MODE}_z{z}.png"))
                print(WORLD, MODE, z, rep, f"fps {r.get('fps',0):.2f} p50 {r.get('p50',0):.0f} n {r.get('n')}", flush=True)
                await ctx.close()
        await b.close()
asyncio.run(run())
