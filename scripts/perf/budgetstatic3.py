"""Audit 3: tight budget, fixed camera: samples the exact flat cache state (window.__flatState) every 2 s."""
import asyncio, json, os, sys
from playwright.async_api import async_playwright
BUD, Z, SECS = sys.argv[1], float(sys.argv[2]), int(sys.argv[3]) if len(sys.argv) > 3 else 120
FIXT = """(()=>{const T0=Date.parse('2026-11-10T11:00:00Z'),D=Date,off=T0-D.now();class FD extends D{constructor(...a){if(a.length)super(...a);else super(D.now()+off)}static now(){return D.now()+off}};window.Date=FD})();"""
async def main():
    sess = os.environ.get("LOVABLE_BROWSER_SUPABASE_SESSION_JSON", ""); key = os.environ.get("LOVABLE_BROWSER_SUPABASE_STORAGE_KEY", "x")
    async with async_playwright() as pw:
        b = await pw.chromium.launch(headless=True); ctx = await b.new_context(viewport={"width": 1280, "height": 800}, timezone_id="Europe/Berlin"); await ctx.add_init_script(FIXT)
        page = await ctx.new_page(); await page.goto("http://localhost:8080/?nosplash", wait_until="domcontentloaded")
        await page.evaluate("([k,v])=>{localStorage.setItem(k,v);localStorage.setItem('samenland-realm','europe');localStorage.setItem('samenland-guide-seen','1')}", [key, sess])
        await page.goto(f"http://localhost:8080/?perf=1&flatbudget={BUD}&weather=clear&season=autumn", wait_until="domcontentloaded")
        await page.wait_for_function("()=>window.__perfCam&&window.__flatState", timeout=90000); await page.wait_for_timeout(6000)
        await page.evaluate("([x,y,z])=>window.__perfCam(x,y,z)", [324, 442, Z])
        for i in range(SECS // 2):
            await page.evaluate("()=>window.__perf.reset('s')"); await page.wait_for_timeout(2000)
            st = await page.evaluate("()=>window.__flatState()"); c = (await page.evaluate("()=>window.__perf.summary()"))["countsPerFrame"]
            print(json.dumps({"t": 2 * i + 2, "heldMB": round(st["estHeldBytes"] / 2**20, 2), "budgetMB": round(st["budget"] / 2**20, 2), "cvMB": round(st["canvasBytes"] / 2**20, 2), "bmMB": round(st["bitmapBytes"] / 2**20, 2), "vis": st["visible"], "adm": st["admitted"], "baked": st["baked"], "ent": st["entries"], "bakesPerFrame": round(c.get("flat.bakeCount", 0), 3), "drop": round(c.get("flat.chunksDropped", 0), 3), "vdrop": round(c.get("flat.visibleChunksDropped", 0), 3), "reasons": {k[10:]: round(v, 2) for k, v in c.items() if k.startswith("flat.stale") and k != "flat.staleArt" or k == "flat.staleArt"}}), flush=True)
        await b.close()
asyncio.run(main())
