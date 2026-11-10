"""Long session memory drift: europe, desktop, pans across all towns for N minutes, samples heap + gfx every 10 s."""
import asyncio, json, os, sys, time
from pathlib import Path
from playwright.async_api import async_playwright
MIN = float(sys.argv[1]) if len(sys.argv) > 1 else 6
OUT = Path("/tmp/browser/perf3/long")
TOWNS = [(324,442),(322,627),(365,432),(229,413),(144,595),(290,468),(354,480),(299,395)]
async def run():
    sess = os.environ["LOVABLE_BROWSER_SUPABASE_SESSION_JSON"]; key = os.environ["LOVABLE_BROWSER_SUPABASE_STORAGE_KEY"]
    async with async_playwright() as pw:
        b = await pw.chromium.launch(headless=True, args=["--enable-precise-memory-info"])
        ctx = await b.new_context(viewport={"width": 1280, "height": 800}, timezone_id="Europe/Berlin", locale="de-DE")
        await ctx.add_init_script("""(()=>{const T0=Date.UTC(2026,10,10,11),R0=Date.now(),D=Date,off=T0-R0;class FD extends D{constructor(...a){if(a.length)super(...a);else super(D.now()+off)}static now(){return D.now()+off}}window.Date=FD})()""")
        page = await ctx.new_page(); cdp = await ctx.new_cdp_session(page); await cdp.send("Performance.enable")
        await page.goto("http://localhost:8080/", wait_until="domcontentloaded")
        await page.evaluate("([k,v])=>{localStorage.setItem(k,v);localStorage.setItem('samenland-realm','europe');localStorage.setItem('samenland-guide-seen','1')}", [key, sess])
        await page.goto("http://localhost:8080/?perf=1&weather=clear&season=autumn", wait_until="domcontentloaded")
        await page.wait_for_function("()=>window.__perfCam", timeout=60000); await page.wait_for_timeout(8000)
        await page.evaluate("()=>window.__perf.reset('longrun')")
        rows = []; t0 = time.time(); i = 0
        while time.time() - t0 < MIN * 60:
            x, y = TOWNS[i % len(TOWNS)]; z = [0.5, 0.8, 1.2, 2.6, 0.46][(i // len(TOWNS)) % 5]; i += 1
            await page.evaluate("([x,y,z])=>window.__perfCam(x,y,z)", [x, y, z]); await page.wait_for_timeout(10000)
            m = {q["name"]: q["value"] for q in (await cdp.send("Performance.getMetrics"))["metrics"]}
            s = await page.evaluate("()=>{const s=window.__perf.summary();return {gfx:s.graphics, caches:s.caches, cacheBytes:s.bytes, ev:s.evictions}}")
            rows.append({"t_s": round(time.time() - t0), "town": [x, y], "zoom": z, "jsHeapUsed": m["JSHeapUsedSize"], "jsHeapTotal": m["JSHeapTotalSize"], "estGfxBytes": s["gfx"]["estBytes"],
                         "liveCanvas": s["gfx"]["canvas"]["live"], "liveBitmap": s["gfx"]["bitmap"]["live"], "created": s["gfx"]["created"], "cacheBytes": s["cacheBytes"], "caches": s["caches"], "evictions": s["ev"], "flat": await page.evaluate("()=>window.__flatState()")})
            r = rows[-1]; print(r["t_s"], z, round(r["jsHeapUsed"]/2**20), "MB heap", round(r["estGfxBytes"]/2**20), "MB gfx", r["liveCanvas"], "cv", r["liveBitmap"], "bm", flush=True)
        (OUT / "longrun3.json").write_text(json.dumps({"rows": rows, "topDims": s["gfx"]["topDims"], "framesSummary": await page.evaluate("()=>{const s=window.__perf.summary();return {frameInterval:s.frameInterval,drawTime:s.drawTime}}")}, indent=1))
        await b.close()
asyncio.run(run())
