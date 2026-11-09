# Ergänzungsaufnahmen Pilot 3: Zoom >= 4.0, Winter, Bake-Nachweis per Test-Instrumentierung
# Produktionscode bleibt unverändert: render.ts wird nur im Testbrowser beim Laden um Zähler ergänzt.
import asyncio, json, os, sys, time, re
from datetime import datetime, timezone
from playwright.async_api import async_playwright
OUT="/tmp/p3i2/shots"; os.makedirs(OUT,exist_ok=True)
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
T={"1_einzelkachel":(319,423),"2_insel_klein":(321.5,424),"3_zunge_schmal":(300,411),"4_saum_gerade":(298,437),"5_saum_unregelmaessig":(288,421),"6_wald_gras_wasser":(284,437)}
V={"0_bisher":None,"B_proto1":{"core":0.75,"grain":2.5},"N_iteration2":{"core":0.75,"grain":2.5,"v2":True}}
Z={"summer":[1.0,2.4,4.5],"winter":[2.4,4.5],"autumn":[2.4,4.5]}
async def run(p,season,var):
    b=await p.chromium.launch(headless=True,args=["--use-angle=swiftshader","--enable-unsafe-swiftshader"])
    ctx=await b.new_context(viewport={"width":1280,"height":900}); pg=await ctx.new_page()
    await ctx.route("**/*", lambda r: patch(r) if r.request.resource_type=="script" and "localhost" in r.request.url else r.continue_())
    await pg.clock.install(time=NOON); await pg.goto("http://localhost:8080")
    ctl={"ev":{},"season":season,"weather":"clear"}
    if V[var]: ctl["edge"]=V[var]
    await pg.evaluate("([k,v,c])=>{localStorage.setItem(k,v);localStorage.setItem('samenland-realm','lab');localStorage.setItem('samenland-lab-jump','0');localStorage.setItem('samenland-lab-ctl',c)}",[A["storage_key"],json.dumps(A["session"]),json.dumps(ctl)])
    await pg.goto("http://localhost:8080/"); await pg.wait_for_timeout(9000); await pg.mouse.move(2,2)
    rows=[]
    for name,(x,y) in T.items():
        for z in Z[season]:
            if os.environ.get('ONLY') and f'{name}_z{z}'!=os.environ['ONLY']: continue
            for _ in range(30):
                okj=await pg.evaluate("([x,y,z])=>window.__labCam?window.__labCam(x,y,z):'fehlt'",[x,y,z])
                if okj is True: break
                await pg.wait_for_timeout(1000)
            await pg.wait_for_timeout(2000)
            ok,ff,h=await complete(pg,240 if z<2 else 120)
            f=f"{OUT}/{season}_{name}_z{z}_{var}.png"; await pg.screenshot(path=f,clip={"x":240,"y":200,"width":800,"height":500})
            rows.append("\t".join(map(str,[season,name,f"{x}:{y}",f"z={z}",var,json.dumps(V[var]),"bake_vollstaendig="+("ja" if ok else "NEIN"),ff,h])))
            print(rows[-1],flush=True)
    open(f"{OUT}/log_{season}_{var}"+("_nach" if os.environ.get("ONLY") else "")+".tsv","w").write("\n".join(rows)+"\n"); await b.close()
async def main():
    async with async_playwright() as p: await run(p,sys.argv[1],sys.argv[2])
asyncio.run(main())
