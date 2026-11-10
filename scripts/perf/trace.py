"""Chrome trace for two scenes (lab, desktop): splits main-thread JS from raster/GPU work."""
import asyncio, json, os, collections
from pathlib import Path
from playwright.async_api import async_playwright
OUT = Path("/tmp/browser/perf/raw")
async def one(b, name, wx, zoom):
    ctx = await b.new_context(viewport={"width": 1280, "height": 800}, timezone_id="Europe/Berlin")
    await ctx.add_init_script("""(()=>{const T0=Date.UTC(2026,10,10,11),R0=Date.now(),D=Date,off=T0-R0;class FD extends D{constructor(...a){if(a.length)super(...a);else super(D.now()+off)}static now(){return D.now()+off}}window.Date=FD})()""")
    page = await ctx.new_page()
    await page.goto("http://localhost:8080/"); await page.evaluate("([k,v])=>{localStorage.setItem(k,v);localStorage.setItem('samenland-realm','lab');localStorage.setItem('samenland-guide-seen','1')}", [os.environ["LOVABLE_BROWSER_SUPABASE_STORAGE_KEY"], os.environ["LOVABLE_BROWSER_SUPABASE_SESSION_JSON"]])
    await page.goto(f"http://localhost:8080/?perf=0&weather={wx}&season=autumn"); await page.wait_for_function("()=>window.__perfCam", timeout=60000); await page.wait_for_timeout(6000)
    await page.evaluate("([z])=>window.__perfCam(306,420,z)", [zoom]); await page.wait_for_timeout(4000)
    f = OUT / f"trace_lab_desktop_{name}.json"
    await b.start_tracing(page=page, path=str(f), categories=["devtools.timeline", "disabled-by-default-devtools.timeline", "gpu", "cc", "viz", "toplevel"])
    await page.wait_for_timeout(5000); await b.stop_tracing(); await ctx.close()
    ev = json.loads(f.read_text()); ev = ev["traceEvents"] if isinstance(ev, dict) else ev
    names = {}
    for e in ev:
        if e.get("ph") == "M" and e.get("name") == "thread_name": names[(e["pid"], e["tid"])] = e["args"]["name"]
    agg = collections.Counter()
    for e in ev:
        if e.get("ph") == "X" and e.get("dur") and e.get("name") in ("RunTask", "ThreadControllerImpl::RunTask"):
            agg[names.get((e["pid"], e["tid"]), "?")] += e["dur"] / 1000
    top = {k: round(v / 5, 1) for k, v in agg.most_common(8)}
    print(name, "busy ms per second by thread:", top, flush=True)
    return name, top
async def run():
    async with async_playwright() as pw:
        b = await pw.chromium.launch(headless=True)
        res = dict([await one(b, "near_clear_day", "clear", 2.6), await one(b, "overview_rain_day", "rain", 0.12)])
        (OUT / "trace_thread_busy.json").write_text(json.dumps(res, indent=1)); await b.close()
asyncio.run(run())
