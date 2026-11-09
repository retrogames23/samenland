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
T={"3_insel_klein":(321.5,424),"4_zunge_schmal":(300,411)}
OUT="/tmp/p3/kamera"; os.makedirs(OUT,exist_ok=True)
async def run(p,season):
    b=await p.chromium.launch(headless=True,args=["--use-angle=swiftshader","--enable-unsafe-swiftshader"])
    ctx=await b.new_context(viewport={"width":1280,"height":900}); pg=await ctx.new_page()
    await ctx.route("**/*", lambda r: patch(r) if r.request.resource_type=="script" and "localhost" in r.request.url else r.continue_())
    await pg.clock.install(time=NOON); await pg.goto("http://localhost:8080")
    await pg.evaluate("([k,v,se])=>{localStorage.setItem(k,v);localStorage.setItem('samenland-realm','lab');localStorage.setItem('samenland-lab-jump','0');localStorage.setItem('samenland-lab-ctl',JSON.stringify({ev:{},season:se,weather:'clear'}))}",[A["storage_key"],json.dumps(A["session"]),season])
    await pg.goto("http://localhost:8080/"); await pg.wait_for_timeout(9000)
    rows=[]
    for name,(x,y) in [i for i in T.items() if len(sys.argv)<3 or i[0]==sys.argv[2]]:
        for label,z in [q for q in (("2normal",2.4),("0echtnah",4.5)) if len(sys.argv)<3 or q[0]==sys.argv[3]]:
            for _ in range(30):
                okj=await pg.evaluate("([x,y,z])=>window.__labCam?window.__labCam(x,y,z):'fehlt'",[x,y,z])
                if okj is True: break
                await pg.wait_for_timeout(1000)
            await pg.wait_for_timeout(2500)
            ok,ff,h=await complete(pg)
            f=f"{OUT}/{season}_{name}_{label}.png"; await pg.screenshot(path=f)
            rows.append("\t".join(map(str,[season,name,f"{x}:{y}",label,f"z={zoom(h):.2f}",f"sprung={okj}","bake_vollstaendig="+("ja" if ok else "NEIN"),ff,h])))
            print(rows[-1],flush=True)
    open(f"{OUT}/log_{season}.tsv","a").write("\n".join(rows)+"\n"); await b.close()
async def main():
    async with async_playwright() as p:
        await run(p,sys.argv[1])
asyncio.run(main())
