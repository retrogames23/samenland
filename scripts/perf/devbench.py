import asyncio, os, json
from playwright.async_api import async_playwright
async def run():
    async with async_playwright() as pw:
        b = await pw.chromium.launch(headless=True); ctx = await b.new_context(viewport={"width":1280,"height":800}, accept_downloads=True); page = await ctx.new_page()
        await page.goto("http://localhost:8080/"); await page.evaluate("([k,v])=>{localStorage.setItem(k,v);localStorage.setItem('samenland-realm','lab');localStorage.setItem('samenland-guide-seen','1')}", [os.environ["LOVABLE_BROWSER_SUPABASE_STORAGE_KEY"], os.environ["LOVABLE_BROWSER_SUPABASE_SESSION_JSON"]])
        async with page.expect_download(timeout=150000) as d:
            await page.goto("http://localhost:8080/?perf=1&bench=1&weather=clear&season=autumn&perfclock=2026-11-10T21:30:00Z")
        dl = await d.value; p = "/tmp/browser/perf/raw/devicebench_selftest.json"; await dl.save_as(p)
        x = json.load(open(p)); print([(r["scenario"], round(r["fps"],1), round(r["frameInterval"]["p95"],1)) for r in x])
        print(await page.evaluate("()=>new Date().toISOString()"), await page.locator("text=Herbst").first.inner_text())
        await b.close()
asyncio.run(run())
