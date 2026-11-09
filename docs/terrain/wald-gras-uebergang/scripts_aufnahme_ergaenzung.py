# Ergänzungsaufnahmen Pilot 3: Zoom >= 4.0, Winter, Bake-Nachweis per Test-Instrumentierung
# Produktionscode bleibt unverändert: render.ts wird nur im Testbrowser beim Laden um Zähler ergänzt.
import asyncio, json, os, sys, time, re
from datetime import datetime, timezone
from playwright.async_api import async_playwright
OUT="/tmp/p3/shots"; os.makedirs(OUT,exist_ok=True)
A=json.load(open(os.path.expanduser("~/.cache/lovable-auth/session.json")))
NOON=datetime(2026,11,9,11,0,0,tzinfo=timezone.utc)
S={"1_saum_gerade":(420,650),"2_rand_unregelmaessig":(690,290),"3_insel_klein":(875,358),"4_zunge_schmal":(662,545),"5_dreifach_wasser":(470,450)}
async def patch(route):
    r=await route.fetch(); body=await r.text()
    n1=len(re.findall(r"if \(!cached && \(baked >= 1 \|\| frameBakes >= 1\)\) \{",body))
    body=re.sub(r"if \(!cached && \(baked >= 1 \|\| frameBakes >= 1\)\) \{", "if (!cached && (baked >= 1 || frameBakes >= 1)) { globalThis.__miss=(globalThis.__miss||0)+1;", body)
    body=re.sub(r"(\n\s*)frameBakes = 0;", r"\1frameBakes = 0; globalThis.__frames=(globalThis.__frames||0)+1;", body)
    if n1: print("instrumented fallback branches:",n1,route.request.url, flush=True)
    await route.fulfill(response=r, body=body)
async def st(pg): return await pg.evaluate("()=>[globalThis.__miss||0,globalThis.__frames||0,document.querySelector('.font-mono')?.textContent||'']")
async def complete(pg,mx=120):
    # Nachweis: mind. 3 vollständige Frames hintereinander ohne einen einzigen Fallback-Chunk
    t0=time.time()
    while time.time()-t0<mx:
        m0,f0,_=await st(pg); await pg.wait_for_timeout(1500); m1,f1,h=await st(pg)
        if f1-f0>=3 and m1==m0: return True,f1-f0,h
    m,f,h=await st(pg); return False,0,h
def zoom(h):
    try: return float(h.split("zoom ")[1].split()[0])
    except: return 0
async def run(p,season,name,zs,log):
    b=await p.chromium.launch(headless=True,args=["--use-angle=swiftshader","--enable-unsafe-swiftshader"])
    ctx=await b.new_context(viewport={"width":1280,"height":900}); pg=await ctx.new_page()
    await ctx.route("**/*", lambda r: patch(r) if r.request.resource_type=="script" and "localhost" in r.request.url else r.continue_())
    await pg.clock.install(time=NOON); await pg.goto("http://localhost:8080")
    await pg.evaluate("([k,v,se])=>{localStorage.setItem(k,v);localStorage.setItem('samenland-realm','lab');localStorage.setItem('samenland-lab-jump','0');localStorage.setItem('samenland-lab-ctl',JSON.stringify({ev:{},season:se,weather:'clear'}))}",[A["storage_key"],json.dumps(A["session"]),season])
    await pg.goto("http://localhost:8080/"); await pg.wait_for_timeout(9000); await pg.mouse.click(640,450)
    tx,ty=296,440; dx=-((tx-ty)-(306-420))*16*2.6; dy=-((tx+ty)-(306+420))*8*2.6
    while abs(dx)>1 or abs(dy)>1:
        sx=int(max(-380,min(380,dx))); sy=int(max(-380,min(380,dy))); dx-=sx; dy-=sy
        if not sx and not sy: break
        await pg.mouse.move(640,450); await pg.mouse.down()
        for i in range(1,11): await pg.mouse.move(640+sx*i/10,450+sy*i/10); await pg.wait_for_timeout(30)
        await pg.mouse.up(); await pg.wait_for_timeout(400)
    for _ in range(3): await pg.keyboard.press("q"); await pg.wait_for_timeout(800)
    cv=pg.locator("canvas").first; px,py=S[name]
    for label,zt in zs:
        await pg.mouse.move(px,py)
        for _ in range(40):
            _,_,h=await st(pg)
            if zoom(h)>=zt: break
            await pg.mouse.wheel(0,-80); await pg.wait_for_timeout(250)
        px,py=640,450
        ok,fr,h=await complete(pg)
        f=f"{OUT}/{season}_{name}_{label}.png"; await cv.screenshot(path=f)
        log.write(f"{season}\t{name}\t{label}\tz={zoom(h):.2f}\t12:00 Berlin\tklar\tbake_vollstaendig={'ja' if ok else 'NEIN'}\tfallbackfreie_frames={fr}\t{h.strip()}\n"); log.flush()
        print(season,name,label,zoom(h),ok,flush=True)
    await b.close()
async def main():
    season=sys.argv[1]; zs=[("2normal",2.4),("0echtnah",4.0)] if season=="winter" else [("0echtnah",4.0)]
    names=sys.argv[2].split(",") if len(sys.argv)>2 else list(S)
    with open(f"/tmp/p3/log3_{season}.tsv","a") as log:
        async with async_playwright() as p:
            for n in names: await run(p,season,n,zs,log)
asyncio.run(main())
