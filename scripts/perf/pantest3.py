"""Performance audit 3: camera motion test for the flat cache (pan h/v/diag, repeated zoom, far jumps).
Logs flat.* counters per 1 s window; after each phase waits for settling and records the steady state."""
import asyncio, json, os
from pathlib import Path
from playwright.async_api import async_playwright
OUT = Path("/tmp/browser/perf3/pan"); OUT.mkdir(parents=True, exist_ok=True)
C = (324, 442); DAY = "2026-11-10T11:00:00Z"
FIXT = """(()=>{const T0=Date.parse('%s'),D=Date,off=T0-D.now();class FD extends D{constructor(...a){if(a.length)super(...a);else super(D.now()+off)}static now(){return D.now()+off}};window.Date=FD})();""" % DAY
K = ["flat.visibleChunks","flat.visibleAdmitted","flat.visibleBaked","flat.visibleUnbaked","flat.chunksStale","flat.lookaheadChunks","flat.cacheEntries","flat.cacheBytes","flat.canvasBytes","flat.bitmapBytes","flat.chunksDropped","flat.visibleChunksDropped","flat.bakeCount"]
async def window(page, label, log):
    await page.evaluate("n=>window.__perf.reset(n)", label); await page.wait_for_timeout(1000)
    s = await page.evaluate("()=>window.__perf.summary()"); c = s["countsPerFrame"]
    row = {"label": label, **{k: round(c.get(k, 0), 2) for k in K}, "heapMB": s.get("memory", {}).get("usedJSHeapSize", 0) / 1e6 if isinstance(s.get("memory"), dict) else None}
    log.append(row); print(json.dumps(row), flush=True); return row
async def settle(page, label, log, maxs=120):
    for i in range(maxs):
        r = await window(page, f"{label}.settle{i}", log)
        if r["flat.chunksStale"] == 0 and i > 1: return {"settled_s": i + 1, **r}
    return {"settled_s": None, **r}
async def main():
    sess = os.environ.get("LOVABLE_BROWSER_SUPABASE_SESSION_JSON", ""); key = os.environ.get("LOVABLE_BROWSER_SUPABASE_STORAGE_KEY", "x")
    log, res = [], {}
    async with async_playwright() as pw:
        b = await pw.chromium.launch(headless=True)
        ctx = await b.new_context(viewport={"width": 1280, "height": 800}, timezone_id="Europe/Berlin"); await ctx.add_init_script(FIXT)
        page = await ctx.new_page()
        await page.goto("http://localhost:8080/?nosplash", wait_until="domcontentloaded")
        await page.evaluate("([k,v])=>{localStorage.setItem(k,v);localStorage.setItem('samenland-realm','europe');localStorage.setItem('samenland-guide-seen','1')}", [key, sess])
        await page.goto("http://localhost:8080/?perf=1&weather=clear&season=autumn", wait_until="domcontentloaded")
        await page.wait_for_function("()=>window.__perfCam", timeout=90000); await page.wait_for_timeout(6000)
        for z in (0.8, 0.5):
            await page.evaluate("([x,y,z])=>window.__perfCam(x,y,z)", [*C, z]); res[f"start_z{z}"] = await settle(page, f"start_z{z}", log)
            for name, dx, dy in (("h", 1, 0), ("v", 0, 1), ("d", 1, 1)):
                for step in range(40):  # 40 tiles out at 0.5 tile per 50 ms
                    await page.evaluate("([x,y,z])=>window.__perfCam(x,y,z)", [C[0] + dx * step, C[1] + dy * step, z]); await page.wait_for_timeout(50)
                    if step % 20 == 19: await window(page, f"pan_{name}_z{z}_{step}", log)
                res[f"pan_{name}_z{z}"] = await settle(page, f"pan_{name}_z{z}", log)
                await page.evaluate("([x,y,z])=>window.__perfCam(x,y,z)", [*C, z]); await settle(page, f"back_{name}_z{z}", log)
        for i in range(5):
            for z in (0.5, 1.0, 0.7, 0.46):
                await page.evaluate("([x,y,z])=>window.__perfCam(x,y,z)", [*C, z]); await page.wait_for_timeout(700)
        res["zoomcycle"] = await settle(page, "zoomcycle", log)
        for i, p in enumerate([(150, 200), (C[0], C[1]), (520, 300), (C[0], C[1])]):
            await page.evaluate("([x,y,z])=>window.__perfCam(x,y,z)", [*p, 0.6]); res[f"jump{i}"] = await settle(page, f"jump{i}", log)
        await page.screenshot(path=str(OUT / "final.png"))
        await b.close()
    (OUT / "pan.json").write_text(json.dumps({"log": log, "result": res}, indent=1))
asyncio.run(main())
